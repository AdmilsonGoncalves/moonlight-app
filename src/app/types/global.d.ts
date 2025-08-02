/*
  TypeScript does not recognize the window.ethereum property by default, as it is typically injected by browser extensions like MetaMask.
  Then, it's necessary to extend the Window interface to include the ethereum property, which is commonly used for Web3 providers like MetaMask.
*/

// Extend the Window interface to include ethereum
import type { ExternalProvider } from '@ethersproject/providers';

declare global {
  interface Window {
    ethereum?: ExternalProvider;
  }
}

export {};
