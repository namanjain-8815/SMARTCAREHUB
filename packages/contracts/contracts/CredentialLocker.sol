// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CredentialLocker
/// @notice Soulbound medical credentials + emergency triage access with full audit trail.
contract CredentialLocker is ERC721, Ownable {

    struct Credential {
        string  credentialType;
        address issuer;
        uint256 issuedAt;
        uint256 expiresAt;
        bytes32 dataHash;
        bool    revoked;
    }

    struct TriagePayload {
        string    encryptedCID;
        address[] guardians;
        bool      active;
    }

    struct BreakGlassEvent {
        address accessedBy;
        uint256 timestamp;
        string  reason;   // "GUARDIAN_SIGNED" | "MEDIC_CREDENTIAL"
    }

    uint256 private _tokenIds;
    mapping(uint256 => Credential)        private _credentials;
    mapping(address => TriagePayload)     private _triagePayloads;
    mapping(address => BreakGlassEvent[]) private _auditLog;
    mapping(address => bool)              public verifiedMedics;

    event CredentialIssued(uint256 indexed tokenId, address indexed holder, string credentialType);
    event CredentialRevoked(uint256 indexed tokenId);
    event BreakGlassAccessed(address indexed patient, address indexed accessor, string reason, uint256 timestamp);
    event TriagePayloadSet(address indexed patient);

    constructor() ERC721("SmartCareHub Credential", "SCHC") Ownable(msg.sender) {}

    // ─── Soulbound: block transfers between non-zero addresses ───────────────
    function _update(address to, uint256 tokenId, address auth)
        internal override returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("CredentialLocker: soulbound - transfers disabled");
        }
        return super._update(to, tokenId, auth);
    }

    // ─── Credential Issuance ─────────────────────────────────────────────────
    function issueCredential(
        address holder,
        string calldata credentialType,
        uint256 expiresAt,
        bytes32 dataHash
    ) external returns (uint256) {
        _tokenIds++;
        uint256 tokenId = _tokenIds;
        _safeMint(holder, tokenId);
        _credentials[tokenId] = Credential(credentialType, msg.sender, block.timestamp, expiresAt, dataHash, false);
        emit CredentialIssued(tokenId, holder, credentialType);
        return tokenId;
    }

    function revokeCredential(uint256 tokenId) external {
        require(_credentials[tokenId].issuer == msg.sender, "CredentialLocker: not issuer");
        _credentials[tokenId].revoked = true;
        emit CredentialRevoked(tokenId);
    }

    function getCredential(uint256 tokenId) external view returns (Credential memory) {
        return _credentials[tokenId];
    }

    // ─── Triage Payload ──────────────────────────────────────────────────────
    function setTriagePayload(string calldata encryptedCID, address[] calldata guardians) external {
        _triagePayloads[msg.sender] = TriagePayload(encryptedCID, guardians, true);
        emit TriagePayloadSet(msg.sender);
    }

    // ─── Break-Glass — Trigger 1: Guardian ───────────────────────────────────
    function breakGlassAsGuardian(address patient) external returns (string memory) {
        TriagePayload storage payload = _triagePayloads[patient];
        require(payload.active, "CredentialLocker: no triage payload");
        require(_isGuardian(patient, msg.sender), "CredentialLocker: not a guardian");
        _recordAudit(patient, msg.sender, "GUARDIAN_SIGNED");
        return payload.encryptedCID;
    }

    // ─── Break-Glass — Trigger 2: Verified Medic ─────────────────────────────
    function breakGlassAsMedic(address patient, uint256 medicCredentialTokenId)
        external returns (string memory)
    {
        TriagePayload storage payload = _triagePayloads[patient];
        require(payload.active, "CredentialLocker: no triage payload");
        require(ownerOf(medicCredentialTokenId) == msg.sender, "CredentialLocker: not credential holder");
        Credential storage cred = _credentials[medicCredentialTokenId];
        require(!cred.revoked, "CredentialLocker: credential revoked");
        require(cred.expiresAt == 0 || cred.expiresAt > block.timestamp, "CredentialLocker: credential expired");
        require(verifiedMedics[msg.sender], "CredentialLocker: not a verified medic");
        _recordAudit(patient, msg.sender, "MEDIC_CREDENTIAL");
        return payload.encryptedCID;
    }

    // ─── Audit ───────────────────────────────────────────────────────────────
    function getAuditLog(address patient) external view returns (BreakGlassEvent[] memory) {
        return _auditLog[patient];
    }

    // ─── Internal ────────────────────────────────────────────────────────────
    function _isGuardian(address patient, address candidate) internal view returns (bool) {
        address[] storage gs = _triagePayloads[patient].guardians;
        for (uint256 i = 0; i < gs.length; i++) {
            if (gs[i] == candidate) return true;
        }
        return false;
    }

    function _recordAudit(address patient, address accessor, string memory reason) internal {
        _auditLog[patient].push(BreakGlassEvent(accessor, block.timestamp, reason));
        emit BreakGlassAccessed(patient, accessor, reason, block.timestamp);
    }

    function registerMedic(address medic, bool status) external onlyOwner {
        verifiedMedics[medic] = status;
    }
}
