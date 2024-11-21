// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@opengsn/contracts/src/ERC2771Recipient.sol";
import "./Fac.sol";

contract FacV2 is Fac, ERC2771Recipient {
    /**
     * @dev Establece el Trusted Forwarder. Solo puede ser llamado por el propietario o un administrador.
     * @param _trustedForwarder La dirección del trusted forwarder (Biconomy).
     */
    function setTrustedForwarder(address _trustedForwarder) public onlyOwnerOrAdmin {
        _setTrustedForwarder(_trustedForwarder);
    }

    /**
     * @dev Devuelve la versión del recipient.
     */
    function versionRecipient() external pure returns (string memory) {
        return "1";
    }

    /**
     * @dev Sobrescribe _msgSender() para usar el forwarder de ERC2771Recipient.
     */
    function _msgSender() internal view override(ContextUpgradeable, ERC2771Recipient) returns (address sender) {
        return ERC2771Recipient._msgSender();
    }

    /**
     * @dev Sobrescribe _msgData() para usar el forwarder de ERC2771Recipient.
     */
    function _msgData() internal view override(ContextUpgradeable, ERC2771Recipient) returns (bytes calldata) {
        return ERC2771Recipient._msgData();
    }

    /**
     * @dev Sobrescribe receive() para usar el forwarder.
     */
    receive() external payable override(Fac) {}

    /**
     * @dev Sobrescribe fallback() para usar el forwarder.
     */
    fallback() external payable override(Fac) {}
}
