document.addEventListener('DOMContentLoaded', async () => {
    // Elementos del DOM
    const connectButton = document.getElementById('connectButton');
    const accountInfo = document.getElementById('accountInfo');
    const addAccountInput = document.getElementById('addAccount');
    const addAccountButton = document.getElementById('addAccountButton');
    const userContainer = document.getElementById('userCointainer');
    const bodySection = document.getElementById('bodySection');
    const fieldsToHide = document.querySelectorAll('.hideOnLoad');
    const userTable = document.getElementById('userTable');
    const contractBalanceInput = document.getElementById('contractBalance');
    const refreshBalance = document.getElementById('refreshBalance');

    let web3;
    let userAccount;
    let operationsContract;
    let isOwner = false;

    function initializePage() {
        if (userContainer) userContainer.style.opacity = '0';
        if (bodySection) bodySection.style.display = 'none';
        fieldsToHide.forEach(element => {
            if (element) element.style.display = 'none';
        });
        if (connectButton) connectButton.style.display = 'block';
    }

    initializePage();

    async function initGSN() {
        try {
            const gsnConfig = {
                paymasterAddress: paymaster,
                forwarderAddress: trustedForwarder,
                relayHubAddress: relayHub,
                chainId: 31337,
                methodSuffix: '_v4',
                jsonStringifyRequest: true,
                loggerConfiguration: {
                    logLevel: 'debug'
                }
            };

            const gsnProvider = await RelayProvider.newProvider({
                provider: window.ethereum,
                config: gsnConfig
            }).init();

            return new Web3(gsnProvider);
        } catch (error) {
            console.error("Error al inicializar GSN:", error);
            throw error;
        }
    }

    async function checkOwnership() {
        try {
            const ownerAddress = await operationsContract.methods.owner().call();
            isOwner = userAccount.toLowerCase() === ownerAddress.toLowerCase();
            console.log("¿Es propietario?", isOwner);
            return isOwner;
        } catch (error) {
            console.error("Error al verificar propiedad:", error);
            return false;
        }
    }

    async function updateContractBalance() {
        try {
            const balance = await web3.eth.getBalance(contractAddress);
            const balanceEth = web3.utils.fromWei(balance, 'ether');
            console.log("Balance del contrato:", balanceEth, "ETH");
            
            if (contractBalanceInput) {
                contractBalanceInput.value = balanceEth + ' ETH';
            }

            return balanceEth;
        } catch (error) {
            console.error("Error al actualizar balance:", error);
            return "0";
        }
    }

    async function addUserToWhitelist(address) {
        try {
            const method = operationsContract.methods.addToWhitelist(address);
            await method.send({
                from: userAccount,
                gasPrice: '0'
            });
            alert('Usuario agregado a whitelist');
            addAccountInput.value = '';
            await loadUserList();
        } catch (error) {
            console.error("Error al agregar usuario:", error);
            alert('Error al agregar usuario: ' + error.message);
        }
    }

    // Funciones globales para la tabla
    window.handleToggleAdmin = async (address, makeAdmin) => {
        try {
            const method = makeAdmin ? 
                operationsContract.methods.addAdmin(address) : 
                operationsContract.methods.removeAdmin(address);
            
            await method.send({
                from: userAccount,
                gasPrice: '0'
            });

            alert(makeAdmin ? 'Usuario agregado como administrador' : 'Administrador removido');
            await loadUserList();
        } catch (error) {
            console.error('Error al modificar admin:', error);
            alert('Error al modificar admin: ' + error.message);
        }
    };

    window.handleDeleteUser = async (address) => {
        try {
            const method = operationsContract.methods.removeFromWhitelist(address);
            await method.send({
                from: userAccount,
                gasPrice: '0'
            });

            alert('Usuario eliminado');
            await loadUserList();
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            alert('Error al eliminar usuario: ' + error.message);
        }
    };

    window.handleSendBalance = async (address) => {
        try {
            const method = operationsContract.methods.sendBalance(address);
            await method.send({
                from: userAccount,
                gasPrice: '0'
            });

            alert('Balance enviado exitosamente');
            await updateContractBalance();
        } catch (error) {
            console.error('Error al enviar balance:', error);
            alert('Error al enviar balance: ' + error.message);
        }
    };

    async function loadUserList() {
        try {
            const [admins, whitelisted] = await Promise.all([
                operationsContract.methods.getAdmins().call(),
                operationsContract.methods.getWhitelistedUsers().call()
            ]);

            const users = new Map();

            for (const address of whitelisted) {
                users.set(address.toLowerCase(), { address, isWhitelisted: true, isAdmin: false });
            }

            for (const address of admins) {
                const lowerAddress = address.toLowerCase();
                if (users.has(lowerAddress)) {
                    users.get(lowerAddress).isAdmin = true;
                } else {
                    users.set(lowerAddress, { address, isWhitelisted: false, isAdmin: true });
                }
            }

            while (userTable.rows.length > 1) {
                userTable.deleteRow(1);
            }

            for (const user of users.values()) {
                const row = userTable.insertRow();
                
                const cellAddress = row.insertCell();
                cellAddress.textContent = user.address;

                const cellRoles = row.insertCell();
                const roles = [];
                if (user.isWhitelisted) roles.push("Usuario");
                if (user.isAdmin) roles.push("Administrador");
                cellRoles.innerHTML = `<div class="tag">${roles.join(', ')}</div>`;

                const cellActions = row.insertCell();
                const actionsHtml = [];

                if (user.address.toLowerCase() !== userAccount.toLowerCase()) {
                    actionsHtml.push(`<img src="../images/icon_symbol_money.svg" onclick="handleSendBalance('${user.address}')" title="Enviar monto establecido">`);
                }

                if (!user.isAdmin) {
                    actionsHtml.push(`<img src="../images/icon_group_users.svg" onclick="handleToggleAdmin('${user.address}', true)" title="Hacer administrador">`);
                } else {
                    actionsHtml.push(`<img src="../images/icon_remove_admin.svg" onclick="handleToggleAdmin('${user.address}', false)" title="Quitar administrador">`);
                }

                actionsHtml.push(`<img src="../images/icon_delete.svg" onclick="handleDeleteUser('${user.address}')" title="Eliminar usuario">`);
                
                cellActions.innerHTML = actionsHtml.join('');
            }

        } catch (error) {
            console.error("Error al cargar usuarios:", error);
            alert("Error al cargar la lista de usuarios");
        }
    }

    function showAdminInterface() {
        if (userContainer) userContainer.style.opacity = '1';
        if (bodySection) bodySection.style.display = 'block';
        fieldsToHide.forEach(element => {
            if (element) element.style.display = 'block';
        });
        if (connectButton) connectButton.style.display = 'none';
    }

    async function connectMetamask() {
        if (window.ethereum) {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                userAccount = (await window.ethereum.request({ method: 'eth_accounts' }))[0];
                console.log("Cuenta conectada:", userAccount);
                
                if (accountInfo) accountInfo.textContent = userAccount;

                // Inicializar GSN y Web3
                web3 = await initGSN();
                operationsContract = new web3.eth.Contract(contractABI, contractAddress);

                const isContractOwner = await checkOwnership();
                if (!isContractOwner) {
                    const isAdmin = await operationsContract.methods.isAdmin(userAccount).call();
                    if (!isAdmin) {
                        alert("No tienes permisos de administrador");
                        return;
                    }
                }

                showAdminInterface();

                await Promise.all([
                    updateContractBalance(),
                    loadUserList()
                ]);

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
                const isAdmin = await operationsContract.methods.isAdmin(userAccount).call();
                if (!isAdmin) {
                    alert("La nueva cuenta no tiene permisos de administrador");
                    initializePage();
                    return;
                }
            }
            
            showAdminInterface();
            await loadUserList();
        }
    }

    // Event Listeners
    if (connectButton) {
        connectButton.addEventListener('click', connectMetamask);
    }

    if (addAccountButton) {
        addAccountButton.addEventListener('click', async () => {
            const address = addAccountInput.value.trim();
            if (web3.utils.isAddress(address)) {
                await addUserToWhitelist(address);
            } else {
                alert('Por favor, ingresa una dirección de Ethereum válida');
            }
        });
    }

    if (refreshBalance) {
        refreshBalance.addEventListener('click', updateContractBalance);
    }

    // Actualizar balance cada 30 segundos
    setInterval(() => {
        if (web3 && userAccount) {
            updateContractBalance();
        }
    }, 30000);
});