// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import { ethers } from 'ethers';

/**
 * @dev Constant defining the fee required to create a token in the TokenFactory contract.
 * Set to 0.01 ETH (in wei) for deployment.
 */
const FEE: bigint = ethers.parseUnits('0.01', 18);

/**
 * @dev Hardhat Ignition module for deploying the TokenFactory contract.
 * @param m Hardhat Ignition module builder to define deployment logic.
 * @returns Object containing the deployed TokenFactory contract instance.
 */
const TokenFactoryModule = buildModule('TokenFactoryModule', (m) => {
  /**
   * @dev Retrieves the fee parameter for the TokenFactory constructor, defaulting to FEE.
   * Allows overriding the fee during deployment if specified.
   */
  const fee = m.getParameter('fee', FEE);

  /**
   * @dev Deploys the TokenFactory contract with the specified fee.
   * The contract is initialized with the provided fee parameter.
   */
  const factory = m.contract('TokenFactory', [fee]);

  /**
   * @dev Returns the deployed factory contract for use in other modules or scripts.
   */
  return { factory };
});

export default TokenFactoryModule;
