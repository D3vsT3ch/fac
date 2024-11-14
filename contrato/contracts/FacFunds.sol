// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FacFunds {
    address public immutable owner;

    event FundsDeposited(address indexed from, uint256 amount);
    event FundsTransferred(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Solo el propietario puede realizar esta accion");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }

    fallback() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }

    function deposit() external payable onlyOwner {
        require(msg.value > 0, "El valor debe ser mayor que 0");
        emit FundsDeposited(msg.sender, msg.value);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function transferToOperations(address payable _operationsContract, uint256 _amount) external onlyOwner {
        require(_amount > 0, "Monto debe ser mayor que 0");
        require(address(this).balance >= _amount, "Saldo insuficiente");
        
        (bool success, ) = _operationsContract.call{value: _amount}("");
        require(success, "Transferencia fallida");
        
        emit FundsTransferred(_operationsContract, _amount);
    }
}