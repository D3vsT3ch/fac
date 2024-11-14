document.addEventListener('DOMContentLoaded', async () => {
    // Elementos del DOM permanecen igual
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

    let web3;
    let userAccount;
    let fundsContract;
    let operationsContract;
    let isOwner = false;

    function initializePage() {
        if (userContainer) userContainer.style.opacity = '0';
        if (bodySection) bodySection.style.display = 'none';
        if (connectButton) connectButton.style.display = 'block';
    }

    initializePage();

    // Función auxiliar para manejar transacciones
    async function sendTransaction(method, options = {}) {
        const gasPrice = await web3.eth.getGasPrice();
        const nonce = await web3.eth.getTransactionCount(userAccount);
        const gasEstimate = await method.estimateGas({
            from: userAccount,
            ...options
        });

        return method.send({
            from: userAccount,
            gas: Math.floor(Number(gasEstimate) * 1.2).toString(),
            gasPrice: gasPrice,
            nonce: nonce,
            ...options
        });
    }

    async function checkOwnership() {
        try {
            const ownerAddress = await fundsContract.methods.owner().call();
            isOwner = userAccount.toLowerCase() === ownerAddress.toLowerCase();
            if (!isOwner) {
                alert("Solo el propietario puede acceder a esta página");
                initializePage();
            }
            return isOwner;
        } catch (error) {
            console.error("Error al verificar propiedad:", error);
            return false;
        }
    }

    async function updateBalances() {
        try {
            const [fundsBalance, operationsBalance] = await Promise.all([
                web3.eth.getBalance(fundsContractAddress),
                web3.eth.getBalance(contractAddress)
            ]);

            contractBalanceInput.value = `${web3.utils.fromWei(fundsBalance, 'ether')} ETH`;
            operationsBalanceInput.value = `${web3.utils.fromWei(operationsBalance, 'ether')} ETH`;
        } catch (error) {
            console.error("Error al actualizar balances:", error);
        }
    }

    async function depositEther(amount) {
        try {
            const amountWei = web3.utils.toWei(amount.toString(), 'ether');
            const method = fundsContract.methods.deposit();
            
            const tx = await sendTransaction(method, { value: amountWei });
            console.log('Transacción de depósito:', tx.transactionHash);
            
            alert('Depósito realizado con éxito');
            depositAmountInput.value = '';
            await updateBalances();
        } catch (error) {
            console.error("Error al depositar:", error);
            alert('Error al realizar el depósito: ' + error.message);
        }
    }

    async function transferToOperations(amount) {
        try {
            const amountWei = web3.utils.toWei(amount.toString(), 'ether');
            const method = fundsContract.methods.transferToOperations(contractAddress, amountWei);
            
            const tx = await sendTransaction(method);
            console.log('Transacción de transferencia:', tx.transactionHash);
            
            alert('Transferencia realizada con éxito');
            transferAmountInput.value = '';
            await updateBalances();
        } catch (error) {
            console.error("Error al transferir:", error);
            alert('Error al realizar la transferencia: ' + error.message);
        }
    }

    async function connectMetamask() {
        if (window.ethereum) {
            web3 = new Web3(window.ethereum);
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                userAccount = (await web3.eth.getAccounts())[0];
                console.log("Cuenta conectada:", userAccount);
                
                if (accountInfo) accountInfo.textContent = userAccount;

                // Inicializar contratos
                fundsContract = new web3.eth.Contract(fundsContractABI, fundsContractAddress);
                operationsContract = new web3.eth.Contract(contractABI, contractAddress);

                const isContractOwner = await checkOwnership();
                if (!isContractOwner) return;

                if (userContainer) userContainer.style.opacity = '1';
                if (bodySection) bodySection.style.display = 'block';
                if (connectButton) connectButton.style.display = 'none';

                await updateBalances();

                // Configurar listeners
                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', () => window.location.reload());

            } catch (error) {
                console.error("Error al conectar:", error);
                alert("Error al conectar con MetaMask: " + error.message);
            }
        } else {
            alert("Por favor, instala MetaMask");
        }
    }

    async function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            alert('Por favor, conecta MetaMask.');
            initializePage();
        } else {
            userAccount = accounts[0];
            if (accountInfo) accountInfo.textContent = userAccount;
            const isContractOwner = await checkOwnership();
            if (!isContractOwner) {
                initializePage();
                return;
            }
            await updateBalances();
        }
    }

    // Event Listeners
    if (connectButton) {
        connectButton.addEventListener('click', connectMetamask);
    }

    if (depositButton) {
        depositButton.addEventListener('click', async () => {
            const amount = depositAmountInput.value.trim();
            const parsedAmount = parseFloat(amount);
            if (!isNaN(parsedAmount) && parsedAmount > 0) {
                await depositEther(parsedAmount);
            } else {
                alert('Por favor, ingrese una cantidad válida mayor que 0');
            }
        });
    }

    if (transferButton) {
        transferButton.addEventListener('click', async () => {
            const amount = transferAmountInput.value.trim();
            const parsedAmount = parseFloat(amount);
            if (!isNaN(parsedAmount) && parsedAmount > 0) {
                await transferToOperations(parsedAmount);
            } else {
                alert('Por favor, ingrese una cantidad válida mayor que 0');
            }
        });
    }

    if (refreshBalance) {
        refreshBalance.addEventListener('click', updateBalances);
    }

    if (refreshOpBalance) {
        refreshOpBalance.addEventListener('click', updateBalances);
    }

    // Actualizar balances cada 30 segundos
    setInterval(updateBalances, 30000);
});