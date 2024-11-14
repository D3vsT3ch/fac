// Blockchain service for managing Web3 interactions
window.BlockchainService = {
    web3: null,
    account: null,
    operationsContract: null,

    async initialize() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }
            
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Initialize Web3 with MetaMask's provider
            this.web3 = new Web3(window.ethereum);
            
            return this.web3;
        } catch (error) {
            console.error('Web3 initialization error:', error);
            throw error;
        }
    },

    async connectAccount() {
        try {
            const accounts = await this.web3.eth.getAccounts();
            this.account = accounts[0];
            return this.account;
        } catch (error) {
            console.error('Account connection error:', error);
            throw error;
        }
    },

    initContract(address, abi) {
        try {
            if (!this.web3) {
                throw new Error('Web3 not initialized');
            }
            this.operationsContract = new this.web3.eth.Contract(abi, address);
            return this.operationsContract;
        } catch (error) {
            console.error('Contract initialization error:', error);
            throw error;
        }
    },

    async sendTransaction(method, options = {}) {
        try {
            if (!this.account) {
                throw new Error('No account connected');
            }

            const gasEstimate = await method.estimateGas({
                from: this.account,
                ...options
            });

            const tx = await method.send({
                from: this.account,
                gas: Math.floor(gasEstimate * 1.2),
                ...options
            });
            return tx;
        } catch (error) {
            console.error('Transaction error:', error);
            throw error;
        }
    }
};