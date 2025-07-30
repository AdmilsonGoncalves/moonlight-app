// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import { ethers } from 'ethers';

const FEE = ethers.parseUnits('0.01', 18);

const TokenFactoryModule = buildModule('TokenFactoryModule', (m) => {

  // Get parameters
  const fee = m.getParameter('fee', FEE);

  // Define factory
  const factory = m.contract('TokenFactory', [fee]);

  return { factory };
});

export default TokenFactoryModule;
