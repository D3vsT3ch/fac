// Blockchain utility functions
window.BlockchainUtils = {
    async checkNetwork(web3) {
        try {
            const chainId = await web3.eth.getChainId();
            console.log('Current chain ID:', chainId);
            if (Number(chainId) !== 31337) {
                throw new Error('Red incorrecta. Conecta a la red local Hardhat');
            }
            return chainId;
        } catch (error) {
            console.error('Network check error:', error);
            throw error;
        }
    },

    async estimateGas(contractInstance, method, params = {}) {
        try {
            const gasEstimate = await method.estimateGas(params);
            console.log('Gas estimate:', gasEstimate);
            return Math.floor(Number(gasEstimate) * 1.2).toString();
        } catch (error) {
            console.error('Gas estimation error:', error);
            return '500000'; // Higher default gas limit
        }
    },

    async getTransactionParams(web3, userAccount) {
        try {
            const [nonce, gasPrice] = await Promise.all([
                web3.eth.getTransactionCount(userAccount, 'latest'),
                web3.eth.getGasPrice()
            ]);
            
            const adjustedGasPrice = Math.floor(Number(gasPrice) * 1.1).toString();
            console.log('Transaction params:', { nonce, gasPrice, adjustedGasPrice });
            
            return { 
                nonce: nonce.toString(), 
                gasPrice: adjustedGasPrice
            };
        } catch (error) {
            console.error('Transaction params error:', error);
            throw error;
        }
    },

    toBigIntString(value) {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return value;
    }
};