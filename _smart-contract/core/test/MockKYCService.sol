// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockKYCService {
    mapping(address => bool) private kycStatus;
    mapping(address => bool) private verificationStatus;

    function setKYCStatus(address user, bool status) external {
        kycStatus[user] = status;
    }

    function isKYCVerified(address user) external view returns (bool) {
        return kycStatus[user];
    }

    function setVerificationStatus(address user, bool status) external {
        verificationStatus[user] = status;
    }

    function isVerified(address user) external view returns (bool) {
        return verificationStatus[user];
    }
}