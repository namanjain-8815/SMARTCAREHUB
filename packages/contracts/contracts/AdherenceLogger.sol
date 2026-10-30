// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title AdherenceLogger
/// @notice Stores EIP-712 signed dosage events as an immutable adherence trail.
contract AdherenceLogger is EIP712 {
    using ECDSA for bytes32;

    bytes32 private constant DOSAGE_TYPEHASH = keccak256(
        "DosageEvent(string medicationId,uint256 scheduledAt,uint256 confirmedAt)"
    );

    struct DosageEvent {
        string   medicationId;  // Opaque ID (e.g. hash of name — no PHI cleartext)
        uint256  scheduledAt;
        uint256  confirmedAt;
        bytes32  eventHash;
    }

    mapping(address => DosageEvent[]) private _log;

    event DosageConfirmed(
        address indexed patient,
        bytes32 indexed eventHash,
        uint256 scheduledAt,
        uint256 confirmedAt
    );

    constructor() EIP712("SmartCareHub.AdherenceLogger", "1") {}

    /// @notice Submit a patient-signed dosage confirmation
    function logDosage(
        string calldata medicationId,
        uint256 scheduledAt,
        uint256 confirmedAt,
        bytes calldata signature
    ) external {
        require(confirmedAt <= block.timestamp + 300, "AdherenceLogger: future timestamp");

        bytes32 structHash = keccak256(abi.encode(
            DOSAGE_TYPEHASH,
            keccak256(bytes(medicationId)),
            scheduledAt,
            confirmedAt
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        require(signer == msg.sender, "AdherenceLogger: invalid signature");

        bytes32 eventHash = keccak256(abi.encode(medicationId, scheduledAt, confirmedAt));
        _log[msg.sender].push(DosageEvent(medicationId, scheduledAt, confirmedAt, eventHash));

        emit DosageConfirmed(msg.sender, eventHash, scheduledAt, confirmedAt);
    }

    function getMyLog() external view returns (DosageEvent[] memory) {
        return _log[msg.sender];
    }

    function getLogOf(address patient) external view returns (DosageEvent[] memory) {
        return _log[patient];
    }

    function computeComplianceScore(address patient, uint256 from, uint256 to)
        external view returns (uint256 confirmed, uint256 inWindow)
    {
        DosageEvent[] storage log = _log[patient];
        for (uint256 i = 0; i < log.length; i++) {
            if (log[i].scheduledAt >= from && log[i].scheduledAt <= to) {
                inWindow++;
                if (log[i].confirmedAt > 0) {
                    confirmed++;
                }
            }
        }
    }
}
