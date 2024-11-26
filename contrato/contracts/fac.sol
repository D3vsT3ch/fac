// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

contract Fac is Initializable, ContextUpgradeable {
    address public owner;

    // Definición de roles
    enum Role {
        USER,
        ADMIN
    }

    struct User {
        address eoa; // Dirección EOA del usuario
        address smartAccount; // Dirección de la Smart Account asociada
        string name;
        Role role; // Rol del usuario: USER o ADMIN
        bool isActive; // Estado activo/inactivo
    }

    // Mapeo para la whitelist: smartAccount => User
    mapping(address => User) internal whiteList;

    // Estructura para almacenar documentos
    struct Document {
        uint256 timestamp;
        string data;
        address uploader;
        address eoa;
        string key; // Nuevo campo
    }

    // Mapeo para documentos: docHash => Document
    mapping(bytes32 => Document) private documents;

    bytes32[] private documentHashes;

    // Eventos
    event UserWhitelisted(
        address indexed smartAccount,
        address indexed eoa,
        string name,
        Role role
    );
    event DocumentSaved(
        bytes32 indexed docHash,
        address indexed uploader,
        address indexed eoa,
        uint256 timestamp,
        string key
    );
    event RoleChanged(address indexed smartAccount, Role oldRole, Role newRole);
    event UserStatusChanged(address indexed smartAccount, bool newStatus);

    // Modificadores
    modifier onlyOwner() virtual {
        require(
            _msgSender() == owner,
            "Solo el propietario puede realizar esta accion"
        );
        _;
    }

    modifier onlyAdmin() virtual {
        require(
            whiteList[_msgSender()].smartAccount != address(0) &&
                whiteList[_msgSender()].role == Role.ADMIN &&
                whiteList[_msgSender()].isActive,
            "Solo administradores activos pueden realizar esta accion"
        );
        _;
    }

    modifier onlyWhitelisted() virtual {
        require(
            whiteList[_msgSender()].smartAccount != address(0),
            "Usuario no esta en la lista blanca"
        );
        require(
            whiteList[_msgSender()].isActive,
            "El usuario no esta activo"
        );
        _;
    }

    modifier onlyWhitelistedEOA(address _eoa) virtual {
        require(
            whiteList[_msgSender()].eoa == _eoa,
            "EOA no coincide con la cuenta inteligente"
        );
        _;
    }

    // Modificador para propietario o administrador activo
    modifier onlyOwnerOrActiveAdmin() virtual {
        require(
            _msgSender() == owner ||
                (whiteList[_msgSender()].smartAccount != address(0) &&
                    whiteList[_msgSender()].role == Role.ADMIN &&
                    whiteList[_msgSender()].isActive),
            "Solo el propietario o administradores activos pueden realizar esta accion"
        );
        _;
    }

    /**
     * @dev Inicializa el contrato estableciendo al msg.sender como propietario y agregándolo a la whitelist como ADMIN.
     */
    function initialize() public initializer {
        __Context_init();

        owner = _msgSender();

        // Agregar al propietario a la whitelist con rol ADMIN
        whiteList[_msgSender()] = User({
            eoa: _msgSender(),
            smartAccount: _msgSender(), // Asumiendo que el propietario no usa una Smart Account
            name: "Propietario",
            role: Role.ADMIN,
            isActive: true
        });

        emit UserWhitelisted(
            _msgSender(),
            _msgSender(),
            "Propietario",
            Role.ADMIN
        );
    }

    /**
     * @dev Agrega un usuario a la whitelist con su EOA, Smart Account, nombre y rol.
     * Solo puede ser llamado por un administrador activo o el propietario.
     */
    function addToWhitelist(
        address _eoa,
        address _smartAccount,
        string memory _name,
        Role _role
    ) public onlyOwnerOrActiveAdmin {
        require(_eoa != address(0), "EOA no puede ser la direccion cero");
        require(
            _smartAccount != address(0),
            "Smart Account no puede ser la direccion cero"
        );
        require(
            whiteList[_smartAccount].smartAccount == address(0),
            "Smart Account ya esta en la whitelist"
        );

        whiteList[_smartAccount] = User({
            eoa: _eoa,
            smartAccount: _smartAccount,
            name: _name,
            role: _role,
            isActive: true
        });

        emit UserWhitelisted(_smartAccount, _eoa, _name, _role);
    }

    /**
     * @dev Cambia el rol de un usuario existente en la whitelist.
     * Solo puede ser llamado por un administrador activo o el propietario.
     */
    function changeRole(
        address _smartAccount,
        Role _newRole
    ) public onlyOwnerOrActiveAdmin {
        require(
            whiteList[_smartAccount].smartAccount != address(0),
            "Smart Account no esta en la whitelist"
        );
        Role oldRole = whiteList[_smartAccount].role;
        whiteList[_smartAccount].role = _newRole;

        emit RoleChanged(_smartAccount, oldRole, _newRole);
    }

    /**
     * @dev Cambia el estado de un usuario (activo/inactivo).
     * Solo puede ser llamado por un administrador activo.
     */
    function changeUserStatus(
        address _smartAccount,
        bool _newStatus
    ) public onlyAdmin {
        require(
            whiteList[_smartAccount].smartAccount != address(0),
            "Smart Account no esta en la whitelist"
        );
        whiteList[_smartAccount].isActive = _newStatus;

        emit UserStatusChanged(_smartAccount, _newStatus);
    }

    /**
     * @dev Guarda un documento en el contrato. Solo puede ser llamado por usuarios en la whitelist y activos.
     */
    function saveDocument(
        string memory _data,
        address _eoa,
        string memory _key
    ) public onlyWhitelisted onlyWhitelistedEOA(_eoa) returns (bytes32) {
        bytes32 docHash = keccak256(
            abi.encodePacked(_data, block.timestamp, _eoa, _key)
        );
        documents[docHash] = Document(
            block.timestamp,
            _data,
            _msgSender(),
            _eoa,
            _key
        );
        documentHashes.push(docHash);
        emit DocumentSaved(docHash, _msgSender(), _eoa, block.timestamp, _key);
        return docHash;
    }

    /**
     * @dev Obtiene los detalles de un documento por su hash.
     */
    function getDocument(
        bytes32 _docHash
    )
        public
        view
        returns (
            uint256,
            string memory,
            address,
            address,
            string memory
        )
    {
        Document memory doc = documents[_docHash];
        require(doc.timestamp != 0, "Documento no existe");
        return (doc.timestamp, doc.data, doc.uploader, doc.eoa, doc.key);
    }

    /**
     * @dev Obtiene todos los documentos almacenados en el contrato.
     */
    function getAllDocuments()
        public
        view
        returns (
            bytes32[] memory,
            uint256[] memory,
            string[] memory,
            address[] memory,
            address[] memory,
            string[] memory
        )
    {
        uint256 length = documentHashes.length;
        uint256[] memory timestamps = new uint256[](length);
        string[] memory datas = new string[](length);
        address[] memory uploaders = new address[](length);
        address[] memory eoaList = new address[](length);
        string[] memory keys = new string[](length);

        for (uint256 i = 0; i < length; i++) {
            bytes32 hash = documentHashes[i];
            Document memory doc = documents[hash];
            timestamps[i] = doc.timestamp;
            datas[i] = doc.data;
            uploaders[i] = doc.uploader;
            eoaList[i] = doc.eoa;
            keys[i] = doc.key;
        }

        return (documentHashes, timestamps, datas, uploaders, eoaList, keys);
    }

    /**
     * @dev Verifica si una Smart Account está en la whitelist y activa.
     */
    function isWhitelisted(address _smartAccount) public view returns (bool) {
        return
            whiteList[_smartAccount].smartAccount != address(0) &&
            whiteList[_smartAccount].isActive;
    }

    /**
     * @dev Verifica si una Smart Account tiene rol ADMIN y está activa.
     */
    function isAdmin(address _smartAccount) public view returns (bool) {
        return
            whiteList[_smartAccount].role == Role.ADMIN &&
            whiteList[_smartAccount].isActive;
    }

    // Funciones para recibir Ether
    receive() external payable virtual {}

    fallback() external payable virtual {}
}
