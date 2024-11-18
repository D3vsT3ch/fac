// contracts/FacV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@opengsn/contracts/src/ERC2771Recipient.sol";
import "./Fac.sol";

contract FacV2 is Fac, ERC2771Recipient {

    // Ajustar visibilidad y usar patrón para llamar a la función internal
    function setTrustedForwarder(address _trustedForwarder) public onlyOwner {
        _setTrustedForwarder(_trustedForwarder);
    }

    function versionRecipient() external pure returns (string memory) {
        return "1";
    }
}
