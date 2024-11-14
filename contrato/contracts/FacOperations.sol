// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@opengsn/contracts/src/BaseRelayRecipient.sol";

contract FacOperations is BaseRelayRecipient {
    address public immutable owner;
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
    event AmountEstablished(uint256 amount);
    event DocumentSaved(bytes32 indexed docHash, address indexed uploader, uint256 timestamp);
    event BalanceSent(address indexed to, uint256 amount);
    event GasRefunded(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(_msgSender() == owner, "Solo el propietario puede realizar esta accion");
        _;
    }

    modifier onlyAdmin() {
        require(adminList[_msgSender()], "Solo administradores pueden realizar esta accion");
        _;
    }

    modifier onlyWhitelisted() {
        require(whiteList[_msgSender()], "Usuario no esta en la lista blanca");
        _;
    }

    constructor(address _trustedForwarder) {
        owner = msg.sender;
        _setTrustedForwarder(_trustedForwarder);
        
        // Inicializar el owner como admin y whitelisted
        adminList[msg.sender] = true;
        adminAddresses.push(msg.sender);
        whiteList[msg.sender] = true;
        whitelistedAddresses.push(msg.sender);
    }

    receive() external payable {}
    fallback() external payable {}

    function addAdmin(address _admin) external onlyOwner {
        require(!adminList[_admin], "Ya es administrador");
        adminList[_admin] = true;
        adminAddresses.push(_admin);
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) external onlyOwner {
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

    function addToWhitelist(address _user) external onlyAdmin {
        require(!whiteList[_user], "Usuario ya esta en la lista blanca");
        whiteList[_user] = true;
        whitelistedAddresses.push(_user);
        emit UserWhitelisted(_user);
    }

    function removeFromWhitelist(address _user) external onlyAdmin {
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

    function setEstablishedAmount(uint256 _amount) external onlyAdmin {
        establishedAmount = _amount;
        emit AmountEstablished(_amount);
    }

    function isAdmin(address _user) external view returns (bool) {
        return adminList[_user];
    }

    function isWhitelisted(address _user) external view returns (bool) {
        return whiteList[_user];
    }

    function getAdmins() external view returns (address[] memory) {
        return adminAddresses;
    }

    function getWhitelistedUsers() external view returns (address[] memory) {
        return whitelistedAddresses;
    }

    function saveDocument(string memory _data) external onlyWhitelisted returns (bytes32) {
        bytes32 docHash = keccak256(abi.encodePacked(_data, block.timestamp, _msgSender()));
        documents[docHash] = Document(block.timestamp, _data, _msgSender());
        documentHashes.push(docHash);
        emit DocumentSaved(docHash, _msgSender(), block.timestamp);
        return docHash;
    }

    function getDocument(bytes32 _docHash) external view returns (uint256, string memory, address) {
        Document memory doc = documents[_docHash];
        require(doc.timestamp != 0, "Documento no existe");
        return (doc.timestamp, doc.data, doc.uploader);
    }

    function getAllDocuments() external view returns (
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

    function sendBalance(address payable _to) external onlyOwner {
        require(establishedAmount > 0, "Monto no establecido");
        require(address(this).balance >= establishedAmount, "Saldo insuficiente");
        _to.transfer(establishedAmount);
        emit BalanceSent(_to, establishedAmount);
    }

    function refundGas(address user, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Saldo insuficiente para reembolso");
        payable(user).transfer(amount);
        emit GasRefunded(user, amount);
    }

    function _msgSender() internal view override returns (address) {
        return BaseRelayRecipient._msgSender();
    }

    function _msgData() internal view override returns (bytes calldata) {
        return BaseRelayRecipient._msgData();
    }

    function versionRecipient() external pure override returns (string memory) {
        return "2.2.6";
    }
}