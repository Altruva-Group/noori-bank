// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


// LayerZero interfaces
interface ILayerZeroEndpoint {
    // Send a message to a destination chain with custom config
    function send(
        uint16 _dstChainId,
        bytes calldata _destination,
        bytes calldata _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) external payable;

    // Estimate fees for a cross-chain message
    function estimateFees(
        uint16 _dstChainId,
        address _userApplication,
        bytes calldata _payload,
        bool _payInZRO,
        bytes calldata _adapterParam
    ) external view returns (uint256 nativeFee, uint256 zroFee);

    // Get the inbound nonce of a remote chain
    function getInboundNonce(uint16 _srcChainId, bytes calldata _srcAddress) external view returns (uint64);

    // Get the outbound nonce for a destination chain
    function getOutboundNonce(uint16 _dstChainId, address _srcAddress) external view returns (uint64);

    // Get the stored payload by hash
    function getStoredPayload(uint16 _srcChainId, bytes calldata _srcAddress) external view returns (bytes memory);

    // Force resume receiving messages
    function forceResumeReceive(uint16 _srcChainId, bytes calldata _srcAddress) external;
}

interface ILayerZeroReceiver {
    // LayerZero endpoint will invoke this function to deliver the message on the destination
    function lzReceive(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) external;
}

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface INooriToken is IERC20 {
    function burnFrom(address from, uint256 amount) external;
    function mintTo(address to, uint256 amount) external returns (bool);
}
