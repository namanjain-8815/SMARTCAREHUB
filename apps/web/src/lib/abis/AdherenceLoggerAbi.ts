export const AdherenceLoggerAbi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "ECDSAInvalidSignature",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "length",
        "type": "uint256"
      }
    ],
    "name": "ECDSAInvalidSignatureLength",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "s",
        "type": "bytes32"
      }
    ],
    "name": "ECDSAInvalidSignatureS",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidShortString",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "str",
        "type": "string"
      }
    ],
    "name": "StringTooLong",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "patient",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "eventHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "scheduledAt",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "confirmedAt",
        "type": "uint256"
      }
    ],
    "name": "DosageConfirmed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "EIP712DomainChanged",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "patient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "from",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "to",
        "type": "uint256"
      }
    ],
    "name": "computeComplianceScore",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "confirmed",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "inWindow",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "eip712Domain",
    "outputs": [
      {
        "internalType": "bytes1",
        "name": "fields",
        "type": "bytes1"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "version",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "chainId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "verifyingContract",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "salt",
        "type": "bytes32"
      },
      {
        "internalType": "uint256[]",
        "name": "extensions",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "patient",
        "type": "address"
      }
    ],
    "name": "getLogOf",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "medicationId",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "scheduledAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "confirmedAt",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "eventHash",
            "type": "bytes32"
          }
        ],
        "internalType": "struct AdherenceLogger.DosageEvent[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMyLog",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "medicationId",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "scheduledAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "confirmedAt",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "eventHash",
            "type": "bytes32"
          }
        ],
        "internalType": "struct AdherenceLogger.DosageEvent[]",
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
        "internalType": "string",
        "name": "medicationId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "scheduledAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "confirmedAt",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "logDosage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
