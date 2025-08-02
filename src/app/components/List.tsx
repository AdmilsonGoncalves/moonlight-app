import { ethers } from 'ethers';
import { TokenFactory } from '../../../types/ethers-contracts';

interface ListProps {
  toggleCreate: () => void;
  fee: string;
  provider: ethers.BrowserProvider;
  factory: TokenFactory;
}

function List({ toggleCreate, fee, provider, factory }: ListProps) {
  async function listHandler(form: FormData): Promise<void> {
    try {
      const name = form.get('name') as string;
      const ticker = form.get('ticker') as string;

      if (!name?.trim() || !ticker?.trim()) {
        alert('Please provide both name and ticker');
        return;
      }

      const signer = await provider.getSigner();
      const transaction = await factory.connect(signer).create(name, ticker, { value: fee });
      await transaction.wait();

      toggleCreate();
    } catch (error) {
      console.error('Error listing token:', error);
    }
  }

  return (
    <div className="list">
      <h2>list new token</h2>

      <div className="list__description">
        <p>fee: {ethers.formatUnits(fee, 18)} ETH</p>
      </div>

      {/* Note: Form onSubmit is not used due to sandbox restrictions; using action instead */}
      <form action={listHandler}>
        <input type="text" name="name" placeholder="name" />
        <input type="text" name="ticker" placeholder="ticker" />
        <input type="submit" value="[ list ]" />
      </form>

      <button onClick={toggleCreate} className="btn--fancy">[ cancel ]</button>
    </div>
  );
}

export default List;
