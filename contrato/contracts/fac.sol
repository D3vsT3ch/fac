// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Fac is Initializable {
    address public owner;

    struct User {
        address userAddress;
        string name;
    }

    mapping(address => User) private adminList;
    mapping(address => User) private whiteList;
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

    modifier onlyOwner() {
        require(msg.sender == owner, unicode"Solo el propietario puede realizar esta acción");
        _;
    }

    modifier onlyAdmin() {
        require(adminList[msg.sender].userAddress != address(0), unicode"Solo administradores pueden realizar esta acción");
        _;
    }

    modifier onlyWhitelisted() {
        require(whiteList[msg.sender].userAddress != address(0), unicode"Usuario no está en la lista blanca");
        _;
    }

    // Reemplazo del constructor
    function initialize() public initializer {
        owner = msg.sender;
        whiteList[owner] = User(owner, "Propietario");
    }

    function addAdmin(address _admin, string memory _name) public onlyOwner {
        require(adminList[_admin].userAddress == address(0), unicode"Ya es administrador");
        require(whiteList[_admin].userAddress != address(0), unicode"El usuario debe estar en la whitelist");

        adminList[_admin] = User(_admin, _name);
        emit AdminAdded(_admin, _name);
    }

    function removeAdmin(address _admin) public onlyOwner {
        require(_admin != owner, unicode"No se puede eliminar al propietario");
        require(adminList[_admin].userAddress != address(0), unicode"No es administrador");

        delete adminList[_admin];
        emit AdminRemoved(_admin);
    }

    function addToWhitelist(address _user, string memory _name) public onlyAdmin {
        require(whiteList[_user].userAddress == address(0), unicode"Usuario ya está en la lista blanca");

        whiteList[_user] = User(_user, _name);
        emit UserWhitelisted(_user, _name);
    }

    function removeFromWhitelist(address _user) public onlyAdmin {
        require(_user != owner, unicode"No se puede eliminar al propietario");
        require(whiteList[_user].userAddress != address(0), unicode"Usuario no está en la lista blanca");

        delete whiteList[_user];
        emit UserRemovedFromWhitelist(_user);

        // Si es administrador, también lo eliminamos de la lista de administradores
        if (adminList[_user].userAddress != address(0)) {
            removeAdmin(_user);
        }
    }

    function saveDocument(string memory _data) public onlyWhitelisted returns (bytes32) {
        bytes32 docHash = keccak256(abi.encodePacked(_data, block.timestamp, msg.sender));
        documents[docHash] = Document(block.timestamp, _data, msg.sender);
        documentHashes.push(docHash);
        emit DocumentSaved(docHash, msg.sender, block.timestamp);
        return docHash;
    }

    function getDocument(bytes32 _docHash) public view returns (uint256, string memory, address) {
        Document memory doc = documents[_docHash];
        require(doc.timestamp != 0, unicode"Documento no existe");
        return (doc.timestamp, doc.data, doc.uploader);
    }

    function getAllDocuments() public view returns (
        bytes32[] memory,
        uint256[] memory,
        string[] memory,
        address[] memory
    ) {
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

    receive() external payable {}
    fallback() external payable {}
}
