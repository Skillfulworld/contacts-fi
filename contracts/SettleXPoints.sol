// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);
}

contract SettleXPoints is Ownable2Step, Pausable {
    error AlreadyCheckedInToday();
    error FeeTransferFailed();
    error ZeroAddress();
    error FeeTooHigh(uint256 requested, uint256 max);
    error InvalidSignature();
    error TaskAlreadyMaxClaimed();
    error StaleVoucher();
    error AlreadyReferred();
    error SelfReferral();
    error ReferrerNotFound();

    struct UserRecord {
        uint256 totalPoints;
        uint256 streak;
        uint256 lastCheckInTimestamp;
        uint256 weekCycleDay;
        uint256 weeksCompleted;
        uint256 consecutiveDays;
        // grandPrizeClaimed removed — consecutiveDays == 0 after prize is the canonical signal
    }

    uint256 private constant CHECKIN_COOLDOWN = 20 hours;
    /// @dev Maximum fee the owner can ever set (0.05 USDC). Protects users from runaway fee increases.
    uint256 public constant MAX_CHECKIN_FEE = 50_000;
    uint256 private constant STREAK_GRACE_PERIOD = 48 hours;
    uint256 private constant GRAND_PRIZE_DAY_THRESHOLD = 30;
    uint256 private constant GRAND_PRIZE_BONUS = 45;

    bytes32 public constant TASK_SWAP = keccak256("TASK_SWAP");
    bytes32 public constant TASK_SEND = keccak256("TASK_SEND");
    bytes32 public constant TASK_CONTACT = keccak256("TASK_CONTACT");
    bytes32 public constant TASK_TWITTER = keccak256("TASK_TWITTER");

    uint256 private constant SWAP_TASK_POINTS = 10;
    uint256 private constant SWAP_TASK_MAX_CLAIMS = 3;
    uint256 private constant SEND_TASK_POINTS = 8;
    uint256 private constant SEND_TASK_MAX_CLAIMS = 2;
    uint256 private constant CONTACT_TASK_POINTS = 5;
    uint256 private constant CONTACT_TASK_MAX_CLAIMS = 1;
    uint256 private constant TWITTER_TASK_POINTS = 15;
    uint256 private constant TWITTER_TASK_MAX_CLAIMS = 1;
    uint256 private constant REFERRER_POINTS = 10;
    uint256 private constant REFEREE_POINTS = 5;

    /// @dev Returns the points reward for a given 0-indexed day in the 7-day cycle.
    function _weeklyReward(uint256 day) private pure returns (uint256) {
        if (day == 0) return 5;
        if (day == 1) return 6;
        if (day == 2) return 7;
        if (day == 3) return 8;
        if (day == 4) return 9;
        if (day == 5) return 10;
        return 15; // day 6
    }

    function _today() private view returns (uint256) {
        return block.timestamp / 1 days;
    }

    function _taskConfig(bytes32 taskId) private pure returns (uint256 points, uint256 maxClaims) {
        if (taskId == TASK_SWAP) return (SWAP_TASK_POINTS, SWAP_TASK_MAX_CLAIMS);
        if (taskId == TASK_SEND) return (SEND_TASK_POINTS, SEND_TASK_MAX_CLAIMS);
        revert InvalidSignature();
    }

    address public immutable usdcToken;
    address public platformWallet;
    address public operator;
    uint256 public checkInFee = 10_000;

    mapping(address user => UserRecord) private userRecords;
    // tracks how many times a user claimed a task on a given day
    mapping(address user => mapping(bytes32 taskId => mapping(uint256 day => uint256 count))) private taskClaims;
    mapping(address => bool) private hasBeenReferred;
    mapping(address => uint256) public referralCount;
    /// @dev Per-user nonce for task vouchers — included in signed payload to prevent replay
    mapping(address => uint256) public taskNonces;
    /// @dev Used voucher digests to prevent the same voucher being submitted twice
    mapping(bytes32 => bool) private usedVouchers;
    /// @dev Minimum points a referrer must have earned before receiving referral rewards (~2 check-ins)
    uint256 private constant MIN_REFERRER_POINTS = 20;

    event CheckedIn(
        address indexed user,
        uint256 day,
        uint256 points,
        uint256 streak,
        uint256 totalPoints,
        uint256 timestamp
    );
    event GrandPrizeClaimed(address indexed user, uint256 bonusPoints, uint256 streak);
    event CheckInFeeUpdated(uint256 oldFee, uint256 newFee);
    event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event TaskClaimed(address indexed user, bytes32 indexed taskId, uint256 points, uint256 totalPoints);
    event TwitterTaskApproved(address indexed user, uint256 points);
    event ReferralClaimed(address indexed referrer, address indexed referee, uint256 referrerPoints, uint256 refereePoints);
    event OperatorUpdated(address indexed oldOperator, address indexed newOperator);

    constructor(address _usdcToken, address _platformWallet, address _initialOwner, address _operator) Ownable(_initialOwner) {
        // Note: _initialOwner zero-check is handled by OZ Ownable before this body runs.
        if (_usdcToken == address(0) || _platformWallet == address(0) || _operator == address(0)) {
            revert ZeroAddress();
        }

        usdcToken = _usdcToken;
        platformWallet = _platformWallet;
        operator = _operator;
    }

    function checkIn() external whenNotPaused {
        UserRecord storage record = userRecords[msg.sender];
        uint256 currentTimestamp = block.timestamp;

        if (currentTimestamp < record.lastCheckInTimestamp + CHECKIN_COOLDOWN) {
            revert AlreadyCheckedInToday();
        }

        if (record.lastCheckInTimestamp != 0 && currentTimestamp <= record.lastCheckInTimestamp + STREAK_GRACE_PERIOD) {
            record.streak += 1;
            record.consecutiveDays += 1;
        } else {
            record.streak = 1;
            record.consecutiveDays = 1;
            record.weekCycleDay = 0;
        }

        uint256 day = record.weekCycleDay;
        uint256 pointsAwarded = _weeklyReward(day);

        if (day == 6) {
            record.weekCycleDay = 0;
            record.weeksCompleted += 1;
        } else {
            record.weekCycleDay = day + 1;
        }

        if (record.consecutiveDays == GRAND_PRIZE_DAY_THRESHOLD) {
            pointsAwarded += GRAND_PRIZE_BONUS;
            record.consecutiveDays = 0; // reset so the prize can be earned again
            emit GrandPrizeClaimed(msg.sender, GRAND_PRIZE_BONUS, record.streak);
        }

        record.totalPoints += pointsAwarded;

        bool success = IERC20(usdcToken).transferFrom(msg.sender, platformWallet, checkInFee);
        if (!success) {
            revert FeeTransferFailed();
        }

        record.lastCheckInTimestamp = currentTimestamp;

        emit CheckedIn(msg.sender, day + 1, pointsAwarded, record.streak, record.totalPoints, currentTimestamp);
    }

    function claimTask(bytes32 taskId, uint256 day, uint256 nonce, bytes calldata sig) external whenNotPaused {
        uint256 today = _today();
        if (day != today) {
            revert StaleVoucher();
        }

        (uint256 points, uint256 maxClaims) = _taskConfig(taskId);

        // Bind voucher to: user + taskId + day + nonce (prevents replay of the same voucher)
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, taskId, day, nonce));
        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        // Reject vouchers that have already been submitted
        if (usedVouchers[digest]) {
            revert InvalidSignature();
        }

        (address recovered, ECDSA.RecoverError recoverError, ) = ECDSA.tryRecover(digest, sig);
        if (recoverError != ECDSA.RecoverError.NoError || recovered != operator) {
            revert InvalidSignature();
        }

        uint256 claims = taskClaims[msg.sender][taskId][day];
        if (claims >= maxClaims) {
            revert TaskAlreadyMaxClaimed();
        }

        // Mark voucher as used and increment nonce
        usedVouchers[digest] = true;
        taskNonces[msg.sender] += 1;
        taskClaims[msg.sender][taskId][day] = claims + 1;

        UserRecord storage record = userRecords[msg.sender];
        record.totalPoints += points;

        emit TaskClaimed(msg.sender, taskId, points, record.totalPoints);
    }

    function claimContactTask() external whenNotPaused {
        uint256 today = _today();
        uint256 claims = taskClaims[msg.sender][TASK_CONTACT][today];
        if (claims >= CONTACT_TASK_MAX_CLAIMS) {
            revert TaskAlreadyMaxClaimed();
        }

        taskClaims[msg.sender][TASK_CONTACT][today] = claims + 1;

        UserRecord storage record = userRecords[msg.sender];
        record.totalPoints += CONTACT_TASK_POINTS;

        emit TaskClaimed(msg.sender, TASK_CONTACT, CONTACT_TASK_POINTS, record.totalPoints);
    }

    function approveTwitterTask(address user) external onlyOwner {
        uint256 today = _today();
        uint256 claims = taskClaims[user][TASK_TWITTER][today];
        if (claims >= TWITTER_TASK_MAX_CLAIMS) {
            revert TaskAlreadyMaxClaimed();
        }

        taskClaims[user][TASK_TWITTER][today] = claims + 1;

        UserRecord storage record = userRecords[user];
        record.totalPoints += TWITTER_TASK_POINTS;

        emit TwitterTaskApproved(user, TWITTER_TASK_POINTS);
        emit TaskClaimed(user, TASK_TWITTER, TWITTER_TASK_POINTS, record.totalPoints);
    }

    function claimReferral(address referrer) external whenNotPaused {
        if (hasBeenReferred[msg.sender]) {
            revert AlreadyReferred();
        }
        if (referrer == msg.sender) {
            revert SelfReferral();
        }
        if (referrer == address(0) || userRecords[referrer].totalPoints < MIN_REFERRER_POINTS) {
            revert ReferrerNotFound();
        }

        hasBeenReferred[msg.sender] = true;
        referralCount[referrer] += 1;

        UserRecord storage referrerRecord = userRecords[referrer];
        UserRecord storage refereeRecord = userRecords[msg.sender];

        referrerRecord.totalPoints += REFERRER_POINTS;
        refereeRecord.totalPoints += REFEREE_POINTS;

        emit ReferralClaimed(referrer, msg.sender, REFERRER_POINTS, REFEREE_POINTS);
    }

    function getUserRecord(address user) external view returns (UserRecord memory) {
        return userRecords[user];
    }

    function canCheckIn(address user) external view returns (bool) {
        UserRecord storage record = userRecords[user];

        if (record.lastCheckInTimestamp == 0) {
            return true;
        }

        return block.timestamp >= record.lastCheckInTimestamp + CHECKIN_COOLDOWN;
    }

    function getTotalPoints(address user) external view returns (uint256) {
        return userRecords[user].totalPoints;
    }

    function getStreak(address user) external view returns (uint256) {
        return userRecords[user].streak;
    }

    function getTaskNonce(address user) external view returns (uint256) {
        return taskNonces[user];
    }

    function getTaskClaimsToday(address user, bytes32 taskId) external view returns (uint256) {
        return taskClaims[user][taskId][_today()];
    }

    function hasReferralBeenClaimed(address user) external view returns (bool) {
        return hasBeenReferred[user];
    }

    function getReferralCount(address referrer) external view returns (uint256) {
        return referralCount[referrer];
    }

    function setCheckInFee(uint256 newFee) external onlyOwner {
        if (newFee > MAX_CHECKIN_FEE) revert FeeTooHigh(newFee, MAX_CHECKIN_FEE);
        uint256 oldFee = checkInFee;
        checkInFee = newFee;

        emit CheckInFeeUpdated(oldFee, newFee);
    }

    function setPlatformWallet(address newWallet) external onlyOwner {
        if (newWallet == address(0)) {
            revert ZeroAddress();
        }

        address oldWallet = platformWallet;
        platformWallet = newWallet;

        emit PlatformWalletUpdated(oldWallet, newWallet);
    }

    function setOperator(address newOperator) external onlyOwner {
        if (newOperator == address(0)) {
            revert ZeroAddress();
        }

        address oldOperator = operator;
        operator = newOperator;

        emit OperatorUpdated(oldOperator, newOperator);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @dev Prevent ownership renouncement — would permanently lock the contract if paused.
    function renounceOwnership() public view override onlyOwner {
        revert("SettleXPoints: renounceOwnership is disabled");
    }
}
