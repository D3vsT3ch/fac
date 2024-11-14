// Blockchain service for managing Web3 interactions
window.BlockchainService = {
    web3: null,
    account: null,
    operationsContract: null,
    fundsContract: null,

    async initialize() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }
            
            this.web3 = new Web3(window.ethereum);
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
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
            console.log('Initializing operations contract with address:', address);
            console.log('Using ABI:', abi);
            this.operationsContract = new this.web3.eth.Contract(abi, address);
            return this.operationsContract;
        } catch (error) {
            console.error('Contract initialization error:', error);
            throw error;
        }
    },

    initFundsContract(address, abi) {
        try {
            if (!this.web3) {
                throw new Error('Web3 not initialized');
            }
            console.log('Initializing funds contract with address:', address);
            console.log('Using ABI:', abi);
            this.fundsContract = new this.web3.eth.Contract(abi, address);
            return this.fundsContract;
        } catch (error) {
            console.error('Funds contract initialization error:', error);
            throw error;
        }
    },

    async sendTransaction(method, options = {}) {
        try {
            if (!this.account) {
                throw new Error('No account connected');
            }

            const params = {
                from: this.account,
                ...options
            };

            // Only estimate gas if not a payable function
            if (!options.value) {
                const gasEstimate = await method.estimateGas(params);
                console.log('Gas estimate:', gasEstimate);
                params.gas = Math.floor(gasEstimate * 1.2);
            }

            console.log('Sending transaction with params:', params);
            const tx = await method.send(params);
            console.log('Transaction successful:', tx);
            return tx;
        } catch (error) {
            console.error('Transaction error:', error);
            throw error;
        }
    },

    async callContractMethod(method) {
        try {
            if (!this.account) {
                throw new Error('No account connected');
            }
            console.log('Calling contract method:', method._method.name);
            const result = await method.call({ from: this.account });
            console.log('Method result:', result);
            return result;
        } catch (error) {
            console.error('Contract method call error:', error);
            throw error;
        }
    }
};