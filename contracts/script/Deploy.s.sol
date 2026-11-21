// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {RpengCasino} from "../src/RpengCasino.sol";

/// forge script script/Deploy.s.sol --root . --rpc-url robinhood --broadcast --account <deployer>
/// Settings come from the environment (see contracts/README.md).
contract Deploy is Script {
    function run() external returns (RpengCasino casino) {
        IERC20 token = IERC20(vm.envAddress("RPENG_TOKEN"));
        // The wallet that launched $RPENG (set CASINO_OWNER to use another)
        address owner = vm.envOr("CASINO_OWNER", address(0xb50295336dCf30F5a01541338AD09B4487930065));
        // Gets the treasury share of every lost bet (set CASINO_TREASURY to use another wallet)
        address treasury = vm.envOr("CASINO_TREASURY", address(0x73b6e7E744576DD2AC8110d9D1291eE843FA6d30));
        // The server's wallet that posts and reveals seeds (set CASINO_CROUPIER to use another)
        address croupier = vm.envOr("CASINO_CROUPIER", address(0xD1d196aD626383592b6357614510b333868A3FAA));
        uint256 lossBps = vm.envOr("CASINO_LOSS_TO_TREASURY_BPS", uint256(7000));
        // In whole tokens times 1e18: 1,000 to 100,000 $RPENG per bet
        uint256 minBet = vm.envOr("CASINO_MIN_BET", uint256(1_000e18));
        uint256 maxBet = vm.envOr("CASINO_MAX_BET", uint256(100_000e18));
        uint64 timeout = uint64(vm.envOr("CASINO_REVEAL_TIMEOUT", uint256(1 hours)));

        vm.startBroadcast();
        casino = new RpengCasino(token, owner, treasury, croupier, lossBps, minBet, maxBet, timeout);
        vm.stopBroadcast();
        console.log("RpengCasino:", address(casino));
    }
}
