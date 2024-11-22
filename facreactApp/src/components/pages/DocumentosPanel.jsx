// src/components/pages/DocumentosPanel.jsx
import React, { useState, useEffect } from "react";
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

    // Función para mostrar el loader
    const showLoading = (message) => {
        console.log("Mostrando loader:", message);
        setLoading(true);
    };

    // Función para ocultar el loader
    const hideLoading = () => {
        console.log("Ocultando loader");
        setLoading(false);
    };

    // Función para conectar la wallet
    const connectWallet = async () => {
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
                const adminStatus = await contractInstance.isAdmin(lowerEoaAddress);
                setIsAdmin(adminStatus);
                console.log("¿Es admin?:", adminStatus);

                // Cargar los documentos después de conectar
                await fetchDocuments(contractInstance, providerInstance);

            } catch (error) {
                console.error("Error al conectar la wallet:", error);
                alert(`Error al conectar la wallet: ${error.message}`);
                hideLoading();
            }
        } else {
            alert("Por favor, instala MetaMask.");
        }
    };

    // Función para enviar transacciones utilizando Biconomy
    const sendTransactionWithBiconomy = async (to, data) => {
        if (!smartAccount) {
            throw new Error("La Smart Account no está inicializada.");
        }

        const tx = {
            to,
            data,
            // Puedes agregar más campos como `value` si es necesario
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
    };

    // Función para obtener todos los documentos
    const fetchDocuments = async (contractInstance, providerInstance) => {
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
            const [documentHashes, timestamps, datas, uploaders] = await contractInstance.getAllDocuments();
            console.log("Datos obtenidos de getAllDocuments:", { documentHashes, timestamps, datas, uploaders });

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
    };

    // Función para manejar la visualización de un documento
    const handleViewDocument = async (docHash) => {
        if (!contract) {
            console.error("Contrato no está inicializado.");
            alert("Contrato no está inicializado.");
            return;
        }

        try {
            showLoading("Obteniendo detalles del documento...");

            const [timestamp, data, uploader] = await contract.getDocument(docHash);
            const ts = ethers.BigNumber.isBigNumber(timestamp) ? timestamp.toNumber() : timestamp;
            const docDetails = {
                hash: docHash,
                timestamp: new Date(ts * 1000).toLocaleString(),
                data,
                uploader,
            };

            setSelectedDocument(docDetails);
            console.log("Detalles del documento:", docDetails);
        } catch (error) {
            console.error("Error al obtener el documento:", error);
            alert(`Error al obtener el documento: ${error.message}`);
        } finally {
            hideLoading();
        }
    };

    // useEffect para cargar documentos cuando el contrato y el proveedor cambien
    useEffect(() => {
        if (contract && provider) {
            console.log("Contrato y proveedor están disponibles. Cargando documentos...");
            fetchDocuments(contract, provider);
        }
    }, [contract, provider]);

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
                        
                        {/* Eliminado el campo de búsqueda */}
                        
                        <div className="space50"></div>

                        <div className="flexH gap30" style={{ width: "calc(100% - 60px)", marginLeft: "30px", height: "100%" }}>
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
                                                <th>Fecha de Subida</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {documents.length > 0 ? (
                                                documents.map((doc, index) => (
                                                    <tr key={doc.hash}>
                                                        <td>{doc.hash}</td>
                                                        
                                                        <td>{doc.uploader}</td>
                                                        <td>{doc.timestamp}</td>
                                                        <td>
                                                            <button   className="iconAction" onClick={() => handleViewDocument(doc.hash)}> <img src="../images/icon_eye.svg" alt="ver" /></button>
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
                            </div>

                            <div className="flex1">
                                <div id="containerEnter" style={{ margin: "0px", height: "calc(100% + 16px)" }}>
                                    <div id="online" style={{ opacity: 1 }}>
                                        <span>Detalle</span>
                                    </div>
                                    <div id="jsonContent" style={{ height: "60%" }}>
                                        {selectedDocument ? (
                                            <pre>{JSON.stringify(selectedDocument, null, 2)}</pre>
                                        ) : (
                                            <p>Selecciona un documento para ver los detalles.</p>
                                        )}
                                    </div>
                                    <button id="connectButton" onClick={() => setSelectedDocument(null)}>Limpiar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loader */}
            {loading && <Loader message="Cargando..." />}
        </div>
    );

}
