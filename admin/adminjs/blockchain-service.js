// blockchain-service.js

import { RelayProvider } from '@opengsn/provider';

window.BlockchainService = {
    web3: null,
    account: null,
    operationsContract: null, // Contrato que usa OpenGSN
    fundsContract: null,      // Contrato estándar

    async initialize() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask no está instalado');
            }

            // Inicializar web3 estándar
            this.web3 = new Web3(window.ethereum);

            // Inicializar FacFunds con web3 estándar
            this.initFundsContract();

            // Inicializar FacOperations con OpenGSN
            await this.initOperationsContract();

            return this.web3;
        } catch (error) {
            console.error('Error de inicialización de Web3:', error);
            throw error;
        }
    },

    initFundsContract() {
        try {
            if (!this.web3) {
                throw new Error('Web3 no inicializado');
            }

            this.fundsContract = new this.web3.eth.Contract(
                ContractConfig.abis.funds,
                ContractConfig.addresses.funds
            );

            console.log('FacFunds inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar FacFunds:', error);
            throw error;
        }
    },

    async initOperationsContract() {
        try {
            // Configurar OpenGSN Relay Provider
            const gsnProvider = await RelayProvider.newProvider({
                provider: this.web3.currentProvider,
                config: {
                    paymasterAddress: ContractConfig.gsn.paymaster
                }
            }).init();

            const gsnWeb3 = new Web3(gsnProvider);

            this.operationsContract = new gsnWeb3.eth.Contract(
                ContractConfig.abis.operations,
                ContractConfig.addresses.operations
            );

            console.log('FacOperations inicializado correctamente con GSN');
        } catch (error) {
            console.error('Error al inicializar FacOperations con GSN:', error);
            throw error;
        }
    },

    async connectAccount() {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const accounts = await this.web3.eth.getAccounts();
            this.account = accounts[0];
            return this.account;
        } catch (error) {
            console.error('Error al conectar cuenta:', error);
            throw error;
        }
    },

    async isContractOwner() {
        try {
            const ownerAddress = await this.fundsContract.methods.owner().call();
            return this.account.toLowerCase() === ownerAddress.toLowerCase();
        } catch (error) {
            console.error('Error al verificar propietario:', error);
            throw error;
        }
    },

    async sendTransaction(method, options = {}) {
        try {
            if (!this.account) {
                throw new Error('No hay cuenta conectada');
            }

            const params = {
                from: this.account,
                ...options
            };

            console.log('Preparando transacción con parámetros:', params);

            // Siempre estimar gas
            const gasEstimate = await method.estimateGas(params);
            console.log('Estimación de gas:', gasEstimate);
            params.gas = Math.floor(gasEstimate * 1.2); // Añade un buffer del 20%
            console.log('Gas final con buffer:', params.gas);

            // Enviar la transacción
            const tx = await method.send(params);
            console.log('Transacción enviada exitosamente:', tx);
            return tx;
        } catch (error) {
            console.error('Error en transacción:', error);
            throw error;
        }
    },

    async callContractMethod(method) {
        try {
            const result = await method.call({ from: this.account });
            return result;
        } catch (error) {
            console.error('Error al llamar método del contrato:', error);
            throw error;
        }
    }
};
