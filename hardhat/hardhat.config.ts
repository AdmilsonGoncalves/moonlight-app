import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337, // Default Hardhat local node chain ID
    },
  },
};

// const config: HardhatUserConfig = {
//   solidity: "0.8.28",
//   networks: {
//     hardhat: {
//       chainId: 31337, // Default Hardhat local node chain ID
//     },
//     sepolia: {
//       url: process.env.INFURA_URL || "",
//       accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
//     },
//   },
// };

export default config;
