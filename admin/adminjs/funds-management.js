// funds-management.js
// Gestión de fondos y depósitos
window.FundsManagement = {
    async deposit(amount) {
        try {
            if (!BlockchainService.web3 || !BlockchainService.account) {
                throw new Error('Servicio blockchain no inicializado');
            }

            const web3 = BlockchainService.web3;
            const account = BlockchainService.account;
            
            // Convertir amount a Wei
            const amountWei = web3.utils.toWei(amount.toString(), 'ether');
            console.log(`Intentando depositar ${amount} ETH (${amountWei} Wei)`);

            // Verificar balance del usuario
            const balance = await web3.eth.getBalance(account);
            console.log(`Balance del usuario: ${balance} Wei`);
            if (BigInt(balance) < BigInt(amountWei)) {
                throw new Error('Balance insuficiente en la cuenta');
            }

            // Preparar la transacción
            const depositMethod = BlockchainService.fundsContract.methods.deposit();

            // Enviar la transacción utilizando sendTransaction
            const tx = await BlockchainService.sendTransaction(depositMethod, {
                value: amountWei
            });

            console.log('Depósito completado:', tx);
            return tx;
        } catch (error) {
            console.error("Error en depósito:", error);
            throw error;
        }
    },

    async transferToOperations(amount) {
        try {
            if (!BlockchainService.web3 || !BlockchainService.account) {
                throw new Error('Servicio blockchain no inicializado');
            }

            const web3 = BlockchainService.web3;
            const account = BlockchainService.account;

            // Convertir amount a Wei
            const amountWei = web3.utils.toWei(amount.toString(), 'ether');
            console.log(`Intentando transferir ${amount} ETH (${amountWei} Wei) a operaciones`);

            // Verificar balance del contrato
            const contractBalance = await web3.eth.getBalance(ContractConfig.addresses.funds);
            console.log(`Balance del contrato: ${contractBalance} Wei`);
            if (BigInt(contractBalance) < BigInt(amountWei)) {
                throw new Error('Balance insuficiente en el contrato');
            }

            // Preparar la transacción
            const transferMethod = BlockchainService.fundsContract.methods.transferToOperations(
                ContractConfig.addresses.operations,
                amountWei
            );

            // Enviar la transacción utilizando sendTransaction
            const tx = await BlockchainService.sendTransaction(transferMethod, {
                from: account
            });

            console.log('Transferencia completada:', tx);
            return tx;
        } catch (error) {
            console.error("Error en transferencia:", error);
            throw error;
        }
    },

    async getBalances() {
        try {
            if (!BlockchainService.web3) {
                throw new Error('Servicio blockchain no inicializado');
            }

            const web3 = BlockchainService.web3;
            const [fundsBalance, operationsBalance] = await Promise.all([
                web3.eth.getBalance(ContractConfig.addresses.funds),
                web3.eth.getBalance(ContractConfig.addresses.operations)
            ]);

            console.log(`Balance del contrato de fondos: ${fundsBalance} Wei`);
            console.log(`Balance del contrato de operaciones: ${operationsBalance} Wei`);

            return {
                funds: web3.utils.fromWei(fundsBalance, 'ether'),
                operations: web3.utils.fromWei(operationsBalance, 'ether')
            };
        } catch (error) {
            console.error("Error al obtener balances:", error);
            throw error;
        }
    }
};
