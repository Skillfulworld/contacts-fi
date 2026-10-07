// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);
}

contract SettleXPoints is Ownable2Step, Pausable {
    error AlreadyCheckedInToday();
    error FeeTransferFailed();
    error ZeroAddress();
    error FeeTooHigh(uint256 requested, uint256 max);

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

    address public immutable usdcToken;
    address public platformWallet;
    uint256 public checkInFee = 10_000;

    mapping(address user => UserRecord) private userRecords;

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

    constructor(address _usdcToken, address _platformWallet, address _initialOwner) Ownable(_initialOwner) {
        // Note: _initialOwner zero-check is handled by OZ Ownable before this body runs.
        if (_usdcToken == address(0) || _platformWallet == address(0)) {
            revert ZeroAddress();
        }

        usdcToken = _usdcToken;
        platformWallet = _platformWallet;
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
