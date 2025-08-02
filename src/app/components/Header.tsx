import { ethers } from "ethers";

// Define props interface
interface HeaderProps {
  account: string | null;
  setAccount: (account: string) => void;
}


function Header({ account, setAccount }: HeaderProps) {
  async function connectHandler(): Promise<void> {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }
      const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = ethers.getAddress(accounts[0]);
      setAccount(account);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  }

  return (
    <header>
      <p className="brand">fun.pump</p>

      {account ? (
        <button onClick={connectHandler} className="btn--fancy">
          [ {account.slice(0, 6) + '...' + account.slice(38, 42)} ]
        </button>
      ) : (
        <button onClick={connectHandler} className="btn--fancy">
          [ connect ]
        </button>
      )}
    </header>
  );
}

export default Header;
