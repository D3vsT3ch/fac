document.addEventListener('DOMContentLoaded', async () => {
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

    async function checkOwnership() {
        try {
            if (!BlockchainService.operationsContract) {
                throw new Error('Contract not initialized');
            }
            const ownerMethod = BlockchainService.operationsContract.methods.owner();
            const ownerAddress = await BlockchainService.callContractMethod(ownerMethod);
            isOwner = BlockchainService.account.toLowerCase() === ownerAddress.toLowerCase();
            console.log('Owner check:', { ownerAddress, currentAccount: BlockchainService.account, isOwner });
            return isOwner;
        } catch (error) {
            console.error("Error checking ownership:", error);
            return false;
        }
    }

    async function updateContractBalance() {
        try {
            const balance = await BlockchainService.web3.eth.getBalance(ContractConfig.addresses.operations);
            const balanceEth = BlockchainService.web3.utils.fromWei(balance, 'ether');
            if (contractBalanceInput) {
                contractBalanceInput.value = balanceEth + ' ETH';
            }
            return balanceEth;
        } catch (error) {
            console.error("Error updating balance:", error);
            return "0";
        }
    }

    async function addUserToWhitelist(address) {
        try {
            const method = BlockchainService.operationsContract.methods.addToWhitelist(address);
            await BlockchainService.sendTransaction(method);
            alert('Usuario agregado a whitelist');
            addAccountInput.value = '';
            await loadUserList();
        } catch (error) {
            console.error("Error adding user:", error);
            alert('Error: ' + error.message);
        }
    }

    async function loadUserList() {
        try {
            const [admins, whitelisted] = await Promise.all([
                BlockchainService.callContractMethod(BlockchainService.operationsContract.methods.getAdmins()),
                BlockchainService.callContractMethod(BlockchainService.operationsContract.methods.getWhitelistedUsers())
            ]);

            console.log('Loaded users:', { admins, whitelisted });

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

            updateUserTable(Array.from(users.values()));
        } catch (error) {
            console.error("Error loading users:", error);
            alert("Error loading user list");
        }
    }

    function updateUserTable(users) {
        while (userTable.rows.length > 1) {
            userTable.deleteRow(1);
        }

        users.forEach(user => {
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

            if (user.address.toLowerCase() !== BlockchainService.account.toLowerCase()) {
                actionsHtml.push(`<img src="../images/icon_symbol_money.svg" onclick="handleSendBalance('${user.address}')" title="Enviar monto establecido">`);
            }

            if (!user.isAdmin) {
                actionsHtml.push(`<img src="../images/icon_group_users.svg" onclick="handleToggleAdmin('${user.address}', true)" title="Hacer administrador">`);
            } else {
                actionsHtml.push(`<img src="../images/icon_remove_admin.svg" onclick="handleToggleAdmin('${user.address}', false)" title="Quitar administrador">`);
            }

            actionsHtml.push(`<img src="../images/icon_delete.svg" onclick="handleDeleteUser('${user.address}')" title="Eliminar usuario">`);
            
            cellActions.innerHTML = actionsHtml.join('');
        });
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
        try {
            // Initialize Web3 and connect account
            await BlockchainService.initialize();
            await BlockchainService.connectAccount();
            
            // Check network before proceeding
            await BlockchainUtils.checkNetwork(BlockchainService.web3);
            
            // Initialize contract
            BlockchainService.initContract(
                ContractConfig.addresses.operations,
                ContractConfig.abis.operations
            );
            console.log('Contract initialized:', BlockchainService.operationsContract);

            if (accountInfo) {
                accountInfo.textContent = BlockchainService.account;
            }

            const isContractOwner = await checkOwnership();
            if (!isContractOwner) {
                const isAdmin = await BlockchainService.callContractMethod(
                    BlockchainService.operationsContract.methods.isAdmin(BlockchainService.account)
                );
                if (!isAdmin) {
                    alert("No tienes permisos de administrador");
                    return;
                }
            }

            showAdminInterface();
            await Promise.all([updateContractBalance(), loadUserList()]);

            // Setup event listeners
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', () => window.location.reload());

        } catch (error) {
            console.error("Connection error:", error);
            alert("Error connecting to MetaMask: " + error.message);
        }
    }

    async function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            alert('Please connect MetaMask.');
            initializePage();
        } else {
            BlockchainService.account = accounts[0];
            if (accountInfo) accountInfo.textContent = BlockchainService.account;
            
            const isContractOwner = await checkOwnership();
            if (!isContractOwner) {
                const isAdmin = await BlockchainService.callContractMethod(
                    BlockchainService.operationsContract.methods.isAdmin(BlockchainService.account)
                );
                if (!isAdmin) {
                    alert("New account doesn't have admin permissions");
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
            if (BlockchainService.web3.utils.isAddress(address)) {
                await addUserToWhitelist(address);
            } else {
                alert('Please enter a valid Ethereum address');
            }
        });
    }

    if (refreshBalance) {
        refreshBalance.addEventListener('click', updateContractBalance);
    }

    // Global functions for table actions
    window.handleToggleAdmin = async (address, makeAdmin) => {
        try {
            const method = makeAdmin ? 
                BlockchainService.operationsContract.methods.addAdmin(address) : 
                BlockchainService.operationsContract.methods.removeAdmin(address);
            
            await BlockchainService.sendTransaction(method);
            alert(makeAdmin ? 'Admin added' : 'Admin removed');
            await loadUserList();
        } catch (error) {
            console.error('Admin modification error:', error);
            alert('Error: ' + error.message);
        }
    };

    window.handleDeleteUser = async (address) => {
        try {
            const method = BlockchainService.operationsContract.methods.removeFromWhitelist(address);
            await BlockchainService.sendTransaction(method);
            alert('User deleted');
            await loadUserList();
        } catch (error) {
            console.error('User deletion error:', error);
            alert('Error: ' + error.message);
        }
    };

    window.handleSendBalance = async (address) => {
        try {
            const method = BlockchainService.operationsContract.methods.sendBalance(address);
            await BlockchainService.sendTransaction(method);
            alert('Balance sent successfully');
            await updateContractBalance();
        } catch (error) {
            console.error('Balance sending error:', error);
            alert('Error: ' + error.message);
        }
    };

    // Update balance periodically
    setInterval(() => {
        if (BlockchainService.web3 && BlockchainService.account) {
            updateContractBalance();
        }
    }, 30000);
});