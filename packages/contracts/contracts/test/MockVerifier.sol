// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../HealthProver.sol";

contract MockVerifier is IGroth16Verifier {
    bool public shouldPass;

    constructor(bool _shouldPass) {
        shouldPass = _shouldPass;
    }

    function verifyProof(
        uint[2]    calldata,
        uint[2][2] calldata,
        uint[2]    calldata,
        uint[]     calldata
    ) external view override returns (bool) {
        return shouldPass;
    }
}
