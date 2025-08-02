This is a [Next.js](https://nextjs.org) project bootstrapped with [
`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Web3 dApp with Next.js, Hardhat, and Ethers.js

This project is a decentralized application (dApp) built with **Next.js** (using TypeScript), **Hardhat**, and *
*ethers.js (v6.15.0)**. It integrates a React-based frontend with smart contracts deployed on the Hardhat local node for
development and testing, with instructions for deploying to the Sepolia testnet.

## Why This Setup?

- **Frontend-First Approach**: Starting with Next.js sets up the user interface and TypeScript environment, making it
  easier to integrate smart contracts via Hardhat.
- **TypeScript Consistency**: Both Next.js and Hardhat support TypeScript, ensuring type safety across the stack.
- **Modular Structure**: Hardhat is kept in a subdirectory, separating frontend and backend concerns while enabling
  seamless integration with `ethers.js`.
- **Local Development**: The Hardhat local node allows fast, cost-free testing without needing testnet ETH.
- **Scalability**: This setup scales well for complex dApps with multiple contracts and frontend components.

## Prerequisites

- **Node.js** (v16 or later)
- **npm** or **yarn**
- **MetaMask** browser extension
- **Infura/Alchemy account** (for Sepolia deployment)
- **Sepolia ETH** (for testnet deployment, available from faucets like [Infura](https://infura.io/faucet)
  or [Alchemy](https://sepoliafaucet.com))

## Project Structure

```
my-web3-app/
├── app/
│   ├── components/
│   │   └── Web3Provider.tsx
│   └── page.tsx
├── hardhat/
│   ├── contracts/
│   │   └── MyContract.sol
│   ├── scripts/
│   │   └── deploy.ts
│   ├── test/
│   │   └── MyContract.ts
│   ├── hardhat.config.ts
│   └── .env
├── package.json
├── tsconfig.json
└── next.config.js
```

## Setup Instructions

### 1. Initialize the Next.js Project

1. Create a Next.js project with TypeScript:
   ```bash
   npx create-next-app@latest my-web3-app --typescript
   ```
    - Select **App Router** (recommended) or Pages Router. This guide uses App Router.
    - This sets up `tsconfig.json`, React type definitions, and a sample `app/page.tsx`.

2. Navigate to the project directory:
   ```bash
   cd my-web3-app
   ```

3. Verify `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "es2020",
       "lib": ["dom", "dom.iterable", "esnext"],
       "allowJs": true,
       "skipLibCheck": true,
       "strict": true,
       "forceConsistentCasingInFileNames": true,
       "noEmit": true,
       "esModuleInterop": true,
       "module": "esnext",
       "moduleResolution": "node",
       "resolveJsonModule": true,
       "isolatedModules": true,
       "jsx": "preserve",
       "incremental": true
     },
     "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
     "exclude": ["node_modules"]
   }
   ```

4. Install `ethers.js`:
   ```bash
   npm install ethers@6.15.0
   ```

### 2. Set Up Hardhat with TypeScript

1. Initialize Hardhat in a subdirectory:
   ```bash
   mkdir hardhat && cd hardhat
   npx hardhat init
   ```
    - Select **TypeScript** when prompted.
    - This creates `hardhat.config.ts`, TypeScript test/script files, and dependencies.

2. Install Hardhat dependencies:
   ```bash
   npm install --save-dev @nomicfoundation/hardhat-toolbox typescript ts-node @types/chai @types/mocha @types/node
   ```

3. Configure `hardhat.config.ts` for the Hardhat local node:
   ```typescript
   import { HardhatUserConfig } from "hardhat/config";
   import "@nomicfoundation/hardhat-toolbox";
   import * as dotenv from "dotenv";

   dotenv.config();

   const config: HardhatUserConfig = {
     solidity: "0.8.20",
     networks: {
       hardhat: {
         chainId: 31337,
       },
     },
   };

   export default config;
   ```

4. Create a sample contract (`hardhat/contracts/MyContract.sol`):
   ```solidity
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.20;

   contract MyContract {
       uint256 public value;

       function setValue(uint256 _value) public {
           value = _value;
       }

       function getValue() public view returns (uint256) {
           return value;
       }
   }
   ```

5. Create a deployment script (`hardhat/ignition/modules/TokenFactory.ts`):
   ```typescript
   import { ethers } from "hardhat";

   async function main() {
     const MyContract = await ethers.getContractFactory("MyContract");
     const contract = await MyContract.deploy();
     await contract.waitForDeployment();
     console.log("Contract deployed to:", contract.target);
   }

   main().catch((error) => {
     console.error(error);
     process.exitCode = 1);
   });
   ```

6. Test the contract (`hardhat/test/MyContract.ts`):
   ```typescript
   import { expect } from "chai";
   import { ethers } from "hardhat";
   import { Contract } from "ethers";

   describe("MyContract", function () {
     let contract: Contract;

     beforeEach(async function () {
       const MyContract = await ethers.getContractFactory("MyContract");
       contract = await MyContract.deploy();
       await contract.waitForDeployment();
     });

     it("should set and get value", async function () {
       await contract.setValue(42);
       expect(await contract.getValue()).to.equal(42);
     });
   });
   ```

7. Run tests:
   ```bash
   cd hardhat
   npx hardhat test
   ```

8. Start the Hardhat local node and deploy:
   ```bash
   npx hardhat node
   ```
    - In a separate terminal (from `hardhat/`):
      ```bash
      npx hardhat ignition deplay ignition/modules/ --network localhost
      ```
    - Note the deployed contract address (e.g., `0x...`).

### 3. Integrate with Next.js

1. Copy the contract ABI from `hardhat/artifacts/contracts/MyContract.sol/MyContract.json` to your Next.js project or
   import it dynamically.

2. Configure MetaMask for the Hardhat local node:
    - In MetaMask, add a custom network:
        - Network Name: Hardhat Local
        - RPC URL: `http://127.0.0.1:8545`
        - Chain ID: `31337`
        - Currency Symbol: ETH (optional)
    - Import a Hardhat account (private keys are logged by `npx hardhat node`, e.g., `0xac0974...`) into MetaMask.

3. Create a Web3 component (`app/components/Web3Provider.tsx`):
   ```typescript
   "use client";
   import { useState, useEffect } from "react";
   import { ethers, BrowserProvider, Contract } from "ethers";

   const CONTRACT_ABI = [
     {
       inputs: [{ internalType: "uint256", name: "_value", type: "uint256" }],
       name: "setValue",
       outputs: [],
       stateMutability: "nonpayable",
       type: "function",
     },
     {
       inputs: [],
       name: "getValue",
       outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
       stateMutability: "view",
       type: "function",
     },
   ];

   const CONTRACT_ADDRESS = "0xYOUR_CONTRACT_ADDRESS"; // Replace with Hardhat node address

   export default function Web3Provider() {
     const [provider, setProvider] = useState<BrowserProvider | null>(null);
     const [contract, setContract] = useState<Contract | null>(null);
     const [value, setValue] = useState<number | null>(null);

     useEffect(() => {
       async function initializeProvider() {
         if (typeof window !== "undefined" && window.ethereum) {
           try {
             await window.ethereum.request({ method: "eth_requestAccounts" });
             const provider = new ethers.BrowserProvider(window.ethereum);
             setProvider(provider);

             const signer = await provider.getSigner();
             const contract = new ethers.Contract(
               CONTRACT_ADDRESS,
               CONTRACT_ABI,
               signer
             );
             setContract(contract);

             const currentValue = await contract.getValue();
             setValue(Number(currentValue));
           } catch (error) {
             console.error("Error initializing provider or contract:", error);
           }
         } else {
           console.error("MetaMask not detected.");
         }
       }
       initializeProvider();
     }, []);

     const handleSetValue = async () => {
       if (contract) {
         try {
           const tx = await contract.setValue(100);
           await tx.wait();
           const newValue = await contract.getValue();
           setValue(Number(newValue));
         } catch (error) {
           console.error("Error setting value:", error);
         }
       }
     };

     return (
       <div>
         {provider ? (
           <>
             <p>Connected to Hardhat local node</p>
             <p>Contract Value: {value !== null ? value : "Loading..."}</p>
             <button onClick={handleSetValue}>Set Value to 100</button>
           </>
         ) : (
           <p>Connecting to MetaMask...</p>
         )}
       </div>
     );
   }
   ```

4. Use it in `app/page.tsx`:
   ```typescript
   import Web3Provider from "./components/Web3Provider";

   export default function Home() {
     return (
       <div>
         <h1>My Web3 dApp</h1>
         <Web3Provider />
       </div>
     );
   }
   ```

### 4. Run and Test

1. **Start Hardhat Local Node**:
    - Compile contracts:
      ```bash
      cd hardhat
      npx hardhat compile
      ```
    - Run tests:
      ```bash
      npx hardhat test
      ```
    - Start the node:
      ```bash
      npx hardhat node
      ```
    - Deploy (in a separate terminal from `hardhat/`):
      ```bash
      npx hardhat ignition deploy ignition/modules/TokenFactory.ts --network localhost
    ```

2. **Start Next.js**:
   ```bash
   cd ..
   npm run dev
   ```
    - Open `http://localhost:3000`.
    - In MetaMask, connect to the Hardhat local node (`http://127.0.0.1:8545`, Chain ID: 31337).
    - Interact with the contract (e.g., click "Set Value to 100").

### 5. Deploying to Sepolia

To deploy to the Sepolia testnet:

1. Update `hardhat.config.ts`:
   ```typescript
   import { HardhatUserConfig } from "hardhat/config";
   import "@nomicfoundation/hardhat-toolbox";
   import * as dotenv from "dotenv";

   dotenv.config();

   const config: HardhatUserConfig = {
     solidity: "0.8.20",
     networks: {
       hardhat: {
         chainId: 31337,
       },
       sepolia: {
         url: process.env.INFURA_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
         accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
       },
     },
   };

   export default config;
   ```

2. Create/update `hardhat/.env`:
   ```env
   INFURA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   PRIVATE_KEY=YOUR_PRIVATE_KEY
   ```

3. Deploy to Sepolia:
   ```bash
   cd hardhat
   npx hardhat ignition deploy ignition/modules/ --network sepolia
   ```
    - Note the deployed contract address.

4. Update `app/components/Web3Provider.tsx` with the Sepolia contract address.

5. In MetaMask, switch to Sepolia and ensure your account has Sepolia ETH.

6. Restart Next.js (`npm run dev`) and interact with the contract on Sepolia at `http://localhost:3000`.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use
the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for
more details.

## Additional Resources

For further assistance, contact the maintainers or search for issues with Next.js, Hardhat, and `ethers@6.15.0` on
platforms like X or GitHub.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically
optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions
are welcome!
