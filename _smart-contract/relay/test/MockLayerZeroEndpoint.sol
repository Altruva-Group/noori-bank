// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockLayerZeroEndpoint {
    mapping(uint16 => address) public remoteEndpoints;
    mapping(address => uint256) public gasForTransfer;

    event MessageSent(
        uint16 indexed dstChainId,
        bytes payload,
        address payable refundAddress,
        address zroPaymentAddress,
        bytes adapterParams
    );

    function send(
        uint16 _dstChainId,
        bytes calldata _destination,
        bytes calldata _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) external payable {
        emit MessageSent(
            _dstChainId,
            _payload,
            _refundAddress,
            _zroPaymentAddress,
            _adapterParams
        );
    }

    function setRemoteEndpoint(uint16 _chainId, address _endpoint) external {
        remoteEndpoints[_chainId] = _endpoint;
    }

    function setGasForTransfer(address _user, uint256 _gas) external {
        gasForTransfer[_user] = _gas;
    }

    function estimateFees(
        uint16 _dstChainId,
        address _userApplication,
        bytes calldata _payload,
        bool _payInZRO,
        bytes calldata _adapterParam
    ) external view returns (uint256 nativeFee, uint256 zroFee) {
        return (gasForTransfer[_userApplication], 0);
    }
}