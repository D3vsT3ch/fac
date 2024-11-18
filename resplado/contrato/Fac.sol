// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract Fac is ERC2771Context {
    address public owner;

    struct User {
        address userAddress;
        string name;
    }

    mapping(address => User) private adminList;
    mapping(address => User) private whiteList;
    mapping(bytes32 => Document) private documents;

    bytes32[] private documentHashes;
    User[] private adminUsers;
    User[] private whitelistedUsers;

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
        require(_msgSender() == owner, "Solo el propietario puede realizar esta accion");
        _;
    }

    modifier onlyAdmin() {
        require(adminList[_msgSender()].userAddress != address(0), "Solo administradores pueden realizar esta accion");
        _;
    }

    modifier onlyWhitelisted() {
        require(whiteList[_msgSender()].userAddress != address(0), "Usuario no esta en la lista blanca");
        _;
    }

    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {
        owner = _msgSender();
        // Agregar owner a la whitelist y adminList
        User memory ownerUser = User(owner, "Owner");
        whiteList[owner] = ownerUser;
        whitelistedUsers.push(ownerUser);

        adminList[owner] = ownerUser;
        adminUsers.push(ownerUser);
    }

    function addAdmin(address _admin, string memory _name) public onlyOwner {
        require(adminList[_admin].userAddress == address(0), "Ya es administrador");
        require(whiteList[_admin].userAddress != address(0), "El usuario debe estar en la whitelist");

        User memory newUser = User(_admin, _name);
        adminList[_admin] = newUser;
        adminUsers.push(newUser);

        emit AdminAdded(_admin, _name);
    }

    function removeAdmin(address _admin) public onlyOwner {
        require(_admin != owner, "No se puede eliminar al propietario");
        require(adminList[_admin].userAddress != address(0), "No es administrador");

        // Remover de adminList
        delete adminList[_admin];
        // Remover de la lista de administradores
        for (uint i = 0; i < adminUsers.length; i++) {
            if (adminUsers[i].userAddress == _admin) {
                adminUsers[i] = adminUsers[adminUsers.length - 1];
                adminUsers.pop();
                break;
            }
        }
        emit AdminRemoved(_admin);
        // No removemos al usuario de la whitelist
    }

    function addToWhitelist(address _user, string memory _name) public onlyAdmin {
        require(whiteList[_user].userAddress == address(0), "Usuario ya esta en la lista blanca");

        User memory newUser = User(_user, _name);
        whiteList[_user] = newUser;
        whitelistedUsers.push(newUser);

        emit UserWhitelisted(_user, _name);
    }

    function removeFromWhitelist(address _user) public onlyAdmin {
        require(_user != owner, "No se puede eliminar al propietario");
        require(whiteList[_user].userAddress != address(0), "Usuario no esta en la lista blanca");

        // Remover de la whitelist
        delete whiteList[_user];
        // Remover de la lista de usuarios en whitelist
        for (uint i = 0; i < whitelistedUsers.length; i++) {
            if (whitelistedUsers[i].userAddress == _user) {
                whitelistedUsers[i] = whitelistedUsers[whitelistedUsers.length - 1];
                whitelistedUsers.pop();
                break;
            }
        }
        emit UserRemovedFromWhitelist(_user);

        // Si el usuario es administrador, también lo removemos de adminList
        if (adminList[_user].userAddress != address(0)) {
            removeAdmin(_user);
        }
    }

    function isAdmin(address _user) public view returns (bool) {
        return adminList[_user].userAddress != address(0);
    }

    function isWhitelisted(address _user) public view returns (bool) {
        return whiteList[_user].userAddress != address(0);
    }

    function getAdmin(address _user) public view returns (User memory) {
        return adminList[_user];
    }

    function getWhitelistedUser(address _user) public view returns (User memory) {
        return whiteList[_user];
    }

    function getAdmins() public view returns (User[] memory) {
        return adminUsers;
    }

    function getWhitelistedUsers() public view returns (User[] memory) {
        return whitelistedUsers;
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

    // Sobrescribir _msgSender() y _msgData() correctamente
    function _msgSender() internal view override(ERC2771Context) returns (address sender) {
        sender = super._msgSender();
    }

    function _msgData() internal view override(ERC2771Context) returns (bytes calldata) {
        return super._msgData();
    }

    receive() external payable {}
    fallback() external payable {}
}
