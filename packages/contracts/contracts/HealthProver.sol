// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IGroth16Verifier {
    function verifyProof(
        uint[2]    calldata _pA,
        uint[2][2] calldata _pB,
        uint[2]    calldata _pC,
        uint[]     calldata _pubSignals
    ) external view returns (bool);
}

contract HealthProver {
    enum ClaimType { VACCINATION, VITALS_RANGE, AGE_THRESHOLD }

    mapping(ClaimType => address) public verifiers;
    address public owner;

    event ProofVerified(
        address indexed prover,
        ClaimType       claimType,
        bytes32 indexed proofHash,
        uint256         timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "HealthProver: not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setVerifier(ClaimType claimType, address verifier) external onlyOwner {
        verifiers[claimType] = verifier;
    }

    function verifyHealthClaim(
        ClaimType          claimType,
        uint[2]    calldata pA,
        uint[2][2] calldata pB,
        uint[2]    calldata pC,
        uint[]     calldata pubSignals
    ) external returns (bool) {
        address verifier = verifiers[claimType];
        require(verifier != address(0), "HealthProver: verifier not registered");

        bool valid = IGroth16Verifier(verifier).verifyProof(pA, pB, pC, pubSignals);

        if (valid) {
            bytes32 proofHash = keccak256(abi.encode(pA, pB, pC, pubSignals));
            emit ProofVerified(msg.sender, claimType, proofHash, block.timestamp);
        }

        return valid;
    }
}
