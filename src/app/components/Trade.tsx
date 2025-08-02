import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Image from 'next/image';
import TokenData from '@/app/model/token-data';
import { TokenFactory } from '../../../types/ethers-contracts';

interface TradeProps {
  toggleTrade: (token: TokenData) => void;
  token: TokenData;
  provider: ethers.BrowserProvider;
  factory: TokenFactory;
}

function Trade({ toggleTrade, token, provider, factory }: TradeProps) {
  const [target, setTarget] = useState<bigint>(BigInt(0));
  const [limit, setLimit] = useState<bigint>(BigInt(0));
  const [cost, setCost] = useState<bigint>(BigInt(0));

  async function buyHandler(form: FormData): Promise<void> {
    try {
      const amount = form.get('amount') as string;
      const parsedAmount = ethers.parseUnits(amount, 18); // Parse amount to wei (assuming 18 decimals)
      const cost = await factory.getCost(token.sold); // Ensure token.sold is a bigint
      const totalCost = cost * parsedAmount / ethers.parseUnits('1', 18); // Calculate total cost for the amount of tokens
      const signer = await provider.getSigner();
      const transaction = await factory.connect(signer).buy(token.token, parsedAmount, {
        value: totalCost
      });
      await transaction.wait();

      toggleTrade(token);
    } catch (error) {
      console.error('Error buying token:', error);
    }
  }

  useEffect(() => {

    async function getSaleDetails(): Promise<void> {
      try {
        const target = await factory.TARGET();
        setTarget(target);

        const limit = await factory.TOKEN_LIMIT();
        setLimit(limit);

        const cost = await factory.getCost(token.sold);
        setCost(cost);
      } catch (error) {
        console.error('Error fetching sale details:', error);
      }
    }

    void getSaleDetails();
  }, [token.sold, factory]);

  return (
    <div className="trade">
      <h2>trade</h2>

      <div className="token__details">
        <p className="name">{token.name}</p>
        <p>creator: {token.creator.slice(0, 6) + '...' + token.creator.slice(38, 42)}</p>
        <Image src={token.image} alt="Pepe" width={256} height={256} />
        <p>market cap: {ethers.formatUnits(token.raised, 18)} ETH</p>
        <p>base cost: {ethers.formatUnits(cost, 18)} ETH</p>
      </div>

      {token.sold >= limit || BigInt(token.raised) >= target ? (
        <p className="disclaimer">target reached!</p>
      ) : (
        <form action={buyHandler}>
          <input type="number" name="amount" min={1} max={10000} placeholder="1" />
          <input type="submit" value="[ buy ]" />
        </form>
      )}

      <button onClick={() => toggleTrade} className="btn--fancy">[ cancel ]</button>
    </div>
  );
}

export default Trade;
