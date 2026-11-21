// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {RpengCasino} from "../src/RpengCasino.sol";

/// Runs the casino against the real $RPENG token on a copy of Robinhood Chain:
/// forge test --root . --match-contract RpengFork --fork-url https://rpc.mainnet.chain.robinhood.com
contract RpengFork is Test {
    IERC20 constant RPENG = IERC20(0x2caD50ca2A7BeB6A314D8e2B5b26775aB09E3aD1);
    address constant CURVE = 0x3b3a65fAD0f96172Aa710B2A1E052451dB77D6cc;
    address owner = address(0xA11CE);
    address treasury = address(0x7EA5);
    address croupier = address(0xC0DE);
    address player = address(0xB0B);
    address burn = 0x000000000000000000000000000000000000dEaD;
    RpengCasino casino;

    function setUp() public {
        if (block.chainid != 4663) return; // only meaningful on the fork
        casino = new RpengCasino(RPENG, owner, treasury, croupier, 7000, 1e18, 1_000_000e18, 1 hours);
        // Real token moves: from the bonding curve (the biggest holder) to our test wallets
        uint256 curveBal = RPENG.balanceOf(CURVE);
        console.log("curve holds", curveBal / 1e18);
        vm.startPrank(CURVE);
        RPENG.transfer(owner, 60_000_000e18);
        RPENG.transfer(player, 1_000_000e18);
        vm.stopPrank();
        vm.startPrank(owner);
        RPENG.approve(address(casino), type(uint256).max);
        casino.fundBankroll(50_000_000e18);
        vm.stopPrank();
        vm.prank(player);
        RPENG.approve(address(casino), type(uint256).max);
        bytes32[] memory h = new bytes32[](10);
        for (uint256 i; i < 10; ++i) h[i] = keccak256(abi.encodePacked(keccak256(abi.encode(i))));
        vm.prank(croupier);
        casino.addCommits(0, h);
    }

    function secretOf(uint256 i) internal pure returns (bytes32) {
        return keccak256(abi.encode(i));
    }

    function seedFor(uint8 game, uint8 choice, bool win) internal view returns (bytes32 seed) {
        uint256 id = casino.betCount() + 1;
        uint256 idx = casino.nextCommit();
        for (uint256 i; i < 10_000; ++i) {
            seed = bytes32(i);
            uint256 roll = uint256(keccak256(abi.encodePacked(secretOf(idx), seed, id)));
            if ((casino.pays(game, choice, roll) > 0) == win) return seed;
        }
        revert("no seed");
    }

    function test_realTokenHasNoTransferFee() public {
        if (block.chainid != 4663) return;
        assertEq(RPENG.balanceOf(player), 1_000_000e18, "player got the full amount");
        assertEq(RPENG.balanceOf(address(casino)), 50_000_000e18, "bankroll got the full amount");
    }

    function test_realWinAndLoss() public {
        if (block.chainid != 4663) return;
        uint256 bet = 10_000e18;
        // A win: coin flip pays 1.95x
        uint256 before = RPENG.balanceOf(player);
        bytes32 sa = seedFor(0, 1, true);
        vm.prank(player);
        uint256 a = casino.placeBet(0, 1, bet, sa);
        vm.prank(croupier);
        casino.settle(a, secretOf(0));
        assertEq(RPENG.balanceOf(player), before - bet + (bet * 195) / 100);
        // A loss: 70% to the treasury, 30% to the burn address
        uint256 burnBefore = RPENG.balanceOf(burn);
        bytes32 sb = seedFor(1, 1, false);
        vm.prank(player);
        uint256 b = casino.placeBet(1, 1, bet, sb);
        vm.prank(croupier);
        casino.settle(b, secretOf(1));
        assertEq(RPENG.balanceOf(treasury), (bet * 7000) / 10_000);
        assertEq(RPENG.balanceOf(burn) - burnBefore, bet - (bet * 7000) / 10_000);
        assertEq(casino.locked(), 0);
    }

    function test_realTimeout() public {
        if (block.chainid != 4663) return;
        vm.prank(player);
        uint256 id = casino.placeBet(2, 0, 1_000e18, bytes32(0));
        vm.warp(block.timestamp + 1 hours);
        uint256 before = RPENG.balanceOf(player);
        casino.claimTimeout(id);
        assertEq(RPENG.balanceOf(player) - before, 50_000e18, "slots timeout pays the 50x max");
    }
}
