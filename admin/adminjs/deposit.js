// deposit.js
document.addEventListener('DOMContentLoaded', async () => {
    // Elementos del DOM
    const connectButton = document.getElementById('connectButton');
    const accountInfo = document.getElementById('accountInfo');
    const depositAmountInput = document.getElementById('depositAmount');
    const depositButton = document.getElementById('depositButton');
    const transferAmountInput = document.getElementById('transferAmount');
    const transferButton = document.getElementById('transferButton');
    const contractBalanceInput = document.getElementById('contractBalance');
    const operationsBalanceInput = document.getElementById('operationsBalance');
    const refreshBalance = document.getElementById('refreshBalance');
    const refreshOpBalance = document.getElementById('refreshOpBalance');
    const userContainer = document.getElementById('userCointainer');
    const bodySection = document.getElementById('bodySection');

    function initializePage() {
        if (userContainer) userContainer.style.opacity = '0';
        if (bodySection) bodySection.style.display = 'none';
        if (connectButton) connectButton.style.display = 'block';
    }

    initializePage();

    async function updateBalances() {
        try {
            const balances = await FundsManagement.getBalances();
            contractBalanceInput.value = `${balances.funds} ETH`;
            operationsBalanceInput.value = `${balances.operations} ETH`;
            console.log('Balances actualizados:', balances);
        } catch (error) {
            console.error("Error al actualizar balances:", error);
            alert('Error al actualizar balances: ' + error.message);
        }
    }

    async function handleDeposit() {
        try {
            const amount = depositAmountInput.value.trim();
            const parsedAmount = parseFloat(amount);
            
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error('Por favor, ingrese una cantidad válida mayor que 0');
            }

            console.log(`Realizando depósito de ${parsedAmount} ETH`);
            depositButton.disabled = true;
            await FundsManagement.deposit(parsedAmount);
            alert('Depósito realizado con éxito');
            depositAmountInput.value = '';
            await updateBalances();
        } catch (error) {
            console.error("Error en handleDeposit:", error);
            alert('Error en el depósito: ' + error.message);
        } finally {
            depositButton.disabled = false;
        }
    }

    async function handleTransfer() {
        try {
            const amount = transferAmountInput.value.trim();
            const parsedAmount = parseFloat(amount);
            
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error('Por favor, ingrese una cantidad válida mayor que 0');
            }

            console.log(`Realizando transferencia de ${parsedAmount} ETH a operaciones`);
            transferButton.disabled = true;
            await FundsManagement.transferToOperations(parsedAmount);
            alert('Transferencia realizada con éxito');
            transferAmountInput.value = '';
            await updateBalances();
        } catch (error) {
            console.error("Error en handleTransfer:", error);
            alert('Error en la transferencia: ' + error.message);
        } finally {
            transferButton.disabled = false;
        }
    }

    async function connectMetamask() {
        try {
            await BlockchainService.initialize();
            await BlockchainService.connectAccount();
            
            const chainId = await BlockchainService.web3.eth.getChainId();
            console.log(`Chain ID actual: ${chainId}`);
            if (Number(chainId) !== 31337) {
                throw new Error("Por favor, conecta a la red local de Hardhat (Chain ID 31337)");
            }

            if (accountInfo) {
                accountInfo.textContent = BlockchainService.account;
            }

            const isOwner = await BlockchainService.isContractOwner();
            if (!isOwner) {
                throw new Error("Solo el propietario puede acceder a esta página");
            }

            if (userContainer) userContainer.style.opacity = '1';
            if (bodySection) bodySection.style.display = 'block';
            if (connectButton) connectButton.style.display = 'none';

            await updateBalances();

            // Configurar listeners
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', () => window.location.reload());

            console.log('MetaMask conectado y configurado correctamente');
        } catch (error) {
            console.error("Error al conectar:", error);
            alert(error.message);
            initializePage();
        }
    }

    async function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            alert('Por favor, conecta MetaMask.');
            initializePage();
        } else {
            BlockchainService.account = accounts[0];
            if (accountInfo) {
                accountInfo.textContent = BlockchainService.account;
            }
            try {
                const isOwner = await BlockchainService.isContractOwner();
                if (!isOwner) {
                    throw new Error("Solo el propietario puede acceder a esta página");
                }
                await updateBalances();
            } catch (error) {
                console.error("Error al verificar propietario tras cambio de cuenta:", error);
                alert(error.message);
                initializePage();
            }
        }
    }

    // Event Listeners
    if (connectButton) {
        connectButton.addEventListener('click', connectMetamask);
    }

    if (depositButton) {
        depositButton.addEventListener('click', handleDeposit);
    }

    if (transferButton) {
        transferButton.addEventListener('click', handleTransfer);
    }

    if (refreshBalance) {
        refreshBalance.addEventListener('click', updateBalances);
    }

    if (refreshOpBalance) {
        refreshOpBalance.addEventListener('click', updateBalances);
    }

    // Actualizar balances periódicamente
    setInterval(() => {
        if (BlockchainService.web3 && BlockchainService.account) {
            updateBalances();
        }
    }, 30000);
});
