// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DelegationManager
/// @notice Manages granular, time-bound, revocable delegation of record access.
contract DelegationManager {

    uint8 public constant ROLE_READ_ONLY  = 1;
    uint8 public constant ROLE_READ_WRITE = 2;

    struct Delegation {
        address delegate;
        uint8   role;
        uint256 expiresAt;    // Unix timestamp; 0 = never
        bool    revoked;
        bytes   encryptedKey; // Patient's AES key re-encrypted for the delegate (ECDH)
    }

    mapping(address => Delegation[]) private _delegations;

    event DelegationGranted(
        address indexed grantor,
        address indexed delegate,
        uint8   role,
        uint256 expiresAt
    );
    event DelegationRevoked(address indexed grantor, uint256 indexed delegationIndex);

    /// @notice Grant time-bound access with a re-encrypted key bundle
    function grantDelegation(
        address delegate,
        uint8   role,
        uint256 expiresAt,
        bytes calldata encryptedKey
    ) external {
        require(delegate != address(0) && delegate != msg.sender, "DelegationManager: invalid delegate");
        require(role == ROLE_READ_ONLY || role == ROLE_READ_WRITE, "DelegationManager: invalid role");
        require(expiresAt == 0 || expiresAt > block.timestamp, "DelegationManager: expiry in past");

        _delegations[msg.sender].push(Delegation({
            delegate:     delegate,
            role:         role,
            expiresAt:    expiresAt,
            revoked:      false,
            encryptedKey: encryptedKey
        }));

        emit DelegationGranted(msg.sender, delegate, role, expiresAt);
    }

    /// @notice Immediately revoke a delegation — no intermediary required
    function revokeDelegation(uint256 index) external {
        require(index < _delegations[msg.sender].length, "DelegationManager: out of bounds");
        _delegations[msg.sender][index].revoked = true;
        emit DelegationRevoked(msg.sender, index);
    }

    /// @notice Check if a delegate currently holds valid access
    function hasValidAccess(address grantor, address delegate)
        external view returns (bool valid, uint8 role)
    {
        Delegation[] storage dels = _delegations[grantor];
        for (uint256 i = 0; i < dels.length; i++) {
            Delegation storage d = dels[i];
            if (
                d.delegate == delegate &&
                !d.revoked &&
                (d.expiresAt == 0 || d.expiresAt > block.timestamp)
            ) {
                return (true, d.role);
            }
        }
        return (false, 0);
    }

    /// @notice Return all delegations granted by the caller (for permission matrix UI)
    function getGrantedDelegations() external view returns (Delegation[] memory) {
        return _delegations[msg.sender];
    }

    /// @notice Return all delegations granted by a specific grantor
    function getDelegationsOf(address grantor) external view returns (Delegation[] memory) {
        return _delegations[grantor];
    }
}
