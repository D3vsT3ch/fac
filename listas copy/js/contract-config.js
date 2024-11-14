// Contract configuration
window.ContractConfig = {
    // Contract addresses from latest deployment
    addresses: {
        operations: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        funds: '0x5FbDB2315678afecb367f032d93F642f64180aa3'
    },

    // OpenGSN addresses
    gsn: {
        trustedForwarder: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
        relayHub: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
        paymaster: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'
    },

    // Contract ABIs
    abis: {
        operations: [
            {
                "inputs": [{"internalType": "address","name": "_trustedForwarder","type": "address"}],
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "inputs": [{"internalType": "address","name": "_admin","type": "address"}],
                "name": "addAdmin",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address","name": "_user","type": "address"}],
                "name": "addToWhitelist",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "owner",
                "outputs": [{"internalType": "address","name": "","type": "address"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address","name": "_user","type": "address"}],
                "name": "isAdmin",
                "outputs": [{"internalType": "bool","name": "","type": "bool"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address","name": "_user","type": "address"}],
                "name": "isWhitelisted",
                "outputs": [{"internalType": "bool","name": "","type": "bool"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getAdmins",
                "outputs": [{"internalType": "address[]","name": "","type": "address[]"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getWhitelistedUsers",
                "outputs": [{"internalType": "address[]","name": "","type": "address[]"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address","name": "_admin","type": "address"}],
                "name": "removeAdmin",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address","name": "_user","type": "address"}],
                "name": "removeFromWhitelist",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address payable","name": "_to","type": "address"}],
                "name": "sendBalance",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ],
        funds: [
            {
                "inputs": [],
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "inputs": [],
                "name": "deposit",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "owner",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address payable",
                        "name": "_operationsContract",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_amount",
                        "type": "uint256"
                    }
                ],
                "name": "transferToOperations",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
    }
};