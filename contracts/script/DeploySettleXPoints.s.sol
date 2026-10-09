// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {SettleXPoints} from "../SettleXPoints.sol";

contract DeploySettleXPoints is Script {
    // Arc Mainnet USDC (native gas token ERC-20 view)
    address constant USDC = 0x3600000000000000000000000000000000000000;
    // Platform fee recipient + contract owner
    address constant PLATFORM_WALLET = 0xaa2adbc3b545AA0F264458bbA8a2B5620c51A0D3;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address operatorAddr = vm.envAddress("SETTLEX_SIGNER_ADDRESS");

        console.log("Deploying from:", deployer);
        console.log("USDC:", USDC);
        console.log("Platform wallet:", PLATFORM_WALLET);
        console.log("Operator:", operatorAddr);

        vm.startBroadcast(deployerKey);

        SettleXPoints points = new SettleXPoints(
            USDC,
            PLATFORM_WALLET,
            PLATFORM_WALLET, // owner = platform wallet
            operatorAddr
        );

        vm.stopBroadcast();

        console.log("SettleXPoints deployed at:", address(points));
        console.log("Owner:", points.owner());
        console.log("Platform wallet:", points.platformWallet());
        console.log("Check-in fee:", points.checkInFee());
        console.log("Max fee cap:", points.MAX_CHECKIN_FEE());
    }
}
