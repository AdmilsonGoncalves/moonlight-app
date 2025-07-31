import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { TokenFactory, Token } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { BigNumberish } from 'ethers';

const FEE: BigNumberish = ethers.parseEther('0.01'); // Fee to create a token
const TOTAL_SUPPLY: BigNumberish = ethers.parseEther('1000000'); // Total token supply (1M tokens)
const AMOUNT: BigNumberish = ethers.parseEther('10000'); // Token purchase amount (10K tokens)
const COST: BigNumberish = ethers.parseEther('1'); // ETH cost for buying 10K tokens
const SECOND_COST: BigNumberish = ethers.parseEther('2'); // ETH cost for second purchase to close sale
const TOKEN_NAME = 'MOONLIGHT APP'; // Token name
const TOKEN_SYMBOL = 'MOON'; // Token symbol

interface DeployFixture {
  contract: TokenFactory;
  token: Token;
  deployer: SignerWithAddress;
  creator: SignerWithAddress;
  buyer: SignerWithAddress;
}

interface BuyFixture {
  contract: TokenFactory;
  token: Token;
  creator: SignerWithAddress;
  buyer: SignerWithAddress;
}

/**
 * @dev Fixture to deploy TokenFactory, create a token, and return relevant objects.
 * @returns Object containing deployed contract, created token, and signers.
 */
async function deployFactoryFixture(): Promise<DeployFixture> {

  /*
  In Hardhat or Hardhat Network, ethers.getSigners() returns the list of accounts pre-funded in the local development environment
  (usually 20 accounts with test ETH). In a browser environment with a wallet like MetaMask, it typically returns the account(s) associated
  with the wallet. When connected to a real Ethereum network, it depends on the provider and the accounts it has access to.
   */
  const [deployer, creator, buyer] = await ethers.getSigners();

  // Deploy a new instance of the TokenFactory contract
  const contractFactory = await ethers.getContractFactory('TokenFactory'); // This retrieves the contract factory for TokenFactory.
  const contract = await contractFactory.deploy(FEE); // Deploy the contract with the specified fee
  await contract.waitForDeployment(); // Wait for the deployment to complete

  // Create a token
  const createTokenTx = await contract.connect(creator).create(TOKEN_NAME, TOKEN_SYMBOL, { value: FEE }); // Call the create function with the creator and fee
  await createTokenTx.wait(); // Wait for the transaction to be mined

  // Get a token address
  const tokenAddress = await contract.tokenAddresses(0); // Retrieve the address of the first token created
  const token = await ethers.getContractAt('Token', tokenAddress); // Get the Token contract instance at the retrieved address

  return { contract, token, deployer, creator, buyer };
}

/**
 * @dev Fixture to deploy TokenFactory, create a token, and perform a token purchase.
 * @returns Object containing deployed contract, token, and signers after a purchase.
 */
async function buyTokenFixture(): Promise<BuyFixture> {
  const { contract, token, creator, buyer } = await deployFactoryFixture();

  // Buy tokens
  const tokenAddress = await token.getAddress();
  const buyTx = await contract.connect(buyer).buy(tokenAddress, AMOUNT, { value: COST });
  await buyTx.wait();

  return { contract, token, creator, buyer };
}

/**
 * @dev Test suite for the TokenFactory contract.
 */
describe('TokenFactory', function () {

  describe('Deployment', function () {
    it('should set the correct fee', async function () {
      const { contract } = await loadFixture(deployFactoryFixture);
      expect(await contract.fee(), 'Fee should match constructor input').to.equal(FEE);
    });

    it('should set the correct owner', async function () {
      const { contract, deployer } = await loadFixture(deployFactoryFixture);
      expect(await contract.owner(), 'Owner should be the deployer').to.equal(deployer.address);
    });
  });

  describe('Token Creation', function () {

    it('should set the contract as token owner', async function () {
      const { contract, token } = await loadFixture(deployFactoryFixture);
      expect(await token.owner(), 'Token owner should be contract').to.equal(await contract.getAddress());
    });

    it('should set the correct token creator', async function () {
      const { token, creator } = await loadFixture(deployFactoryFixture);
      expect(await token.creator(), 'Token creator should match').to.equal(creator.address);
    });

    it('should mint the correct total supply', async function () {
      const { contract, token } = await loadFixture(deployFactoryFixture);
      expect(await token.balanceOf(await contract.getAddress()), 'Token supply should match').to.equal(TOTAL_SUPPLY);
    });

    it('should update contract ETH balance after creation', async function () {
      const { contract } = await loadFixture(deployFactoryFixture);
      const balance = await ethers.provider.getBalance(await contract.getAddress());

      expect(balance, 'Factory balance should equal creation fee').to.equal(FEE);
    });

    it('should create a token sale with correct details', async function () {
      const { contract, token, creator } = await loadFixture(deployFactoryFixture);
      const sale = await contract.getTokenSale(0);

      expect(await contract.totalTokens(), 'Total tokens should be 1').to.equal(1);
      expect(sale.token, 'Sale token address should match').to.equal(await token.getAddress());
      expect(sale.name, 'Sale token name should match').to.equal(TOKEN_NAME);
      expect(sale.creator, 'Sale creator should match').to.equal(creator.address);
      expect(sale.sold, 'Initial sold amount should be 0').to.equal(0);
      expect(sale.raised, 'Initial raised amount should be 0').to.equal(0);
      expect(sale.isOpen, 'Sale should be open').to.equal(true);
    });
  });

  describe('Token Purchase', function () {

    it('should update contract ETH balance after purchase', async function () {
      const { contract } = await loadFixture(buyTokenFixture);
      const balance = await ethers.provider.getBalance(await contract.getAddress());
      expect(balance, 'Factory balance should include fee and purchase cost').to.equal(FEE + COST);
    });

    it('should update buyer\'s token balance', async function () {
      const { token, buyer } = await loadFixture(buyTokenFixture);
      expect(await token.balanceOf(buyer.address), 'Buyer balance should match purchase amount').to.equal(AMOUNT);
    });

    it('should update token sale details', async function () {
      const { contract, token } = await loadFixture(buyTokenFixture);
      const sale = await contract.tokenToSale(await token.getAddress());
      expect(sale.sold, 'Sold amount should match purchase').to.equal(AMOUNT);
      expect(sale.raised, 'Raised amount should match cost').to.equal(COST);
      expect(sale.isOpen, 'Sale should remain open').to.equal(true);
    });

    it('should increase token cost after purchase', async function () {
      const { contract, token } = await loadFixture(buyTokenFixture);
      const tokenAddress = await token.getAddress();
      const sale = await contract.tokenToSale(tokenAddress);
      const cost = await contract.getCost(sale.sold);
      expect(cost, 'Cost per token should increase').to.equal(ethers.parseUnits('0.0002', 'ether'));
    });
  });

  describe('Depositing', function () {

    it('should close sale and deposit tokens/ETH to creator', async function () {
      const { contract, token, creator, buyer } = await loadFixture(buyTokenFixture);

      // Perform second purchase to reach target and close sale
      const buyTx = await contract.connect(buyer).buy(await token.getAddress(), AMOUNT, { value: SECOND_COST });
      await buyTx.wait();

      // Verify sale is closed
      const tokenAddress = await token.getAddress();
      const sale = await contract.tokenToSale(tokenAddress);
      expect(sale.isOpen, 'Sale should be closed').to.equal(false);

      // Deposit tokens and ETH
      const depositTx = await contract.connect(creator).deposit(tokenAddress);
      await depositTx.wait();

      // Verify creator's token balance
      const expectedBalance = TOTAL_SUPPLY - AMOUNT * BigInt(2); // 1M - (10K + 10K)
      expect(await token.balanceOf(creator.address), 'Creator balance should match remaining tokens').to.equal(
        expectedBalance
      );
    });
  });

  describe('Withdrawing Fees', function () {

    it('should allow owner to withdraw creation fee', async function () {
      const { contract, deployer } = await loadFixture(deployFactoryFixture);
      const withdrawTx = await contract.connect(deployer).withdraw(FEE);
      await withdrawTx.wait();

      const contractAddress = await contract.getAddress();
      const contractBalance = await ethers.provider.getBalance(contractAddress);
      expect(contractBalance, 'Factory balance should be 0 after withdrawal').to.equal(0);
    });
  });
});
