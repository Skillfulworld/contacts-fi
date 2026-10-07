// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test, console2} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

import {SettleXPoints} from "../SettleXPoints.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";

// ─────────────────────────────────────────────────────────────────────────────
// Handler for invariant testing
// ─────────────────────────────────────────────────────────────────────────────

contract CheckInHandler is Test {
    SettleXPoints public points;
    MockERC20 public usdc;

    // Ghost variables the invariant checks against.
    uint256 public ghostTotalPoints;   // sum of all points awarded
    uint256 public ghostCheckInCount;  // total successful check-ins

    // A fixed set of users driven by the fuzzer.
    address[] internal _users;

    uint256 internal constant COOLDOWN = 20 hours;

    constructor(SettleXPoints _points, MockERC20 _usdc, address[] memory users) {
        points = _points;
        usdc = _usdc;
        _users = users;
    }

    /// @dev Advance time and perform a check-in for a bounded user index.
    function doCheckIn(uint256 userIndex, uint256 warpSeconds) external {
        userIndex = bound(userIndex, 0, _users.length - 1);
        warpSeconds = bound(warpSeconds, COOLDOWN, 72 hours);
        address user = _users[userIndex];

        skip(warpSeconds);

        // Ensure user has a balance and allowance.
        usdc.mint(user, 10_000);

        vm.prank(user);
        try points.checkIn() {
            ghostTotalPoints += points.getTotalPoints(user);
            ghostCheckInCount += 1;
        } catch {
            // ignore — e.g. paused (not used in handler)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main test contract
// ─────────────────────────────────────────────────────────────────────────────

contract SettleXPointsTest is Test {
    // ── constants from the contract ─────────────────────────────────────────
    uint256 internal constant CHECKIN_COOLDOWN = 20 hours;
    uint256 internal constant STREAK_GRACE_PERIOD = 48 hours;
    uint256 internal constant GRAND_PRIZE_DAY_THRESHOLD = 30;
    uint256 internal constant GRAND_PRIZE_BONUS = 45;
    uint256 internal constant MAX_CHECKIN_FEE = 100_000;
    uint256 internal constant DEFAULT_FEE = 10_000;

    // Weekly rewards schedule (0-indexed day → points).
    uint256[7] internal DAILY_REWARDS = [uint256(5), 6, 7, 8, 9, 10, 15];

    // ── actors ───────────────────────────────────────────────────────────────
    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal platformWallet = makeAddr("platformWallet");
    address internal stranger = makeAddr("stranger");

    // ── contracts ────────────────────────────────────────────────────────────
    MockERC20 internal usdc;
    SettleXPoints internal sxp;

    // ── events (re-declared for expectEmit) ──────────────────────────────────
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

    // ── helpers ──────────────────────────────────────────────────────────────

    /// Mint `amount` USDC to `user` — no allowance needed since MockERC20.transferFrom
    /// bypasses the on-chain allowance check for simplicity.
    function _fund(address user, uint256 amount) internal {
        usdc.mint(user, amount);
    }

    /// Perform one check-in as `user` (must already be funded).
    function _checkIn(address user) internal {
        vm.prank(user);
        sxp.checkIn();
    }

    /// Warp forward by `delta` seconds, then check in as `user`.
    function _warpAndCheckIn(address user, uint256 delta) internal {
        skip(delta);
        _checkIn(user);
    }

    // ─────────────────────────────────────────────────────────────────────────

    function setUp() public {
        // Deploy mock USDC and seed the contract with a known start timestamp.
        usdc = new MockERC20("Mock USDC", "mUSDC", 6);

        // Start from a non-zero timestamp so timestamp-0 branch never fires
        // inadvertently during streak logic.
        vm.warp(1_000_000);

        vm.prank(owner);
        sxp = new SettleXPoints(address(usdc), platformWallet, owner);

        // Give alice and bob plenty of USDC.
        _fund(alice, 10_000_000);
        _fund(bob, 10_000_000);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 1. DEPLOYMENT & INITIALISATION
    // ═════════════════════════════════════════════════════════════════════════

    function test_Constructor_SetsImmutables() public view {
        assertEq(sxp.usdcToken(), address(usdc));
        assertEq(sxp.platformWallet(), platformWallet);
        assertEq(sxp.owner(), owner);
        assertEq(sxp.checkInFee(), DEFAULT_FEE);
    }

    function test_Constructor_RevertZeroUsdc() public {
        vm.expectRevert(SettleXPoints.ZeroAddress.selector);
        new SettleXPoints(address(0), platformWallet, owner);
    }

    function test_Constructor_RevertZeroPlatformWallet() public {
        vm.expectRevert(SettleXPoints.ZeroAddress.selector);
        new SettleXPoints(address(usdc), address(0), owner);
    }

    function test_Constructor_RevertZeroOwner() public {
        // OZ Ownable's constructor fires OwnableInvalidOwner(address(0)) before
        // SettleXPoints's own ZeroAddress check can run — expect the OZ error.
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableInvalidOwner.selector, address(0))
        );
        new SettleXPoints(address(usdc), platformWallet, address(0));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 2. canCheckIn()
    // ═════════════════════════════════════════════════════════════════════════

    function test_CanCheckIn_TrueForNewUser() public view {
        assertTrue(sxp.canCheckIn(alice));
    }

    function test_CanCheckIn_FalseWithin20Hours() public {
        _checkIn(alice);
        assertFalse(sxp.canCheckIn(alice));
    }

    function test_CanCheckIn_FalseAtExactly20HoursMinus1() public {
        _checkIn(alice);
        skip(CHECKIN_COOLDOWN - 1);
        assertFalse(sxp.canCheckIn(alice));
    }

    function test_CanCheckIn_TrueAfter20Hours() public {
        _checkIn(alice);
        skip(CHECKIN_COOLDOWN);
        assertTrue(sxp.canCheckIn(alice));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 3. checkIn() — happy path: first check-in
    // ═════════════════════════════════════════════════════════════════════════

    function test_CheckIn_FirstCheckIn_Awards5Points() public {
        _checkIn(alice);
        assertEq(sxp.getTotalPoints(alice), 5);
    }

    function test_CheckIn_FirstCheckIn_SetsStreak1() public {
        _checkIn(alice);
        assertEq(sxp.getStreak(alice), 1);
    }

    function test_CheckIn_FirstCheckIn_TransfersFeeToWallet() public {
        uint256 walletBefore = usdc.balanceOf(platformWallet);
        _checkIn(alice);
        assertEq(usdc.balanceOf(platformWallet), walletBefore + DEFAULT_FEE);
    }

    function test_CheckIn_FirstCheckIn_DeductsFeeFromUser() public {
        uint256 aliceBefore = usdc.balanceOf(alice);
        _checkIn(alice);
        assertEq(usdc.balanceOf(alice), aliceBefore - DEFAULT_FEE);
    }

    function test_CheckIn_FirstCheckIn_SetsLastCheckInTimestamp() public {
        uint256 ts = block.timestamp;
        _checkIn(alice);
        SettleXPoints.UserRecord memory r = sxp.getUserRecord(alice);
        assertEq(r.lastCheckInTimestamp, ts);
    }

    function test_CheckIn_FirstCheckIn_EmitsCheckedIn() public {
        uint256 ts = block.timestamp;
        vm.expectEmit(true, false, false, true, address(sxp));
        // day emitted is day+1 = 0+1 = 1; points=5; streak=1; totalPoints=5
        emit CheckedIn(alice, 1, 5, 1, 5, ts);
        _checkIn(alice);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 4. checkIn() — revert paths
    // ═════════════════════════════════════════════════════════════════════════

    function test_CheckIn_Revert_AlreadyCheckedInToday_Immediately() public {
        _checkIn(alice);
        vm.expectRevert(SettleXPoints.AlreadyCheckedInToday.selector);
        _checkIn(alice);
    }

    function test_CheckIn_Revert_AlreadyCheckedInToday_Before20Hours() public {
        _checkIn(alice);
        skip(CHECKIN_COOLDOWN - 1);
        vm.expectRevert(SettleXPoints.AlreadyCheckedInToday.selector);
        _checkIn(alice);
    }

    function test_CheckIn_Revert_WhenPaused() public {
        vm.prank(owner);
        sxp.pause();

        vm.expectRevert(Pausable.EnforcedPause.selector);
        _checkIn(alice);
    }

    function test_CheckIn_Revert_FeeTransferFailed() public {
        usdc.setTransferFromResult(false);
        vm.expectRevert(SettleXPoints.FeeTransferFailed.selector);
        _checkIn(alice);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 5. checkIn() — streak continuation (within 48 h)
    // ═════════════════════════════════════════════════════════════════════════

    function test_CheckIn_StreakContinues_Within48Hours() public {
        _checkIn(alice);
        _warpAndCheckIn(alice, 24 hours);
        assertEq(sxp.getStreak(alice), 2);
    }

    function test_CheckIn_StreakContinues_At48HoursExact() public {
        _checkIn(alice);
        // 48 hours exactly still within grace period (<=)
        _warpAndCheckIn(alice, STREAK_GRACE_PERIOD);
        assertEq(sxp.getStreak(alice), 2);
    }

    function test_CheckIn_StreakContinues_AccumulatesCorrectPoints() public {
        _checkIn(alice);                        // day 0 → 5 pts
        _warpAndCheckIn(alice, 24 hours);       // day 1 → 6 pts
        _warpAndCheckIn(alice, 24 hours);       // day 2 → 7 pts
        assertEq(sxp.getTotalPoints(alice), 5 + 6 + 7);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 6. checkIn() — streak reset (after 48+ hours)
    // ═════════════════════════════════════════════════════════════════════════

    function test_CheckIn_StreakResets_After48HoursPlus1() public {
        _checkIn(alice);
        _warpAndCheckIn(alice, STREAK_GRACE_PERIOD + 1);
        assertEq(sxp.getStreak(alice), 1);
    }

    function test_CheckIn_StreakResets_WeekCycleDayGoesTo0() public {
        // Advance to day 3 of the cycle.
        _checkIn(alice);
        _warpAndCheckIn(alice, 24 hours);
        _warpAndCheckIn(alice, 24 hours);
        _warpAndCheckIn(alice, 24 hours);

        SettleXPoints.UserRecord memory r = sxp.getUserRecord(alice);
        assertEq(r.weekCycleDay, 4); // now on day index 4

        // Break the streak — next check-in should reset weekCycleDay to 0.
        _warpAndCheckIn(alice, STREAK_GRACE_PERIOD + 1);
        r = sxp.getUserRecord(alice);
        assertEq(r.weekCycleDay, 1); // after reset to 0 and first check-in increments to 1
    }

    function test_CheckIn_StreakResets_AwardsDay0Points() public {
        _checkIn(alice);
        _warpAndCheckIn(alice, 24 hours); // day 1 → 6 pts

        // Reset — should award day 0 = 5 pts again.
        _warpAndCheckIn(alice, STREAK_GRACE_PERIOD + 1);
        assertEq(sxp.getTotalPoints(alice), 5 + 6 + 5);
    }

    function test_CheckIn_StreakResets_ConsecutiveDaysReset() public {
        _checkIn(alice);
        _warpAndCheckIn(alice, 24 hours);
        _warpAndCheckIn(alice, 24 hours);

        // Break streak.
        _warpAndCheckIn(alice, STREAK_GRACE_PERIOD + 1);
        SettleXPoints.UserRecord memory r = sxp.getUserRecord(alice);
        assertEq(r.consecutiveDays, 1);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 7. checkIn() — 7-day cycle
    // ═════════════════════════════════════════════════════════════════════════

    function test_CheckIn_7DayCycle_FullCyclePoints() public {
        uint256 expectedTotal;
        for (uint256 i = 0; i < 7; i++) {
            if (i > 0) skip(24 hours);
            expectedTotal += DAILY_REWARDS[i];
            _checkIn(alice);
            assertEq(sxp.getTotalPoints(alice), expectedTotal, "wrong points at day");
        }
    }

    function test_CheckIn_7DayCycle_WeekCycleDayResetsAfterDay6() public {
        for (uint256 i = 0; i < 7; i++) {
            if (i > 0) skip(24 hours);
            _checkIn(alice);
        }
        // After 7 consecutive check-ins, weekCycleDay should wrap back to 0
        // and the next check-in starts a new cycle from day 0.
        SettleXPoints.UserRecord memory r = sxp.getUserRecord(alice);
        assertEq(r.weekCycleDay, 0);
        assertEq(r.weeksCompleted, 1);
    }

    function test_CheckIn_7DayCycle_Day7EmitsCorrectDay() public {
        for (uint256 i = 0; i < 6; i++) {
            if (i > 0) skip(24 hours);
            _checkIn(alice);
        }
        skip(24 hours);
        // 7th check-in: weekCycleDay=6 → emits day=7 (day+1), 15 pts
        vm.expectEmit(true, false, false, true, address(sxp));
        uint256 expectedTotal = 5 + 6 + 7 + 8 + 9 + 10 + 15;
        emit CheckedIn(alice, 7, 15, 7, expectedTotal, block.timestamp);
        _checkIn(alice);
    }

    function test_CheckIn_8thDay_StartsNewCycleAtDay0() public {
        for (uint256 i = 0; i < 7; i++) {
            if (i > 0) skip(24 hours);
            _checkIn(alice);
        }
        // 8th check-in: weekCycleDay has reset to 0 → awards 5 pts.
        uint256 totalBefore = sxp.getTotalPoints(alice);
        skip(24 hours);
        _checkIn(alice);
        assertEq(sxp.getTotalPoints(alice), totalBefore + 5);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 8. checkIn() — 30-day grand prize
    // ═════════════════════════════════════════════════════════════════════════

    /// @dev Helper: advance `n` check-ins for alice (≥20h apart, ≤48h for streak).
    function _doNCheckIns(address user, uint256 n) internal {
        for (uint256 i = 0; i < n; i++) {
            if (i > 0) skip(24 hours);
            _checkIn(user);
        }
    }

    function test_GrandPrize_AwardsBonusPointsOn30thDay() public {
        // Do 29 check-ins to reach consecutiveDays == 29.
        _doNCheckIns(alice, 29);
        uint256 totalBefore = sxp.getTotalPoints(alice);

        // 30th check-in — should award day points + 45 bonus.
        // 30 % 7 = day index: 30th is at cycle day (29 % 7) = 1 → 6 pts + 45 = 51.
        skip(24 hours);
        _checkIn(alice);

        uint256 totalAfter = sxp.getTotalPoints(alice);
        // The increment must be day points + 45 bonus.
        uint256 dayIndexOf30th = 29 % 7; // 1
        uint256 expectedIncrement = DAILY_REWARDS[dayIndexOf30th] + GRAND_PRIZE_BONUS;
        assertEq(totalAfter - totalBefore, expectedIncrement);
    }

    function test_GrandPrize_EmitsGrandPrizeClaimed() public {
        _doNCheckIns(alice, 29);
        skip(24 hours);

        vm.expectEmit(true, false, false, true, address(sxp));
        emit GrandPrizeClaimed(alice, GRAND_PRIZE_BONUS, 30);
        _checkIn(alice);
    }

    function test_GrandPrize_ConsecutiveDaysResetsTo0() public {
        _doNCheckIns(alice, 30);
        SettleXPoints.UserRecord memory r = sxp.getUserRecord(alice);
        assertEq(r.consecutiveDays, 0);
    }

    function test_GrandPrize_OnlyOnceEvery30Days() public {
        // First 30-day grand prize.
        _doNCheckIns(alice, 30);
        uint256 afterFirst = sxp.getTotalPoints(alice);

        // Read the actual weekCycleDay after the grand prize check-in so we compute
        // expected points correctly (it was NOT reset to 0 — it kept advancing).
        SettleXPoints.UserRecord memory rAfterPrize = sxp.getUserRecord(alice);
        uint256 startDay = rAfterPrize.weekCycleDay;

        // Next 29 check-ins — no bonus expected (consecutiveDays reaches 29, not 30).
        for (uint256 i = 0; i < 29; i++) {
            skip(24 hours);
            _checkIn(alice);
        }
        uint256 midwayTotal = sxp.getTotalPoints(alice);
        uint256 incrementFromNext29 = midwayTotal - afterFirst;

        // Calculate expected points for those 29 days, starting from `startDay`.
        uint256 expectedNext29 = 0;
        uint256 cycleDayTracker = startDay;
        for (uint256 i = 0; i < 29; i++) {
            expectedNext29 += DAILY_REWARDS[cycleDayTracker];
            cycleDayTracker = (cycleDayTracker == 6) ? 0 : cycleDayTracker + 1;
        }
        assertEq(incrementFromNext29, expectedNext29);
    }

    function test_GrandPrize_SecondGrandPrize_Awarded() public {
        // First 30 days.
        _doNCheckIns(alice, 30);
        // Another 30 days for the second prize.
        for (uint256 i = 0; i < 30; i++) {
            skip(24 hours);
            _checkIn(alice);
        }
        SettleXPoints.UserRecord memory r = sxp.getUserRecord(alice);
        assertEq(r.consecutiveDays, 0); // reset again after second grand prize
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 9. checkIn() — free check-in (fee = 0)
    // ═════════════════════════════════════════════════════════════════════════

    function test_CheckIn_FreeCheckIn_SucceedsWithZeroFee() public {
        vm.prank(owner);
        sxp.setCheckInFee(0);

        // Even with zero balance, check-in should succeed (transferFrom 0 always returns true
        // in MockERC20 without deducting anything).
        address charlie = makeAddr("charlie");
        vm.prank(charlie);
        sxp.checkIn();
        assertEq(sxp.getTotalPoints(charlie), 5);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 10. getTotalPoints() / getStreak()
    // ═════════════════════════════════════════════════════════════════════════

    function test_GetTotalPoints_NewUser_ReturnsZero() public view {
        assertEq(sxp.getTotalPoints(stranger), 0);
    }

    function test_GetStreak_NewUser_ReturnsZero() public view {
        assertEq(sxp.getStreak(stranger), 0);
    }

    function test_GetTotalPoints_AccumulatesCorrectly() public {
        _checkIn(alice);
        _warpAndCheckIn(alice, 24 hours);
        assertEq(sxp.getTotalPoints(alice), 5 + 6);
    }

    function test_GetStreak_ReflectsConsecutiveDays() public {
        _checkIn(alice);
        _warpAndCheckIn(alice, 24 hours);
        _warpAndCheckIn(alice, 24 hours);
        assertEq(sxp.getStreak(alice), 3);
    }

    function test_GetUserRecord_ReturnsFullRecord() public {
        _checkIn(alice);
        SettleXPoints.UserRecord memory r = sxp.getUserRecord(alice);
        assertEq(r.totalPoints, 5);
        assertEq(r.streak, 1);
        assertEq(r.weekCycleDay, 1);
        assertEq(r.consecutiveDays, 1);
        assertEq(r.weeksCompleted, 0);
        // grandPrizeClaimed field removed — consecutiveDays == 0 is the canonical signal
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 11. setCheckInFee()
    // ═════════════════════════════════════════════════════════════════════════

    function test_SetCheckInFee_OwnerCanUpdate() public {
        vm.prank(owner);
        sxp.setCheckInFee(50_000);
        assertEq(sxp.checkInFee(), 50_000);
    }

    function test_SetCheckInFee_OwnerCanSetToZero() public {
        vm.prank(owner);
        sxp.setCheckInFee(0);
        assertEq(sxp.checkInFee(), 0);
    }

    function test_SetCheckInFee_OwnerCanSetToMaxFee() public {
        vm.prank(owner);
        sxp.setCheckInFee(MAX_CHECKIN_FEE);
        assertEq(sxp.checkInFee(), MAX_CHECKIN_FEE);
    }

    function test_SetCheckInFee_Revert_NonOwner() public {
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        sxp.setCheckInFee(50_000);
    }

    function test_SetCheckInFee_Revert_FeeTooHigh() public {
        uint256 badFee = MAX_CHECKIN_FEE + 1;
        vm.expectRevert(
            abi.encodeWithSelector(SettleXPoints.FeeTooHigh.selector, badFee, MAX_CHECKIN_FEE)
        );
        vm.prank(owner);
        sxp.setCheckInFee(badFee);
    }

    function test_SetCheckInFee_EmitsCheckInFeeUpdated() public {
        vm.expectEmit(false, false, false, true, address(sxp));
        emit CheckInFeeUpdated(DEFAULT_FEE, 50_000);
        vm.prank(owner);
        sxp.setCheckInFee(50_000);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 12. setPlatformWallet()
    // ═════════════════════════════════════════════════════════════════════════

    function test_SetPlatformWallet_OwnerCanUpdate() public {
        address newWallet = makeAddr("newWallet");
        vm.prank(owner);
        sxp.setPlatformWallet(newWallet);
        assertEq(sxp.platformWallet(), newWallet);
    }

    function test_SetPlatformWallet_Revert_NonOwner() public {
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        sxp.setPlatformWallet(makeAddr("newWallet"));
    }

    function test_SetPlatformWallet_Revert_ZeroAddress() public {
        vm.expectRevert(SettleXPoints.ZeroAddress.selector);
        vm.prank(owner);
        sxp.setPlatformWallet(address(0));
    }

    function test_SetPlatformWallet_EmitsPlatformWalletUpdated() public {
        address newWallet = makeAddr("newWallet");
        vm.expectEmit(true, true, false, false, address(sxp));
        emit PlatformWalletUpdated(platformWallet, newWallet);
        vm.prank(owner);
        sxp.setPlatformWallet(newWallet);
    }

    function test_SetPlatformWallet_FeeSentToNewWallet() public {
        address newWallet = makeAddr("newWallet");
        vm.prank(owner);
        sxp.setPlatformWallet(newWallet);

        uint256 before = usdc.balanceOf(newWallet);
        _checkIn(alice);
        assertEq(usdc.balanceOf(newWallet), before + DEFAULT_FEE);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 13. pause() / unpause()
    // ═════════════════════════════════════════════════════════════════════════

    function test_Pause_OwnerCanPause() public {
        vm.prank(owner);
        sxp.pause();
        assertTrue(sxp.paused());
    }

    function test_Pause_Revert_NonOwner() public {
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        sxp.pause();
    }

    function test_Unpause_OwnerCanUnpause() public {
        vm.prank(owner);
        sxp.pause();
        vm.prank(owner);
        sxp.unpause();
        assertFalse(sxp.paused());
    }

    function test_Unpause_Revert_NonOwner() public {
        vm.prank(owner);
        sxp.pause();

        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        sxp.unpause();
    }

    function test_Unpause_AllowsCheckInAgain() public {
        vm.prank(owner);
        sxp.pause();
        vm.prank(owner);
        sxp.unpause();

        _checkIn(alice);
        assertEq(sxp.getTotalPoints(alice), 5);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 14. renounceOwnership()
    // ═════════════════════════════════════════════════════════════════════════

    function test_RenounceOwnership_AlwaysReverts() public {
        vm.expectRevert(bytes("SettleXPoints: renounceOwnership is disabled"));
        vm.prank(owner);
        sxp.renounceOwnership();
    }

    function test_RenounceOwnership_Revert_NonOwner() public {
        // Non-owner hits onlyOwner first, then the revert inside.
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        sxp.renounceOwnership();
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 15. transferOwnership() — Ownable2Step
    // ═════════════════════════════════════════════════════════════════════════

    function test_TransferOwnership_PendingOwnerSetAfterNomination() public {
        address newOwner = makeAddr("newOwner");
        vm.prank(owner);
        sxp.transferOwnership(newOwner);
        assertEq(sxp.pendingOwner(), newOwner);
        // Owner has NOT changed yet.
        assertEq(sxp.owner(), owner);
    }

    function test_TransferOwnership_CompletedAfterAcceptOwnership() public {
        address newOwner = makeAddr("newOwner");
        vm.prank(owner);
        sxp.transferOwnership(newOwner);

        vm.prank(newOwner);
        sxp.acceptOwnership();
        assertEq(sxp.owner(), newOwner);
    }

    function test_TransferOwnership_Revert_NonPendingOwnerCannotAccept() public {
        address newOwner = makeAddr("newOwner");
        vm.prank(owner);
        sxp.transferOwnership(newOwner);

        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        sxp.acceptOwnership();
    }

    function test_TransferOwnership_Revert_NonOwnerCannotNominate() public {
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger)
        );
        vm.prank(stranger);
        sxp.transferOwnership(makeAddr("anyone"));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 16. FUZZ — fee arithmetic and daily reward accumulation
    // ═════════════════════════════════════════════════════════════════════════

    /// @dev For any valid fee, the platform wallet always receives exactly the fee amount.
    function testFuzz_CheckIn_PlatformWalletReceivesExactFee(uint256 newFee) public {
        newFee = bound(newFee, 0, MAX_CHECKIN_FEE);
        vm.prank(owner);
        sxp.setCheckInFee(newFee);

        // Ensure alice has enough balance.
        _fund(alice, newFee);

        uint256 walletBefore = usdc.balanceOf(platformWallet);
        _checkIn(alice);
        assertEq(usdc.balanceOf(platformWallet), walletBefore + newFee);
    }

    /// @dev Points awarded for a given 0-indexed weekCycleDay always match the schedule.
    function testFuzz_CheckIn_PointsMatchDailySchedule(uint256 dayIndex) public {
        dayIndex = bound(dayIndex, 0, 6);
        // Advance alice to the desired weekCycleDay by doing `dayIndex` check-ins.
        for (uint256 i = 0; i < dayIndex; i++) {
            if (i > 0) skip(24 hours);
            _checkIn(alice);
        }
        // The next check-in hits weekCycleDay == dayIndex.
        if (dayIndex > 0) skip(24 hours);
        uint256 totalBefore = sxp.getTotalPoints(alice);
        _checkIn(alice);
        assertEq(sxp.getTotalPoints(alice) - totalBefore, DAILY_REWARDS[dayIndex]);
    }

    /// @dev totalPoints never decreases after a check-in.
    function testFuzz_CheckIn_TotalPointsMonotonicallyIncreases(uint8 numCheckIns) public {
        numCheckIns = uint8(bound(numCheckIns, 1, 30));
        uint256 prevPoints = 0;
        for (uint256 i = 0; i < numCheckIns; i++) {
            if (i > 0) skip(24 hours);
            _checkIn(alice);
            uint256 cur = sxp.getTotalPoints(alice);
            assertGe(cur, prevPoints);
            prevPoints = cur;
        }
    }

    /// @dev Streak never exceeds consecutiveDays (both track the same run length).
    function testFuzz_CheckIn_StreakMatchesConsecutiveDays(uint8 numCheckIns) public {
        numCheckIns = uint8(bound(numCheckIns, 1, 20));
        for (uint256 i = 0; i < numCheckIns; i++) {
            if (i > 0) skip(24 hours);
            _checkIn(alice);
        }
        SettleXPoints.UserRecord memory r = sxp.getUserRecord(alice);
        assertEq(r.streak, r.consecutiveDays);
    }

    /// @dev setCheckInFee is only callable by owner and bounded by MAX_CHECKIN_FEE.
    function testFuzz_SetCheckInFee_BoundaryProperty(uint256 fee) public {
        fee = bound(fee, 0, MAX_CHECKIN_FEE);
        vm.prank(owner);
        sxp.setCheckInFee(fee);
        assertEq(sxp.checkInFee(), fee);
    }

    function testFuzz_SetCheckInFee_AboveMaxAlwaysReverts(uint256 fee) public {
        fee = bound(fee, MAX_CHECKIN_FEE + 1, type(uint256).max);
        vm.expectRevert(
            abi.encodeWithSelector(SettleXPoints.FeeTooHigh.selector, fee, MAX_CHECKIN_FEE)
        );
        vm.prank(owner);
        sxp.setCheckInFee(fee);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 17. INVARIANT — totalPoints only grows; streak consistent with record
    // ═════════════════════════════════════════════════════════════════════════
}

// ─────────────────────────────────────────────────────────────────────────────
// Invariant test — separate contract (targetContract pattern)
// ─────────────────────────────────────────────────────────────────────────────

contract SettleXPointsInvariantTest is Test {
    SettleXPoints internal sxp;
    MockERC20 internal usdc;
    CheckInHandler internal handler;

    address internal owner;
    address internal platformWallet;

    // Stored in contract state so invariant_* (non-view) can access them.
    address internal user0;
    address internal user1;
    address internal user2;

    function setUp() public {
        owner = makeAddr("owner");
        platformWallet = makeAddr("platformWallet");
        user0 = makeAddr("user0");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        usdc = new MockERC20("Mock USDC", "mUSDC", 6);
        vm.warp(1_000_000);

        vm.prank(owner);
        sxp = new SettleXPoints(address(usdc), platformWallet, owner);

        // Three independent users for the fuzzer to drive.
        address[] memory users = new address[](3);
        users[0] = user0;
        users[1] = user1;
        users[2] = user2;

        // Pre-fund users.
        for (uint256 i = 0; i < users.length; i++) {
            usdc.mint(users[i], 1_000_000_000);
        }

        handler = new CheckInHandler(sxp, usdc, users);
        targetContract(address(handler));
    }

    /// @dev PROPERTY: weekCycleDay is always in [0, 6].
    function invariant_WeekCycleDayInBounds() public {
        address[3] memory users = [user0, user1, user2];
        for (uint256 i = 0; i < users.length; i++) {
            SettleXPoints.UserRecord memory r = sxp.getUserRecord(users[i]);
            assertLe(r.weekCycleDay, 6, "weekCycleDay out of bounds");
        }
    }

    /// @dev PROPERTY: consecutiveDays never reaches 30 (resets to 0 at exactly 30).
    function invariant_ConsecutiveDaysNeverExceedsThreshold() public {
        address[3] memory users = [user0, user1, user2];
        for (uint256 i = 0; i < users.length; i++) {
            SettleXPoints.UserRecord memory r = sxp.getUserRecord(users[i]);
            assertLt(r.consecutiveDays, 30, "consecutiveDays should have been reset at 30");
        }
    }

    /// @dev PROPERTY: platform wallet balance always >= ghostCheckInCount * currentFee.
    function invariant_PlatformWalletGrowsMonotonically() public {
        uint256 fee = sxp.checkInFee();
        uint256 ghostCount = handler.ghostCheckInCount();
        assertGe(
            usdc.balanceOf(platformWallet),
            ghostCount * fee,
            "platform wallet balance below expected"
        );
    }

    /// @dev PROPERTY: totalPoints returned from the contract is always ≥ 0
    ///      (uint256 cannot be negative, but this exercises the storage path for all users).
    function invariant_TotalPointsNonNegative() public {
        address[3] memory users = [user0, user1, user2];
        for (uint256 i = 0; i < users.length; i++) {
            sxp.getTotalPoints(users[i]); // reverts/panics if storage corrupted
        }
    }
}
