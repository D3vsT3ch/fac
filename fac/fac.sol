// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DocumentManager {
    address public owner;
    uint256 public establishedAmount;

    mapping(address => bool) private adminList;
    mapping(address => bool) private whiteList;
    mapping(bytes32 => Document) private documents;
    
    bytes32[] private documentHashes;
    address[] private adminAddresses;
    address[] private whitelistedAddresses;

    struct Document {
        uint256 timestamp;
        string data;
        address uploader;
    }

    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event UserWhitelisted(address indexed user);
    event UserRemovedFromWhitelist(address indexed user); 
    event DocumentSaved(bytes32 indexed docHash, address indexed uploader, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Solo el propietario puede realizar esta accion");
        _;
    }

    modifier onlyAdmin() {
        require(adminList[msg.sender], "Solo administradores pueden realizar esta accion");
        _;
    }

    modifier onlyWhitelisted() {
        require(whiteList[msg.sender], "Usuario no esta en la lista blanca");
        _;
    }

    constructor() {
        owner = msg.sender;
        adminList[owner] = true;
        adminAddresses.push(owner);
        whiteList[owner] = true;
        whitelistedAddresses.push(owner);
    }

    function addAdmin(address _admin) public onlyOwner {
        require(!adminList[_admin], "Ya es administrador");
        adminList[_admin] = true;
        adminAddresses.push(_admin);
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) public onlyOwner {
        require(_admin != owner, "No se puede eliminar al propietario");
        require(adminList[_admin], "No es administrador");
        adminList[_admin] = false;
        for (uint i = 0; i < adminAddresses.length; i++) {
            if (adminAddresses[i] == _admin) {
                adminAddresses[i] = adminAddresses[adminAddresses.length - 1];
                adminAddresses.pop();
                break;
            }
        }
        emit AdminRemoved(_admin);
    }

    function addToWhitelist(address _user) public onlyAdmin {
        require(!whiteList[_user], "Usuario ya esta en la lista blanca");
        whiteList[_user] = true;
        whitelistedAddresses.push(_user);
        emit UserWhitelisted(_user);
    }

    function removeFromWhitelist(address _user) public onlyAdmin {
        require(_user != owner, "No se puede eliminar al propietario");
        require(whiteList[_user], "Usuario no esta en la lista blanca");
        whiteList[_user] = false;
        for (uint i = 0; i < whitelistedAddresses.length; i++) {
            if (whitelistedAddresses[i] == _user) {
                whitelistedAddresses[i] = whitelistedAddresses[whitelistedAddresses.length - 1];
                whitelistedAddresses.pop();
                break;
            }
        }
        emit UserRemovedFromWhitelist(_user);
    }

    

    function isAdmin(address _user) public view returns (bool) {
        return adminList[_user];
    }

    function isWhitelisted(address _user) public view returns (bool) {
        return whiteList[_user];
    }

    function getAdmins() public view returns (address[] memory) {
        return adminAddresses;
    }

    function getWhitelistedUsers() public view returns (address[] memory) {
        return whitelistedAddresses;
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

   
    receive() external payable {}
    fallback() external payable {}
}