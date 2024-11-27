// src/components/pages/DocumentosPanel.jsx
import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import UserInfo from "../UserInfoDocumentos.jsx";
import WalletConnect from "../WalletConnect";
import Loader from "../Loader";

import { contractABI, contractAddress } from "../../contrato";
import "../../styles/App.css";
import { requiredChainId, networkConfig } from "../../config";
import { initializeBiconomy } from "../../biconomy";

export default function DocumentosPanel() {

    const [userAccount, setUserAccount] = useState(null); // Dirección de Smart Account
    const [userEOA, setUserEOA] = useState(null); // Dirección EOA
    const [loading, setLoading] = useState(false);
    const [smartAccount, setSmartAccount] = useState(null);
    const [signer, setSigner] = useState(null);

    const [owner, setOwner] = useState(null); // Estado para almacenar el owner
    const [isAdmin, setIsAdmin] = useState(false); // Estado para verificar si el usuario conectado es admin
    const [isTransactionPending, setIsTransactionPending] = useState(false); // Estado para gestionar transacciones pendientes

    const [contract, setContract] = useState(null); // Instancia del contrato
    const [provider, setProvider] = useState(null); // Proveedor de ethers

    const [documents, setDocuments] = useState([]); // Lista de documentos
    const [selectedDocument, setSelectedDocument] = useState(null); // Documento seleccionado

    const [isWhitelisted, setIsWhitelisted] = useState(false); // Estado para verificar whitelist

    const [searchHash, setSearchHash] = useState(''); // Estado para el input de búsqueda
    const [searchError, setSearchError] = useState(null); // Estado para manejar errores de búsqueda

    // Función para mostrar el loader
    const showLoading = useCallback((message) => {
        console.log("Mostrando loader:", message);
        setLoading(true);
    }, []);

    // Función para ocultar el loader
    const hideLoading = useCallback(() => {
        console.log("Ocultando loader");
        setLoading(false);
    }, []);

    // Función para verificar directamente si la cuenta está en la whitelist
    const checkWhitelistDirectly = useCallback(async (contractInstance, account) => {
        if (!account) {
            console.error("No se proporcionó una cuenta para verificar la whitelist.");
            setIsWhitelisted(false);
            return;
        }

        try {
            showLoading("Verificando whitelist...");
            const whitelisted = await contractInstance.isWhitelisted(account);
            console.log(`El usuario ${account} está en la whitelist:`, whitelisted);
            setIsWhitelisted(whitelisted);
        } catch (error) {
            console.error("Error al verificar la whitelist directamente:", error);
            setIsWhitelisted(false);
        } finally {
            hideLoading();
        }
    }, [showLoading, hideLoading]);

    // Función para conectar la wallet
    const connectWallet = useCallback(async () => {
        if (window.ethereum) {
            try {
                showLoading("Conectando wallet...");

                // Solicitar acceso a la cuenta del usuario
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const providerInstance = new ethers.providers.Web3Provider(window.ethereum);
                const userSigner = providerInstance.getSigner();

                // Obtener la dirección EOA del usuario
                const eoaAddress = await userSigner.getAddress();
                const lowerEoaAddress = eoaAddress.toLowerCase();
                setUserEOA(lowerEoaAddress);
                console.log("Dirección EOA del usuario:", lowerEoaAddress);

                // Verificar que el usuario esté en la red correcta
                const { chainId } = await providerInstance.getNetwork();
                console.log("Chain ID del proveedor:", chainId);
                if (chainId !== requiredChainId) {
                    alert(`Por favor, conéctate a la red ${networkConfig.name}.`);
                    hideLoading();
                    return;
                }

                // Inicializar Biconomy con el signer del usuario
                console.log("Inicializando Biconomy...");
                const sa = await initializeBiconomy(userSigner);
                setSmartAccount(sa);
                setSigner(userSigner);

                console.log("Obteniendo dirección de la Smart Account...");
                const address = await sa.getAccountAddress();
                setUserAccount(address);
                console.log("Smart Account conectado:", address);

                // Crear una instancia del contrato
                const contractInstance = new ethers.Contract(contractAddress, contractABI, userSigner);
                setContract(contractInstance);
                setProvider(providerInstance);
                console.log("Contrato y proveedor inicializados:", contractInstance, providerInstance);

                // Obtener el owner del contrato
                console.log("Intentando obtener el owner del contrato...");
                const ownerAddress = await contractInstance.owner();
                const lowerOwnerAddress = ownerAddress.toLowerCase();
                setOwner(lowerOwnerAddress);
                console.log("Owner Address obtenido:", lowerOwnerAddress);

                // Verificar si el usuario es admin
                const adminStatus = await contractInstance.isAdmin(address.toLowerCase()); // Corregido aquí
                setIsAdmin(adminStatus);
                console.log("¿Es admin?:", adminStatus);

                // Verificar si el usuario está en la whitelist directamente
                await checkWhitelistDirectly(contractInstance, address.toLowerCase());

                hideLoading();

            } catch (error) {
                console.error("Error al conectar la wallet:", error);
                alert(`Error al conectar la wallet: ${error.message}`);
                hideLoading();
            }
        } else {
            alert("Por favor, instala MetaMask.");
        }
    }, [showLoading, hideLoading, checkWhitelistDirectly]);

    // Función para enviar transacciones utilizando Biconomy
    const sendTransactionWithBiconomy = useCallback(async (to, data) => {
        if (!smartAccount) {
            throw new Error("La Smart Account no está inicializada.");
        }

        const tx = {
            to,
            data,
            // Puedes agregar más campos como value si es necesario
        };

        const userOpResponse = await smartAccount.sendTransaction(tx);
        const { transactionHash } = await userOpResponse.waitForTxHash();
        console.log("Transaction Hash:", transactionHash);

        // Esperar a que la transacción sea confirmada
        const userOpReceipt = await userOpResponse.wait();
        if (userOpReceipt.success !== true && userOpReceipt.success !== "true") {
            throw new Error("La transacción no fue exitosa.");
        }

        console.log("UserOp receipt:", userOpReceipt);
        console.log("Transaction receipt:", userOpReceipt.receipt);
        return userOpReceipt.receipt;
    }, [smartAccount]);

    // Función para obtener todos los documentos
    const fetchDocuments = useCallback(async (contractInstance, providerInstance) => {
        if (!contractInstance || !providerInstance) {
            console.error("Contrato o proveedor no está inicializado.");
            return;
        }

        try {
            showLoading("Cargando documentos...");

            // Verificar la existencia de la función getAllDocuments
            if (!contractInstance.getAllDocuments) {
                throw new Error("La función getAllDocuments no existe en el contrato.");
            }

            // Llamar a la función getAllDocuments del contrato
            console.log("Llamando a getAllDocuments...");
            const [documentHashes, timestamps, datas, uploaders, eoaList, keys] = await contractInstance.getAllDocuments(); // Añadido eoaList
            console.log("Datos obtenidos de getAllDocuments:", { documentHashes, timestamps, datas, uploaders, eoaList, keys  });

            // Mapear los datos a un formato más manejable
            const docs = documentHashes.map((hash, index) => {
                const timestamp = timestamps[index];
                // Verifica si timestamp es un BigNumber
                const ts = ethers.BigNumber.isBigNumber(timestamp) ? timestamp.toNumber() : timestamp;
                const doc = {
                    hash,
                    timestamp: new Date(ts * 1000).toLocaleString(),
                    data: datas[index],
                    uploader: uploaders[index],
                    eoa: eoaList[index], // Añadido eoa
                    key: keys[index],
                };
                console.log(`Documento ${index}:`, doc);
                return doc;
            });

            setDocuments(docs);
            console.log("Documentos cargados:", docs);
        } catch (error) {
            console.error("Error al obtener los documentos:", error);
            alert(`Error al obtener los documentos: ${error.message}`);
        } finally {
            hideLoading();
        }
    }, [showLoading, hideLoading]);

    //async (contract, userAccountAddress, retries = 3, delayTime = 2000) => {
    // Función para manejar la visualización de un documento
    const handleViewDocument = useCallback(async (docHash) => {
        if (!contract) {
            console.error("Contrato no está inicializado.");
            alert("Contrato no está inicializado.");
            return;
        }

        try {
            showLoading("Obteniendo detalles del documento...");


            
            const [timestamp, data, uploader, eoa, key] = await contract.getDocument(docHash); // Añadido eoa
            const ts = ethers.BigNumber.isBigNumber(timestamp) ? timestamp.toNumber() : timestamp;
            const docDetails = {
                hash: docHash,
                timestamp: new Date(ts * 1000).toLocaleString(),
                data,
                uploader,
                eoa, // Añadido eoa
                key,

            };

            setSelectedDocument(docDetails);
            console.log("Detalles del documento:", docDetails);
        } catch (error) {
            console.error("Error al obtener el documento:", error);
            alert(`Error al obtener el documento: ${error.message}`);
        } finally {
            hideLoading();
        }
    }, [contract, showLoading, hideLoading]);

    // Función para manejar la búsqueda de un documento por hash
    const handleSearch = useCallback(async () => {
        // Reiniciar el estado de error
        setSearchError(null);

        // Validar el hash ingresado
        if (!ethers.utils.isHexString(searchHash, 32)) {
            setSearchError('El hash ingresado no es válido. Debe ser un string hexadecimal de 32 bytes.');
            return;
        }

        try {
            showLoading("Buscando documento...");
            const [timestamp, data, uploader, eoa] = await contract.getDocument(searchHash);
            const ts = ethers.BigNumber.isBigNumber(timestamp) ? timestamp.toNumber() : timestamp;
            const docDetails = {
                hash: searchHash,
                timestamp: new Date(ts * 1000).toLocaleString(),
                data,
                uploader,
                eoa,
            };

            setSelectedDocument(docDetails);
            console.log("Detalles del documento buscado:", docDetails);
        } catch (error) {
            console.error("Error al buscar el documento:", error);
            setSearchError(`Error al buscar el documento: ${error.message}`);
        } finally {
            hideLoading();
        }
    }, [searchHash, contract, showLoading, hideLoading]);

    // Función para validar si una cadena es JSON
    const isValidJson = (str) => {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    };

    // useEffect para manejar cambios en la whitelist y cargar documentos
    useEffect(() => {
        if (contract && provider && isWhitelisted) {
            console.log("Contrato, proveedor y whitelist confirmados. Cargando documentos...");
            fetchDocuments(contract, provider);
        }
    }, [contract, provider, isWhitelisted, fetchDocuments]);

    // Manejar cambios en la cuenta o en la red
    useEffect(() => {
        if (window.ethereum) {
            const handleAccountsChanged = (accounts) => {
                if (accounts.length > 0) {
                    setUserEOA(accounts[0].toLowerCase());
                    console.log("Cuenta cambiada a:", accounts[0]);
                    // Reconectar para actualizar estados y datos
                    connectWallet();
                } else {
                    setUserEOA(null);
                    setUserAccount(null);
                    setOwner(null);
                    setIsAdmin(false);
                    setIsWhitelisted(false);
                    setIsTransactionPending(false);
                    setDocuments([]);
                    setSelectedDocument(null);
                    console.log("Wallet desconectada");
                }
            };

            const handleChainChanged = (chainId) => {
                console.log("Chain cambiada a:", chainId);
                // Intentar cambiar automáticamente a la red deseada
                // No recargar la página inmediatamente
                connectWallet();
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            // Cleanup on unmount
            return () => {
                if (window.ethereum.removeListener) {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    window.ethereum.removeListener('chainChanged', handleChainChanged);
                }
            };
        }
    }, [connectWallet]);

    return (
        <div className="admin-panel-container">
            {/* Contenedor de Usuario */}
            <div className="adminUser" style={{ right: "100px", color: "white" }}>
                <UserInfo userEOA={userEOA} userAccount={userAccount} className={userEOA ? 'visible adminUser' : ''} />
            </div>

            {/* Contenedor Principal */}
            <div id="containerBody">
                {/* Sección de Encabezado */}
                <div id="headerSection">
                    <img className="logo" src="/images/logo.svg" alt="logo" />
                </div>
                {/* Botón de Conectar */}
                <div className="center-text" style={{ marginTop: "20px" }}>
                    {!userEOA && <WalletConnect onConnect={connectWallet} />}
                </div>

                {/* Contenido Principal */}
                <div
                    id="bodySection"
                    className={userEOA ? "visible" : "hide-on-load"} // Clase dinámica
                >
                    {/* Nuevo Contenido Integrado */}
                    <div className="space50"></div>
                    <div className="centerText" style={{ height: "calc(100% - 300px)" }}>
                        <div className="titleAdmin">Documentos</div>
                        <p></p>

                        {/* Campo de Búsqueda */}
                        <div className="search-container" style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <label className="titleLabel labelW" style={{ marginRight: '340px' }}>
                                Buscar Documento por Hash:
                            </label>
                            <br />
                            <input
                                className="inputText"
                                type="text"
                                id="searchHash"
                                value={searchHash}
                                onChange={(e) => setSearchHash(e.target.value)}
                                placeholder="Ingrese el hash del documento"
                            />
                            <button
                                onClick={handleSearch}
                                className="iconAction"
                            >
                                <img src="../images/icon_search.svg" alt="Buscar" />
                            </button>
                        </div>

                        {/* Eliminado el campo de búsqueda */}

                        <div className="space50"></div>

                        {/* Verificar si el usuario está en la whitelist */}
                        {!isWhitelisted && userEOA && !loading && (
                            <div className="permission-denied" style={{ textAlign: 'center', marginTop: '50px' }}>
                                <p style={{ color: 'red', fontSize: '18px' }}>
                                    No tienes permisos para acceder al panel de documentos.
                                </p>
                            </div>
                        )}

                        {/* Mostrar el panel de documentos solo si el usuario está en la whitelist */}
                        {isWhitelisted && (
                            <div className="flexH gap30" style={{ marginLeft: "30px", height: "100%" }}>
                                <div className="flex1">
                                    <label htmlFor="documentsTable" className="titleLabel labelW" style={{ textAlign: "left", marginLeft: "-60px" }}>
                                        Título Principal
                                    </label>
                                    <br />
                                    <div className="containerScroll">
                                        <table id="documentsTable" cellSpacing="0">
                                            <thead>
                                                <tr>
                                                    <th>Hash del Documento</th>
                                                    <th>Uploader</th>
                                                    <th>key</th>
                                                    <th>Fecha de Subida</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {documents.length > 0 ? (
                                                    documents.map((doc, index) => (
                                                        <tr key={doc.hash}>
                                                            <td style={{ wordWrap: 'break-word', maxWidth: '150px' }}>{doc.hash}</td>
                                                            <td style={{ wordWrap: 'break-word', maxWidth: '150px' }}>{doc.uploader}</td>
                                                            <td style={{ wordWrap: 'break-word', maxWidth: '150px' }}>{doc.key}</td>
                                                            <td style={{ wordWrap: 'break-word', maxWidth: '100px' }}>{doc.timestamp}</td>
                                                            <td>
                                                                <button className="iconAction" onClick={() => handleViewDocument(doc.hash)}>
                                                                    <img src="../images/icon_eye.svg" alt="ver" />
                                                                </button>
                                                                {/* Puedes agregar más acciones aquí */}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4">No hay documentos disponibles.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Espacio entre la tabla y el buscador */}
                                    <div className="space50"></div>

                                    {/* Mostrar mensaje de error si existe */}
                                    {searchError && (
                                        <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>
                                            {searchError}
                                        </div>
                                    )}
                                </div>

                                <div className="flex1" style={{ marginBottom: "5px" }}>
                                    <div id="containerEnter" style={{ margin: "0px", height: "100%", marginRight: "60px" }}>
                                        <div id="online" style={{ opacity: 1 }}>
                                            <span>Detalle</span>
                                        </div>
                                        <div id="jsonContent" style={{ height: "60%", overflow: 'auto', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
                                            {selectedDocument ? (
                                                <div>
                                                    {/* Mostrar todo el documento en formato JSON con envoltura de texto */}
                                                    <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                                                        {JSON.stringify(selectedDocument, null, 2)}
                                                    </pre>
                                                    {/* Mostrar el campo 'data' de forma separada y formateada */}
                                                    <div style={{ marginTop: '20px' }}>
                                                        <h3>Detalles del Data</h3>
                                                        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                                                            {isValidJson(selectedDocument.key)
                                                                ? JSON.stringify(JSON.parse(selectedDocument.key), null, 2)
                                                                : "key: "+selectedDocument.key}
                                                        </pre>
                                                        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                                                            {isValidJson(selectedDocument.data)
                                                                ? JSON.stringify(JSON.parse(selectedDocument.data), null, 2)
                                                                : selectedDocument.data}
                                                        </pre>
                                                        
                                                        
                                                    </div>
                                                </div>
                                            ) : (
                                                <p>Selecciona un documento para ver los detalles.</p>
                                            )}
                                        </div>
                                        <button id="connectButton" onClick={() => setSelectedDocument(null)}>Limpiar</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Loader */}
            {loading && <Loader message="Cargando..." />}
        </div>
    );

}

// Función para codificar la llamada a la función del contrato
const encodeFunctionCall = (functionName, params) => {
    const iface = new ethers.utils.Interface(contractABI);
    return iface.encodeFunctionData(functionName, params);
};
