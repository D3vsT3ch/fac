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
    }

    // Mapeo para la whitelist: smartAccount => User
    mapping(address => User) internal whiteList;

    // Estructura para almacenar documentos
    struct Document {
        uint256 timestamp;
        string data;
        address uploader;
        address eoa;
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
    event UserRemovedFromWhitelist(
        address indexed smartAccount,
        address indexed eoa
    );
    event DocumentSaved(
        bytes32 indexed docHash,
        address indexed uploader,
        address indexed eoa,
        uint256 timestamp
    );
    event RoleChanged(address indexed smartAccount, Role oldRole, Role newRole); // Nuevo evento

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
                whiteList[_msgSender()].role == Role.ADMIN,
            "Solo administradores pueden realizar esta accion"
        );
        _;
    }

    modifier onlyWhitelisted() virtual {
        require(
            whiteList[_msgSender()].smartAccount != address(0),
            "Usuario no esta en la lista blanca"
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

    // Nuevo modificador para propietario o administrador
    modifier onlyOwnerOrAdmin() virtual {
        require(
            _msgSender() == owner ||
                (whiteList[_msgSender()].smartAccount != address(0) &&
                    whiteList[_msgSender()].role == Role.ADMIN),
            "Solo el propietario o administradores pueden realizar esta accion"
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
            role: Role.ADMIN
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
     * Solo puede ser llamado por un administrador o el propietario.
     */
    function addToWhitelist(
        address _eoa,
        address _smartAccount,
        string memory _name,
        Role _role
    ) public onlyOwnerOrAdmin {
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
            role: _role
        });

        emit UserWhitelisted(_smartAccount, _eoa, _name, _role);
    }

    /**
     * @dev Elimina un usuario de la whitelist utilizando su Smart Account.
     * Solo puede ser llamado por un administrador o el propietario.
     */
    function removeFromWhitelist(
        address _smartAccount
    ) public onlyOwnerOrAdmin {
        require(_smartAccount != owner, "No se puede eliminar al propietario");
        require(
            whiteList[_smartAccount].smartAccount != address(0),
            "Smart Account no esta en la whitelist"
        );

        address eoa = whiteList[_smartAccount].eoa;
        delete whiteList[_smartAccount];

        emit UserRemovedFromWhitelist(_smartAccount, eoa);
    }

    /**
     * @dev Cambia el rol de un usuario existente en la whitelist.
     * Solo puede ser llamado por un administrador o el propietario.
     */
    function changeRole(
        address _smartAccount,
        Role _newRole
    ) public onlyOwnerOrAdmin {
        require(
            whiteList[_smartAccount].smartAccount != address(0),
            "Smart Account no esta en la whitelist"
        );
        Role oldRole = whiteList[_smartAccount].role;
        whiteList[_smartAccount].role = _newRole;

        emit RoleChanged(_smartAccount, oldRole, _newRole);
    }

    /**
     * @dev Guarda un documento en el contrato. Solo puede ser llamado por usuarios en la whitelist.
     */
    function saveDocument(
        string memory _data,
        address _eoa
    ) public onlyWhitelisted onlyWhitelistedEOA(_eoa) returns (bytes32) {
        bytes32 docHash = keccak256(
            abi.encodePacked(_data, block.timestamp, _eoa)
        );
        documents[docHash] = Document(
            block.timestamp,
            _data,
            _msgSender(),
            _eoa
        );
        documentHashes.push(docHash);
        emit DocumentSaved(docHash, _msgSender(), _eoa, block.timestamp);
        return docHash;
    }

    /**
     * @dev Obtiene los detalles de un documento por su hash.
     */
    function getDocument(
        bytes32 _docHash
    ) public view returns (uint256, string memory, address, address) {
        Document memory doc = documents[_docHash];
        require(doc.timestamp != 0, "Documento no existe");
        return (doc.timestamp, doc.data, doc.uploader, doc.eoa);
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
            address[] memory
        )
    {
        uint256 length = documentHashes.length;
        uint256[] memory timestamps = new uint256[](length);
        string[] memory datas = new string[](length);
        address[] memory uploaders = new address[](length);
        address[] memory eoaList = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            bytes32 hash = documentHashes[i];
            Document memory doc = documents[hash];
            timestamps[i] = doc.timestamp;
            datas[i] = doc.data;
            uploaders[i] = doc.uploader;
            eoaList[i] = doc.eoa;
        }

        return (documentHashes, timestamps, datas, uploaders, eoaList);
    }

    /**
     * @dev Verifica si una Smart Account está en la whitelist.
     */
    function isWhitelisted(address _smartAccount) public view returns (bool) {
        return whiteList[_smartAccount].smartAccount != address(0);
    }

    /**
     * @dev Verifica si una Smart Account tiene rol ADMIN.
     */
    function isAdmin(address _smartAccount) public view returns (bool) {
        return whiteList[_smartAccount].role == Role.ADMIN;
    }

    // Funciones para recibir Ether
    receive() external payable virtual {}
    fallback() external payable virtual {}
}
