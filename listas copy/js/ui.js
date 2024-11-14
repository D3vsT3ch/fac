// Funciones de UI
const UI = {
    initializePage() {
        const userContainer = document.getElementById('userCointainer');
        const bodySection = document.getElementById('bodySection');
        const fieldsToHide = document.querySelectorAll('.hideOnLoad');
        const connectButton = document.getElementById('connectButton');

        if (userContainer) userContainer.style.opacity = '0';
        if (bodySection) bodySection.style.display = 'none';
        fieldsToHide.forEach(element => {
            if (element) element.style.display = 'none';
        });
        if (connectButton) connectButton.style.display = 'block';
    },

    showAdminInterface() {
        const userContainer = document.getElementById('userCointainer');
        const bodySection = document.getElementById('bodySection');
        const fieldsToHide = document.querySelectorAll('.hideOnLoad');
        const connectButton = document.getElementById('connectButton');

        if (userContainer) userContainer.style.opacity = '1';
        if (bodySection) bodySection.style.display = 'block';
        fieldsToHide.forEach(element => {
            if (element) element.style.display = 'block';
        });
        if (connectButton) connectButton.style.display = 'none';
    },

    updateUserTable(users, userAccount) {
        const userTable = document.getElementById('userTable');
        if (!userTable) return;

        // Limpiar tabla manteniendo el header
        while (userTable.rows.length > 1) {
            userTable.deleteRow(1);
        }

        // Llenar tabla
        users.forEach(user => {
            const row = userTable.insertRow();
            
            // Dirección
            const cellAddress = row.insertCell();
            cellAddress.textContent = user.address;

            // Roles
            const cellRoles = row.insertCell();
            const roles = [];
            if (user.isWhitelisted) roles.push("Usuario");
            if (user.isAdmin) roles.push("Administrador");
            cellRoles.innerHTML = `<div class="tag">${roles.join(', ')}</div>`;

            // Acciones
            const cellActions = row.insertCell();
            const actionsHtml = [];

            if (user.address.toLowerCase() !== userAccount.toLowerCase()) {
                actionsHtml.push(`<img src="../images/icon_symbol_money.svg" onclick="window.sendBalanceToUser('${user.address}')" title="Enviar monto establecido">`);
            }

            if (!user.isAdmin) {
                actionsHtml.push(`<img src="../images/icon_group_users.svg" onclick="window.toggleAdmin('${user.address}', true)" title="Hacer administrador">`);
            } else {
                actionsHtml.push(`<img src="../images/icon_remove_admin.svg" onclick="window.toggleAdmin('${user.address}', false)" title="Quitar administrador">`);
            }

            actionsHtml.push(`<img src="../images/icon_delete.svg" onclick="window.deleteUser('${user.address}')" title="Eliminar usuario">`);
            
            cellActions.innerHTML = actionsHtml.join('');
        });
    }
};

export { UI };