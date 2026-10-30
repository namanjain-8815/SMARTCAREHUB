// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title RecordRegistry
/// @notice Anchors encrypted medical record commitments on-chain.
///         No PHI is stored. Only: contentHash, encryptedCID, timestamp, revocation status.
contract RecordRegistry is ReentrancyGuard {

    struct RecordEntry {
        bytes32 contentHash;    // SHA-256 / keccak256 of the AES-256-GCM encrypted file bytes
        string  encryptedCID;   // IPFS CID of the encrypted blob
        uint256 timestamp;
        bool    revoked;
    }

    mapping(address => RecordEntry[]) private _records;

    event RecordAnchored(
        address indexed owner,
        bytes32 indexed contentHash,
        string  encryptedCID,
        uint256 timestamp
    );
    event RecordRevoked(address indexed owner, uint256 indexed recordIndex);

    /// @notice Anchor a new encrypted medical record commitment
    function anchorRecord(bytes32 contentHash, string calldata encryptedCID)
        external nonReentrant
    {
        require(contentHash != bytes32(0), "RecordRegistry: empty hash");
        require(bytes(encryptedCID).length > 0, "RecordRegistry: empty CID");

        _records[msg.sender].push(RecordEntry({
            contentHash:  contentHash,
            encryptedCID: encryptedCID,
            timestamp:    block.timestamp,
            revoked:      false
        }));

        emit RecordAnchored(msg.sender, contentHash, encryptedCID, block.timestamp);
    }

    /// @notice Soft-delete a record entry
    function revokeRecord(uint256 index) external {
        require(index < _records[msg.sender].length, "RecordRegistry: out of bounds");
        _records[msg.sender][index].revoked = true;
        emit RecordRevoked(msg.sender, index);
    }

    /// @notice Get all record entries for the caller
    function getMyRecords() external view returns (RecordEntry[] memory) {
        return _records[msg.sender];
    }

    /// @notice Get all record entries for an owner (callable by delegates)
    function getRecordsOf(address owner) external view returns (RecordEntry[] memory) {
        return _records[owner];
    }

    /// @notice Verify integrity — returns true if hash matches and not revoked
    function verifyRecord(address owner, uint256 index, bytes32 claimedHash)
        external view returns (bool)
    {
        if (index >= _records[owner].length) {
            return false;
        }
        RecordEntry storage entry = _records[owner][index];
        return (!entry.revoked && entry.contentHash == claimedHash);
    }
}
