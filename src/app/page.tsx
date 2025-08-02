"use client"

import { useEffect, useState } from "react"
import { ethers } from 'ethers'

// Components
import Header from "./components/Header"
import List from "./components/List"
import Token from "./components/Token"
import Trade from "./components/Trade"

// ABIs & Config
import Factory from "./abis/TokenFactory.json"
import config from "./config.json"
import images from "./resources/images.json"
import TokenData from '@/app/model/token-data';
import { TokenFactory } from '../../types/ethers-contracts';

interface Config {
  [chainId: string]: {
    factory: {
      address: string;
    };
  };
}

export default function Home() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [factory, setFactory] = useState<TokenFactory | null>(null);
  const [fee, setFee] = useState<string>("0");
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [token, setToken] = useState<TokenData | null>(null);
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [showTrade, setShowTrade] = useState<boolean>(false);

  function toggleCreate(): void {
    setShowCreate(!showCreate);
  }

  function toggleTrade(token: TokenData): void {
    setToken(token);
    setShowTrade(!showTrade);
  }

  async function loadBlockchainData(): Promise<void> {
    try {
      // Use MetaMask for our connection
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);

      // Get the current network
      const network = await provider.getNetwork();

      // Create reference to Factory contract
      const typedConfig: Config = config;
      if (!typedConfig[network.chainId.toString()] || !typedConfig[network.chainId.toString()].factory) {
        throw new Error(`Factory address not found for chainId: ${network.chainId}`);
      }

      const factory = new ethers.Contract(
        typedConfig[network.chainId.toString()].factory.address,
        Factory,
        provider
      );
      setFactory(factory);

      // Fetch the fee
      const fee = await factory.fee();
      setFee(fee.toString());

      // Prepare to fetch token details
      const totalTokens = Number(await factory.totalTokens());
      const tokens: TokenData[] = [];

      // We'll get the first 6 tokens listed
      for (let i = 0; i < totalTokens && i < 6; i++) {
        const tokenSale = await factory.getTokenSale(i);

        // Create token object with extra fields
        const token: TokenData = {
          token: tokenSale.token,
          name: tokenSale.name,
          creator: tokenSale.creator,
          sold: tokenSale.sold,
          raised: tokenSale.raised.toString(),
          isOpen: tokenSale.isOpen,
          image: images[i]
        };

        tokens.push(token);
      }

      // Reverse the array to show most recent first
      setTokens(tokens.reverse());
    } catch (error) {
      console.error("Error loading blockchain data:", error);
    }
  }

  useEffect(() => {
    void loadBlockchainData();
  }, []);

  return (
    <div className="page">
      <Header account={account} setAccount={setAccount} />

      <main>
        <div className="create">
          <button
            onClick={factory && account ? toggleCreate : undefined}
            className="btn--fancy"
            disabled={!factory || !account}
          >
            {!factory ? (
              "[ contract not deployed ]"
            ) : !account ? (
              "[ please connect ]"
            ) : (
              "[ start a new token ]"
            )}
          </button>
        </div>

        <div className="listings">
          <h1>new listings</h1>

          <div className="tokens">
            {!account ? (
              <p>please connect wallet</p>
            ) : tokens.length === 0 ? (
              <p>No tokens listed</p>
            ) : (
              tokens.map((token, index) => (
                <Token
                  toggleTrade={toggleTrade}
                  token={token}
                  key={index}
                />
              ))
            )}
          </div>
        </div>

        {showCreate && factory && provider && (
          <List
            toggleCreate={toggleCreate}
            fee={fee}
            provider={provider}
            factory={factory}
          />
        )}

        {showTrade && token && provider && factory && (
          <Trade
            toggleTrade={toggleTrade}
            token={token}
            provider={provider}
            factory={factory}
          />
        )}
      </main>
    </div>
  );
}
