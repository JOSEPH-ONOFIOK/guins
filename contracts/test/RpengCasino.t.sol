// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {RpengCasino} from "../src/RpengCasino.sol";

contract Token is ERC20 {
    constructor() ERC20("RPENG", "RPENG") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// Takes 1% of every transfer, to check the casino counts what actually arrives
contract FeeToken is ERC20 {
    constructor() ERC20("FEE", "FEE") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0)) {
            uint256 fee = value / 100;
            super._update(from, address(0xFEE), fee);
            value -= fee;
        }
        super._update(from, to, value);
    }
}

/// Tries to re-enter the casino when it receives a payout hook (ERC20 has none, so this
/// checks a malicious token can't use transfer callbacks to settle twice)
contract HookToken is ERC20 {
    RpengCasino public casino;
    uint256 public betId;
    bytes32 public secret;
    bool public armed;

    constructor() ERC20("HOOK", "HOOK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function arm(RpengCasino c, uint256 id, bytes32 s) external {
        casino = c;
        betId = id;
        secret = s;
        armed = true;
    }

    function _update(address from, address to, uint256 value) internal override {
        super._update(from, to, value);
        if (armed && from == address(casino)) {
            armed = false;
            casino.claimTimeout(betId); // must fail: reentrancy guard / already settled
        }
    }
}

contract RpengCasinoTest is Test {
    Token token;
    RpengCasino casino;
    address owner = address(0xA11CE);
    address treasury = address(0x7EA5);
    address croupier = address(0xC0DE);
    address player = address(0xB0B);
    address burn = 0x000000000000000000000000000000000000dEaD;

    uint256 constant BANK = 10_000_000e18;
    uint256 constant BET = 1_000e18;

    function setUp() public {
        token = new Token();
        casino = new RpengCasino(IERC20(address(token)), owner, treasury, croupier, 7000, 1e18, 100_000e18, 1 hours);
        token.mint(owner, BANK);
        vm.startPrank(owner);
        token.approve(address(casino), BANK);
        casino.fundBankroll(BANK);
        vm.stopPrank();
        token.mint(player, 1_000_000e18);
        vm.prank(player);
        token.approve(address(casino), type(uint256).max);
    }

    // ---------- helpers ----------

    function secretOf(uint256 i) internal pure returns (bytes32) {
        return keccak256(abi.encode("secret", i));
    }

    function addCommits(uint256 from, uint256 count) internal {
        bytes32[] memory h = new bytes32[](count);
        for (uint256 i; i < count; ++i) h[i] = keccak256(abi.encodePacked(secretOf(from + i)));
        vm.prank(croupier);
        casino.addCommits(from, h);
    }

    function rollFor(uint256 commitIndex, bytes32 seed, uint256 betId) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(secretOf(commitIndex), seed, betId)));
    }

    /// Finds a client seed that makes the next bet win (want = true) or lose
    function seedFor(uint8 game, uint8 choice, bool want) internal view returns (bytes32 seed) {
        uint256 betId = casino.betCount() + 1;
        uint256 idx = casino.nextCommit();
        for (uint256 i; i < 10_000; ++i) {
            seed = bytes32(i);
            bool wins = casino.pays(game, choice, rollFor(idx, seed, betId)) > 0;
            if (wins == want) return seed;
        }
        revert("no seed");
    }

    function bet(uint8 game, uint8 choice, uint256 amount, bytes32 seed) internal returns (uint256 id) {
        vm.prank(player);
        id = casino.placeBet(game, choice, amount, seed);
    }

    function settle(uint256 id) internal {
        (,,,,,, uint32 idx,,) = casino.bets(id);
        vm.prank(croupier);
        casino.settle(id, secretOf(idx));
    }

    // ---------- wins and losses ----------

    function test_flipWinPays195() public {
        addCommits(0, 1);
        uint256 before = token.balanceOf(player);
        uint256 id = bet(0, 1, BET, seedFor(0, 1, true));
        settle(id);
        assertEq(token.balanceOf(player), before - BET + (BET * 195) / 100);
        assertEq(casino.locked(), 0);
    }

    function test_lossSplits70ToTreasury30Burned() public {
        addCommits(0, 1);
        uint256 id = bet(0, 0, BET, seedFor(0, 0, false));
        settle(id);
        assertEq(token.balanceOf(treasury), (BET * 7000) / 10_000);
        assertEq(token.balanceOf(burn), BET - (BET * 7000) / 10_000);
        assertEq(token.balanceOf(address(casino)), BANK, "bankroll unchanged by a loss");
        assertEq(casino.locked(), 0);
    }

    function test_diceRules() public view {
        for (uint256 r; r < 36; ++r) {
            uint256 sum = (r % 6) + 1 + ((r / 6) % 6) + 1;
            assertEq(casino.pays(1, 0, r), sum < 7 ? 230 : 0);
            assertEq(casino.pays(1, 1, r), sum == 7 ? 500 : 0);
            assertEq(casino.pays(1, 2, r), sum > 7 ? 230 : 0);
        }
    }

    function test_slotsRulesMatchTheSite() public view {
        // Every combination of the three reels (20 x 20 x 20)
        uint256 total;
        uint256[6] memory three = [uint256(5000), 2000, 1500, 800, 500, 500];
        for (uint256 a; a < 20; ++a) {
            for (uint256 b; b < 20; ++b) {
                for (uint256 c; c < 20; ++c) {
                    uint256 r = a + b * 20 + c * 400;
                    (uint8 x, uint8 y, uint8 z) = casino.reels(r);
                    uint256 want = x == y && y == z ? three[x] : (x == y || y == z || x == z) ? 140 : 0;
                    uint256 got = casino.pays(2, 0, r);
                    assertEq(got, want);
                    total += got;
                }
            }
        }
        // Return to player over all 8,000 outcomes: exactly 96.525%, as the wiki shows (96.52%)
        assertEq(total, 772_200);
    }

    function test_flipIsFair() public view {
        uint256 ones;
        for (uint256 i; i < 2000; ++i) if (casino.pays(0, 1, uint256(keccak256(abi.encode(i)))) > 0) ones++;
        assertApproxEqAbs(ones, 1000, 80);
    }

    // ---------- limits ----------

    function test_betLimits() public {
        addCommits(0, 2);
        vm.prank(player);
        vm.expectRevert(RpengCasino.BetOutOfRange.selector);
        casino.placeBet(0, 0, 0.5e18, bytes32(0));
        vm.prank(player);
        vm.expectRevert(RpengCasino.BetOutOfRange.selector);
        casino.placeBet(0, 0, 100_001e18, bytes32(0));
    }

    function test_badChoices() public {
        addCommits(0, 1);
        vm.startPrank(player);
        vm.expectRevert(RpengCasino.BadChoice.selector);
        casino.placeBet(0, 2, BET, bytes32(0));
        vm.expectRevert(RpengCasino.BadChoice.selector);
        casino.placeBet(1, 3, BET, bytes32(0));
        vm.expectRevert(RpengCasino.BadGame.selector);
        casino.placeBet(3, 0, BET, bytes32(0));
        vm.stopPrank();
    }

    function test_noCommitNoBet() public {
        vm.prank(player);
        vm.expectRevert(RpengCasino.NoCommitLeft.selector);
        casino.placeBet(0, 0, BET, bytes32(0));
    }

    function test_bankrollMustCoverTheWin() public {
        // A fresh casino with a tiny bankroll can't take a slots bet worth 50x
        RpengCasino small = new RpengCasino(IERC20(address(token)), owner, treasury, croupier, 7000, 1e18, 100_000e18, 1 hours);
        token.mint(owner, 10_000e18);
        vm.startPrank(owner);
        token.approve(address(small), 10_000e18);
        small.fundBankroll(10_000e18);
        vm.stopPrank();
        bytes32[] memory h = new bytes32[](1);
        h[0] = keccak256(abi.encodePacked(secretOf(0)));
        vm.prank(croupier);
        small.addCommits(0, h);
        vm.startPrank(player);
        token.approve(address(small), type(uint256).max);
        vm.expectRevert(RpengCasino.BankrollTooLow.selector);
        small.placeBet(2, 0, 1_000e18, bytes32(0)); // could pay 50,000, bankroll 10,000
        small.placeBet(0, 0, 1_000e18, bytes32(0)); // flip pays at most 1,950: fine
        vm.stopPrank();
    }

    function test_openBetsLockTheBankroll() public {
        addCommits(0, 1);
        bet(2, 0, 100_000e18, bytes32(0)); // reserves 5,000,000
        assertEq(casino.locked(), 5_000_000e18);
        vm.prank(owner);
        vm.expectRevert(RpengCasino.BankrollTooLow.selector);
        casino.withdrawBankroll(owner, BANK);
        uint256 free = casino.bankroll();
        vm.prank(owner);
        casino.withdrawBankroll(owner, free);
        assertEq(casino.bankroll(), 0);
    }

    // ---------- the croupier ----------

    function test_wrongSecretRejected() public {
        addCommits(0, 1);
        uint256 id = bet(0, 0, BET, bytes32(0));
        vm.prank(croupier);
        vm.expectRevert(RpengCasino.BadSecret.selector);
        casino.settle(id, secretOf(99));
    }

    function test_onlyCroupierSettles() public {
        addCommits(0, 1);
        uint256 id = bet(0, 0, BET, bytes32(0));
        vm.prank(player);
        vm.expectRevert(RpengCasino.NotCroupier.selector);
        casino.settle(id, secretOf(0));
        vm.prank(player);
        vm.expectRevert(RpengCasino.NotCroupier.selector);
        casino.addCommits(0, new bytes32[](1));
    }

    function test_cannotSettleTwice() public {
        addCommits(0, 1);
        uint256 id = bet(0, 0, BET, bytes32(0));
        settle(id);
        vm.prank(croupier);
        vm.expectRevert(RpengCasino.NotOpen.selector);
        casino.settle(id, secretOf(0));
    }

    function test_eachBetUsesItsOwnCommit() public {
        addCommits(0, 3);
        uint256 a = bet(0, 0, BET, bytes32(0));
        uint256 b = bet(0, 0, BET, bytes32(0));
        (,,,,,, uint32 ia,,) = casino.bets(a);
        (,,,,,, uint32 ib,,) = casino.bets(b);
        assertEq(ia, 0);
        assertEq(ib, 1);
        assertEq(casino.commitsLeft(), 1);
        // a's secret can't settle b
        vm.prank(croupier);
        vm.expectRevert(RpengCasino.BadSecret.selector);
        casino.settle(b, secretOf(0));
    }

    function test_commitBatchMustStartAtTheEnd() public {
        addCommits(0, 3);
        bytes32[] memory h = new bytes32[](1);
        vm.prank(croupier);
        vm.expectRevert(RpengCasino.BadSetting.selector);
        casino.addCommits(0, h); // a stale batch (started where an earlier one did) is refused
        vm.prank(croupier);
        casino.addCommits(3, h);
        assertEq(casino.commitsLeft(), 4);
    }

    // ---------- timeouts ----------

    function test_timeoutPaysTheMaxWin() public {
        addCommits(0, 1);
        uint256 before = token.balanceOf(player);
        uint256 id = bet(1, 1, BET, bytes32(0)); // lucky 7: max 5x
        vm.expectRevert(RpengCasino.TooEarly.selector);
        casino.claimTimeout(id);
        vm.warp(block.timestamp + 1 hours);
        casino.claimTimeout(id); // anyone can trigger it; the player is paid
        assertEq(token.balanceOf(player), before - BET + 5 * BET);
        assertEq(casino.locked(), 0);
        vm.prank(croupier);
        vm.expectRevert(RpengCasino.NotOpen.selector);
        casino.settle(id, secretOf(0));
    }

    function test_changingTimeoutDoesNotMoveOpenBets() public {
        addCommits(0, 1);
        uint256 id = bet(0, 0, BET, bytes32(0));
        vm.prank(owner);
        casino.setRevealTimeout(1 days);
        vm.warp(block.timestamp + 1 hours);
        casino.claimTimeout(id); // still claimable on its original deadline
    }

    // ---------- tokens ----------

    function test_feeOnTransferCountsWhatArrives() public {
        FeeToken fee = new FeeToken();
        RpengCasino c = new RpengCasino(IERC20(address(fee)), owner, treasury, croupier, 7000, 1e18, 100_000e18, 1 hours);
        fee.mint(owner, BANK);
        vm.startPrank(owner);
        fee.approve(address(c), BANK);
        c.fundBankroll(BANK);
        vm.stopPrank();
        bytes32[] memory h = new bytes32[](1);
        h[0] = keccak256(abi.encodePacked(secretOf(0)));
        vm.prank(croupier);
        c.addCommits(0, h);
        fee.mint(player, BET * 2);
        vm.startPrank(player);
        fee.approve(address(c), type(uint256).max);
        uint256 id = c.placeBet(0, 0, BET, bytes32(0));
        vm.stopPrank();
        (,uint96 amount,,,,,,,) = c.bets(id);
        assertEq(amount, BET - BET / 100);
    }

    function test_payoutHookCannotReenter() public {
        HookToken hook = new HookToken();
        RpengCasino c = new RpengCasino(IERC20(address(hook)), owner, treasury, croupier, 7000, 1e18, 100_000e18, 1 hours);
        hook.mint(owner, BANK);
        vm.startPrank(owner);
        hook.approve(address(c), BANK);
        c.fundBankroll(BANK);
        vm.stopPrank();
        bytes32[] memory h = new bytes32[](1);
        h[0] = keccak256(abi.encodePacked(secretOf(0)));
        vm.prank(croupier);
        c.addCommits(0, h);
        hook.mint(player, BET);
        vm.startPrank(player);
        hook.approve(address(c), type(uint256).max);
        uint256 id = c.placeBet(0, 0, BET, bytes32(0));
        vm.stopPrank();
        vm.warp(block.timestamp + 1 hours);
        hook.arm(c, id, secretOf(0));
        vm.expectRevert(); // the nested claimTimeout reverts, so the whole payout reverts
        c.claimTimeout(id);
    }

    // ---------- owner ----------

    function test_ownerOnly() public {
        vm.startPrank(player);
        vm.expectRevert();
        casino.withdrawBankroll(player, 1);
        vm.expectRevert();
        casino.setLossSplit(0);
        vm.expectRevert();
        casino.setCroupier(player);
        vm.expectRevert();
        casino.pause();
        vm.stopPrank();
    }

    function test_badSettingsRejected() public {
        vm.startPrank(owner);
        vm.expectRevert(RpengCasino.BadSetting.selector);
        casino.setLossSplit(10_001);
        vm.expectRevert(RpengCasino.BadSetting.selector);
        casino.setLimits(10, 5);
        vm.expectRevert(RpengCasino.BadSetting.selector);
        casino.setRevealTimeout(1 minutes);
        vm.expectRevert(RpengCasino.BadSetting.selector);
        casino.setTreasury(address(0));
        vm.expectRevert(RpengCasino.BadSetting.selector);
        casino.rescue(IERC20(address(token)), owner, 1);
        vm.stopPrank();
    }

    function test_pauseStopsBetsNotSettlement() public {
        addCommits(0, 2);
        uint256 id = bet(0, 0, BET, bytes32(0));
        vm.prank(owner);
        casino.pause();
        vm.prank(player);
        vm.expectRevert();
        casino.placeBet(0, 0, BET, bytes32(0));
        settle(id); // open bets still settle while paused
        vm.warp(block.timestamp + 2 hours); // and timeouts still work
    }

    // ---------- fuzz ----------

    /// However bets land, the casino always holds enough to pay every open bet's max win
    function testFuzz_solvent(uint256[8] memory amounts, uint8[8] memory games, uint8[8] memory choices) public {
        addCommits(0, 8);
        uint256[8] memory ids;
        uint256 n;
        for (uint256 i; i < 8; ++i) {
            uint8 g = games[i] % 3;
            uint8 ch = g == 0 ? choices[i] % 2 : g == 1 ? choices[i] % 3 : 0;
            uint256 amt = bound(amounts[i], 1e18, 100_000e18);
            if (token.balanceOf(address(casino)) + amt < casino.locked() + (amt * casino.maxPays(g, ch)) / 100) continue;
            ids[n++] = bet(g, ch, amt, bytes32(i));
            assertGe(token.balanceOf(address(casino)), casino.locked());
        }
        for (uint256 i; i < n; ++i) {
            settle(ids[i]);
            assertGe(token.balanceOf(address(casino)), casino.locked());
        }
        assertEq(casino.locked(), 0);
    }
}
