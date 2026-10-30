export const DelegationManagerAbi = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "grantor",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "delegate",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "role",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "expiresAt",
        "type": "uint256"
      }
    ],
    "name": "DelegationGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "grantor",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "delegationIndex",
        "type": "uint256"
      }
    ],
    "name": "DelegationRevoked",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "ROLE_READ_ONLY",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ROLE_READ_WRITE",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "grantor",
        "type": "address"
      }
    ],
    "name": "getDelegationsOf",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "delegate",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "role",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "expiresAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "revoked",
            "type": "bool"
          },
          {
            "internalType": "bytes",
            "name": "encryptedKey",
            "type": "bytes"
          }
        ],
        "internalType": "struct DelegationManager.Delegation[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getGrantedDelegations",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "delegate",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "role",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "expiresAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "revoked",
            "type": "bool"
          },
          {
            "internalType": "bytes",
            "name": "encryptedKey",
            "type": "bytes"
          }
        ],
        "internalType": "struct DelegationManager.Delegation[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "delegate",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "role",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "expiresAt",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "encryptedKey",
        "type": "bytes"
      }
    ],
    "name": "grantDelegation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "grantor",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "delegate",
        "type": "address"
      }
    ],
    "name": "hasValidAccess",
    "outputs": [
      {
        "internalType": "bool",
        "name": "valid",
        "type": "bool"
      },
      {
        "internalType": "uint8",
        "name": "role",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "revokeDelegation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
