document.addEventListener('DOMContentLoaded', () => { // Asegurarse de que el DOM está cargado

    // Elementos del DOM
    const connectButton = document.getElementById("connectButton");
    const actionButton = document.getElementById("actionButton"); // Botón Unificado
    const accountInfo = document.getElementById("accountInfo");
    const online = document.getElementById("online");
    const userCointainer = document.getElementById("userCointainer");
    const jsonContent = document.getElementById("jsonContent");
    const loading = document.getElementById("loading"); // Elemento de carga
  
    // Variables globales
    let web3;
    let userAccount;
    let contractInstance;
    let hasSigned = false; // Estado para determinar si el usuario ya firmó
  
    // ABI del contrato (asegúrate de que corresponda al contrato desplegado)
    // Aquí debes incluir el ABI generado de tu contrato
    // const contractABI = [...];
  
    // Dirección del contrato desplegado en tu red local
    // Reemplaza con la dirección real del contrato desplegado
    // const contractAddress = '0xTuDireccionDeContrato';
  
    // Función para obtener parámetros JSON desde la URL
    function getJsonFromUrl() {
      let query = location.search.substr(1);
      let result = {};
      query.split("&").forEach(function(part) {
        let item = part.split("=");
        if (item[0] && item[1]) {
          result[item[0]] = decodeURIComponent(item[1]);
        }
      });
      return result;
    }
  
    // Función para mostrar el JSON en el DOM
    function displayJson(jsonString) {
      try {
        const jsonObject = JSON.parse(jsonString);
        jsonContent.innerHTML = ""; // Limpiar contenido previo
        for (const [key, value] of Object.entries(jsonObject)) {
          const p = document.createElement("p");
  
          const strong = document.createElement("strong");
          strong.textContent = `${key}: `;
  
          p.appendChild(strong);
          p.appendChild(document.createTextNode(value));
  
          jsonContent.appendChild(p);
        }
        return jsonObject; // Devuelve el objeto JSON
      } catch (e) {
        jsonContent.textContent = "El JSON proporcionado no es válido.";
        return null;
      }
    }
  
    const urlParams = getJsonFromUrl();
    let dataJson; // Variable para almacenar los datos
    if (urlParams.data) {
      dataJson = displayJson(urlParams.data);
    } else {
      if (jsonContent != null) {
        jsonContent.textContent = "No se proporcionó JSON en la URL.";
      }
    }
  
    // Función para actualizar el estado de la aplicación en el DOM
    function updateState(state, additionalInfo) {
      switch(state) {
        case 'notSigned':
          // Estado inicial, antes de firmar
          actionButton.style.display = 'block';
          actionButton.textContent = 'Firmar';
          actionButton.disabled = false;
          break;
        case 'signing':
          // Estado de firma en progreso
          showLoading("Esperando la firma en MetaMask...");
          actionButton.disabled = true;
          break;
        case 'signed':
          hideLoading();
          jsonContent.innerHTML = `
            <p><strong>Estado:</strong> FIRMADO</p>
            <p><strong>Datos a Enviar:</strong></p>
            <pre>${JSON.stringify(dataJson, null, 2)}</pre>
            <p>Dale <strong>Confirmar</strong> para enviar el documento.</p>
          `;
          actionButton.textContent = 'Confirmar';
          actionButton.disabled = false;
          hasSigned = true;
          break;
        case 'saving':
          // Estado de guardado en la blockchain
          showLoading("Guardando documento en la blockchain...");
          actionButton.disabled = true;
          break;
        case 'saved':
          hideLoading();
          jsonContent.innerHTML = `
            <p><strong>Hash de Transacción:</strong> ${additionalInfo.transactionHash}</p>
            <p><strong>Hash del Documento:</strong> ${additionalInfo.docHash}</p>
            <p><strong>Estado:</strong> DOCUMENTO GUARDADO</p>
          `;
          actionButton.style.display = 'none';
          break;
        case 'error':
          hideLoading();
          jsonContent.innerHTML = `<p style="color: red;"><strong>Error:</strong> ${additionalInfo.message}</p>`;
          actionButton.style.display = 'block';
          actionButton.textContent = hasSigned ? 'Confirmar' : 'Firmar';
          actionButton.disabled = false;
          break;
        default:
          jsonContent.innerHTML = "<p>Estado desconocido.</p>";
      }
    }
  
    // Función para mostrar la animación de carga
    function showLoading(message) {
      loading.style.display = 'block';
      loading.innerHTML = `<p>${message}</p><div class="spinner"></div>`;
    }
  
    // Función para ocultar la animación de carga
    function hideLoading() {
      loading.style.display = 'none';
    }
  
    // Función para conectar MetaMask usando web3.js
    async function connectMetamask() {
      console.log("Intentando conectar con MetaMask");
      if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
          // Solicitar acceso a las cuentas de MetaMask
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          userAccount = (await web3.eth.getAccounts())[0];
          console.log("Cuenta conectada:", userAccount);
          accountInfo.textContent = `${userAccount}`;
          connectButton.style.display = 'none';
          actionButton.style.display = 'block';
          actionButton.textContent = 'Firmar';
          online.style.opacity = 1;
          userCointainer.style.opacity = 1;
  
          // Inicializar el contrato
          await initContract();
          console.log("Contrato inicializado");
  
          // Verificar la red actual
          await verifyNetwork();
  
          // Escuchar cambios de cuenta o red
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          window.ethereum.on('chainChanged', handleChainChanged);
  
        } catch (error) {
          console.error("Acceso a la cuenta denegado por el usuario", error);
          updateState('error', { message: "Acceso a la cuenta denegado por el usuario." });
        }
      } else {
        alert("MetaMask no está instalado. ¡Instálalo para continuar!");
      }
    }
  
    // Función para inicializar el contrato inteligente
    async function initContract() {
      contractInstance = new web3.eth.Contract(contractABI, contractAddress);
    }
  
    // Función para esperar el recibo de la transacción
    async function waitForReceipt(txHash, retries = 10, delay = 2000) {
      for (let i = 0; i < retries; i++) {
        try {
          const receipt = await web3.eth.getTransactionReceipt(txHash);
          if (receipt) {
            return receipt;
          }
        } catch (error) {
          console.error("Error al obtener el recibo:", error);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      throw new Error('No se pudo obtener el recibo de la transacción después de varios intentos');
    }
  
    // Función para verificar si la red actual es la red local
    async function verifyNetwork() {
      try {
        const chainId = await web3.eth.getChainId();
        console.log("Chain ID obtenido:", chainId, "Tipo:", typeof chainId);
        if (Number(chainId) !== 1337 && Number(chainId) !== 31337) { // IDs comunes para la red local
          alert('Por favor, cambia a la red Localhost 8545 en MetaMask.');
          updateState('error', { message: 'Red incorrecta. Cambia a la red Localhost 8545.' });
          // No es posible cambiar a la red local automáticamente desde el código
        } else {
          console.log("Conectado a la red local.");
          online.style.opacity = 1;
          updateState('notSigned');
        }
      } catch (error) {
        console.error("Error al verificar la red:", error);
        updateState('error', { message: "Error al verificar la red." });
      }
    }
  
    // Manejar cambios de cuenta
    function handleAccountsChanged(accounts) {
      if (accounts.length === 0) {
        console.log("Por favor, conecta una cuenta.");
        updateState('error', { message: "Por favor, conecta una cuenta en MetaMask." });
      } else {
        userAccount = accounts[0];
        accountInfo.textContent = `${userAccount}`;
        console.log("Cuenta cambiada a:", userAccount);
        updateState('notSigned');
      }
    }
  
    // Manejar cambios de red
    async function handleChainChanged(_chainId) {
      console.log("Chain cambiado a:", _chainId);
      await verifyNetwork();
      // Recargar la página para evitar inconsistencias
      window.location.reload();
    }
  
    // Función para verificar si el usuario está en la whitelist
    async function isUserWhitelisted() {
      try {
        const whitelisted = await contractInstance.methods.isWhitelisted(userAccount).call();
        console.log(`¿Está el usuario en la whitelist? ${whitelisted}`);
        return whitelisted;
      } catch (error) {
        console.error("Error al verificar la whitelist:", error);
        return false;
      }
    }
  
    if (connectButton != null) {
      connectButton.addEventListener('click', connectMetamask);
  
      actionButton.addEventListener('click', async () => {
        if (web3 && userAccount) {
          if (!hasSigned) {
            // Proceso de firma
            try {
              // Verificar si el usuario está en la whitelist
              const whitelisted = await isUserWhitelisted();
              if (!whitelisted) {
                throw new Error("Tu cuenta no está en la lista blanca. Contacta al administrador.");
              }
  
              // Mostrar los datos a enviar antes de firmar
              jsonContent.innerHTML = `
                <p><strong>Datos a Enviar:</strong></p>
                <pre>${JSON.stringify(dataJson, null, 2)}</pre>
                <p><strong>Estado:</strong> FIRMANDO...</p>
              `;
  
              // Actualizar el estado a 'signing' para reflejar que se está firmando
              updateState('signing');
  
              // Generar un mensaje único para firmar (incluyendo un nonce)
              const nonce = Math.floor(Math.random() * 1000000);
              const message = `Confirmar conexión - Nonce: ${nonce}`;
              const signature = await web3.eth.personal.sign(message, userAccount, '');
              console.log("Firma obtenida:", signature);
  
              // Actualizar el estado a 'signed' sin mostrar el hash de la firma
              updateState('signed');
  
            } catch (error) {
              console.error("Error en la firma", error);
              updateState('error', { message: error.message });
            }
          } else {
            // Proceso de confirmación y envío
            try {
              const chainId = await web3.eth.getChainId();
              console.log("Chain ID obtenido en 'Confirmar':", chainId, "Tipo:", typeof chainId);
              if (Number(chainId) !== 31337 && Number(chainId) !== 31337) { // IDs comunes para la red local
                alert('Por favor, cambia a la red Localhost 8545 en MetaMask.');
                updateState('error', { message: 'Red incorrecta. Cambia a la red Localhost 8545.' });
                return;
              }
              try {
                if (!dataJson) {
                  throw new Error("Datos JSON no disponibles para enviar.");
                }
  
                // Convertir el objeto JSON a una cadena sin comillas adicionales
                let dataString = JSON.stringify(dataJson);
  
                console.log('Intentando guardar el documento con datos de la URL:', dataString);
  
                // Estimación dinámica de gas
                const gasEstimate = await contractInstance.methods.saveDocument(dataString).estimateGas({ from: userAccount });
  
                // Actualizar el estado a 'saving' para reflejar que se está guardando
                updateState('saving');
  
                // Enviar la transacción
                let tx;
                try {
                  tx = await contractInstance.methods.saveDocument(dataString).send({ 
                    from: userAccount,
                    gas: gasEstimate
                  });
  
                  // Esperar la confirmación de la transacción
                  await waitForReceipt(tx.transactionHash);
  
                  console.log('Documento guardado, recibo de transacción:', tx);
  
                  // Obtener el docHash del evento
                  const docHash = tx.events.DocumentSaved.returnValues.docHash;
                  console.log('Hash del documento guardado:', docHash);
  
                  // Actualizar el estado y mostrar el hash
                  updateState('saved', { transactionHash: tx.transactionHash, docHash: docHash });
  
                } catch (sendError) {
                  console.error('Error al enviar la transacción:', sendError);
                  updateState('error', { message: `Error al enviar la transacción: ${sendError.message}` });
                  return;
                }
  
              } catch (error) {
                console.error('Error al guardar el documento:', error);
                console.error('Detalles del error:', error.message);
                updateState('error', { message: `Hubo un error al guardar el documento: ${error.message}` });
              }
            } catch (networkError) {
              console.error("Error al obtener el chain ID:", networkError);
              updateState('error', { message: "Error al verificar la red." });
            }
          }
        } else {
          alert('Contrato no inicializado o cuenta de usuario no disponible.');
          updateState('error', { message: "Contrato no inicializado o cuenta de usuario no disponible." });
        }
      });
    }
  });
  