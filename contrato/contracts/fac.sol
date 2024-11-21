// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

contract Fac is Initializable, ContextUpgradeable {
    address public owner;

    struct User {
        address userAddress;
        string name;
    }

    mapping(address => User) internal adminList;
    mapping(address => User) internal whiteList;
    mapping(bytes32 => Document) private documents;

    bytes32[] private documentHashes;

    struct Document {
        uint256 timestamp;
        string data;
        address uploader;
    }

    event AdminAdded(address indexed admin, string name);
    event AdminRemoved(address indexed admin);
    event UserWhitelisted(address indexed user, string name);
    event UserRemovedFromWhitelist(address indexed user);
    event DocumentSaved(bytes32 indexed docHash, address indexed uploader, uint256 timestamp);

    modifier onlyOwner() virtual {
        require(_msgSender() == owner, "Solo el propietario puede realizar esta accion");
        _;
    }

    modifier onlyOwnerOrAdmin() virtual {
        require(
            _msgSender() == owner || adminList[_msgSender()].userAddress != address(0),
            "Solo el propietario o administradores pueden realizar esta accion"
        );
        _;
    }

    modifier onlyAdmin() virtual {
        require(adminList[_msgSender()].userAddress != address(0), "Solo administradores pueden realizar esta accion");
        _;
    }

    modifier onlyWhitelisted() virtual {
        require(whiteList[_msgSender()].userAddress != address(0), "Usuario no esta en la lista blanca");
        _;
    }

    /**
     * @dev Inicializa el contrato estableciendo al msg.sender como propietario.
     */
    function initialize() public initializer {
        __Context_init();

        owner = _msgSender();

        // Agregar al propietario a la whitelist y como administrador
        whiteList[owner] = User(owner, "Propietario");
        emit UserWhitelisted(owner, "Propietario");

        adminList[owner] = User(owner, "Propietario");
        emit AdminAdded(owner, "Propietario");
    }

    function addAdmin(address _admin, string memory _name) public onlyOwnerOrAdmin {
        require(adminList[_admin].userAddress == address(0), "Ya es administrador");
        require(whiteList[_admin].userAddress != address(0), "El usuario debe estar en la whitelist");

        adminList[_admin] = User(_admin, _name);
        emit AdminAdded(_admin, _name);
    }

    function removeAdmin(address _admin) public onlyOwnerOrAdmin {
        require(_admin != owner, "No se puede eliminar al propietario");
        require(adminList[_admin].userAddress != address(0), "No es administrador");

        delete adminList[_admin];
        emit AdminRemoved(_admin);
    }

    function addToWhitelist(address _user, string memory _name) public onlyAdmin {
        require(whiteList[_user].userAddress == address(0), "Usuario ya esta en la lista blanca");

        whiteList[_user] = User(_user, _name);
        emit UserWhitelisted(_user, _name);
    }

    function removeFromWhitelist(address _user) public onlyAdmin {
        require(_user != owner, "No se puede eliminar al propietario");
        require(whiteList[_user].userAddress != address(0), "Usuario no esta en la lista blanca");

        delete whiteList[_user];
        emit UserRemovedFromWhitelist(_user);

        // Si es administrador, también lo eliminamos de la lista de administradores
        if (adminList[_user].userAddress != address(0)) {
            delete adminList[_user];
            emit AdminRemoved(_user);
        }
    }

    function saveDocument(string memory _data) public onlyWhitelisted returns (bytes32) {
        bytes32 docHash = keccak256(abi.encodePacked(_data, block.timestamp, _msgSender()));
        documents[docHash] = Document(block.timestamp, _data, _msgSender());
        documentHashes.push(docHash);
        emit DocumentSaved(docHash, _msgSender(), block.timestamp);
        return docHash;
    }

    function getDocument(bytes32 _docHash) public view returns (uint256, string memory, address) {
        Document memory doc = documents[_docHash];
        require(doc.timestamp != 0, "Documento no existe");
        return (doc.timestamp, doc.data, doc.uploader);
    }

    function getAllDocuments()
        public
        view
        returns (
            bytes32[] memory,
            uint256[] memory,
            string[] memory,
            address[] memory
        )
    {
        uint256 length = documentHashes.length;
        uint256[] memory timestamps = new uint256[](length);
        string[] memory datas = new string[](length);
        address[] memory uploaders = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            bytes32 hash = documentHashes[i];
            Document memory doc = documents[hash];
            timestamps[i] = doc.timestamp;
            datas[i] = doc.data;
            uploaders[i] = doc.uploader;
        }

        return (documentHashes, timestamps, datas, uploaders);
    }

    function isAdmin(address _user) public view returns (bool) {
        return adminList[_user].userAddress != address(0);
    }

    function isWhitelisted(address _user) public view returns (bool) {
        return whiteList[_user].userAddress != address(0);
    }

    receive() external payable virtual {}

    fallback() external payable virtual {}
}
