// Utilidades Web3
const Web3Utils = {
    async checkNetwork(web3) {
        const chainId = await web3.eth.getChainId();
        if (Number(chainId) !== 31337) {
            throw new Error('Red incorrecta. Conecta a la red local Hardhat');
        }
        return chainId;
    },

    async estimateGas(contractInstance, method, params = {}) {
        try {
            const gasEstimate = await method.estimateGas(params);
            // Convertir a número y añadir 20% extra
            return Math.floor(Number(gasEstimate.toString()) * 1.2).toString();
        } catch (error) {
            console.error('Error al estimar gas:', error);
            return '100000'; // Valor por defecto si falla la estimación
        }
    },

    async getTransactionParams(web3, userAccount) {
        try {
            const [nonce, gasPrice] = await Promise.all([
                web3.eth.getTransactionCount(userAccount, 'latest'),
                web3.eth.getGasPrice()
            ]);
            
            // Convertir a número, aumentar 10% y volver a string
            const adjustedGasPrice = Math.floor(Number(gasPrice.toString()) * 1.1).toString();
            
            return { 
                nonce: nonce.toString(), 
                gasPrice: adjustedGasPrice
            };
        } catch (error) {
            console.error('Error al obtener parámetros de transacción:', error);
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

export { Web3Utils };