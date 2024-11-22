require("@nomicfoundation/hardhat-toolbox");

require("@nomicfoundation/hardhat-ethers");
require('@openzeppelin/hardhat-upgrades');

const {config} = require("dotenv") 
const {resolve} = require("path")
config({path:resolve(__dirname,"./.env")})
 
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  networks:{
   
    amoy: {
      url: "https://rpc-amoy.polygon.technology/",
      accounts: [`0x${process.env.TESTNET_PRIVATE_KEY}`]
    
    },
    sepolia: {
      url: "https://eth-sepolia.public.blastapi.io",
      accounts: [`0x${process.env.TESTNET_PRIVATE_KEY}`],

    
    }
   
  }
};
