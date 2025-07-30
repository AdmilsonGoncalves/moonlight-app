import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { TokenFactory, Token } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { BigNumberish } from 'ethers';

// Constants for test configuration
const FEE: BigNumberish = ethers.parseEther('0.01'); // Fee to create a token
const TOTAL_SUPPLY: BigNumberish = ethers.parseEther('1000000'); // Total token supply (1M tokens)
const AMOUNT: BigNumberish = ethers.parseEther('10000'); // Token purchase amount (10K tokens)
const COST: BigNumberish = ethers.parseEther('1'); // ETH cost for buying 10K tokens
const SECOND_COST: BigNumberish = ethers.parseEther('2'); // ETH cost for second purchase to close sale
const TOKEN_NAME = 'MOONLIGHT APP'; // Token name
const TOKEN_SYMBOL = 'MOON'; // Token symbol

interface DeployFixture {
  factory: TokenFactory;
  token: Token;
  deployer: SignerWithAddress;
  creator: SignerWithAddress;
  buyer: SignerWithAddress;
}

interface BuyFixture {
  factory: TokenFactory;
  token: Token;
  creator: SignerWithAddress;
  buyer: SignerWithAddress;
}

/**
 * @dev Fixture to deploy TokenFactory, create a token, and return relevant objects.
 * @returns Object containing deployed factory, created token, and signers.
 */
async function deployFactoryFixture(): Promise<DeployFixture> {
  const [deployer, creator, buyer] = await ethers.getSigners();

  // Deploy TokenFactory
  const Factory = await ethers.getContractFactory('TokenFactory');
  const factory = await Factory.deploy(FEE) as TokenFactory;
  await factory.waitForDeployment();

  // Create a token
  const createTx = await factory.connect(creator).create(TOKEN_NAME, TOKEN_SYMBOL, { value: FEE });
  await createTx.wait();

  // Get a token address
  const tokenAddress = await factory.tokenAddresses(0);
  const token = await ethers.getContractAt('Token', tokenAddress) as Token;

  return { factory, token, deployer, creator, buyer };
}

/**
 * @dev Fixture to deploy TokenFactory, create a token, and perform a token purchase.
 * @returns Object containing deployed factory, token, and signers after a purchase.
 */
async function buyTokenFixture(): Promise<BuyFixture> {
  const { factory, token, creator, buyer } = await deployFactoryFixture();

  // Buy tokens
  const tokenAddress = await token.getAddress();
  const buyTx = await factory.connect(buyer).buy(tokenAddress, AMOUNT, { value: COST });
  await buyTx.wait();

  return { factory, token, creator, buyer };
}

/**
 * @dev Test suite for the TokenFactory contract.
 */
describe('TokenFactory', function () {

  describe('Deployment', function () {
    it('should set the correct fee', async function () {
      const { factory } = await loadFixture(deployFactoryFixture);
      expect(await factory.fee(), 'Fee should match constructor input').to.equal(FEE);
    });

    it('should set the correct owner', async function () {
      const { factory, deployer } = await loadFixture(deployFactoryFixture);
      expect(await factory.owner(), 'Owner should be deployer').to.equal(deployer.address);
    });
  });

  describe('Token Creation', function () {
    it('should set the factory as token owner', async function () {
      const { factory, token } = await loadFixture(deployFactoryFixture);
      expect(await token.owner(), 'Token owner should be factory').to.equal(await factory.getAddress());
    });

    it('should set the correct token creator', async function () {
      const { token, creator } = await loadFixture(deployFactoryFixture);
      expect(await token.creator(), 'Token creator should match').to.equal(creator.address);
    });

    it('should mint the correct total supply', async function () {
      const { factory, token } = await loadFixture(deployFactoryFixture);
      expect(await token.balanceOf(await factory.getAddress()), 'Token supply should match').to.equal(TOTAL_SUPPLY);
    });

    it('should update factory ETH balance after creation', async function () {
      const { factory } = await loadFixture(deployFactoryFixture);
      const balance = await ethers.provider.getBalance(await factory.getAddress());
      expect(balance, 'Factory balance should equal creation fee').to.equal(FEE);
    });

    it('should create a token sale with correct details', async function () {
      const { factory, token, creator } = await loadFixture(deployFactoryFixture);
      const sale = await factory.getTokenSale(0);
      expect(await factory.totalTokens(), 'Total tokens should be 1').to.equal(1);
      expect(sale.token, 'Sale token address should match').to.equal(await token.getAddress());
      expect(sale.name, 'Sale token name should match').to.equal(TOKEN_NAME);
      expect(sale.creator, 'Sale creator should match').to.equal(creator.address);
      expect(sale.sold, 'Initial sold amount should be 0').to.equal(0);
      expect(sale.raised, 'Initial raised amount should be 0').to.equal(0);
      expect(sale.isOpen, 'Sale should be open').to.equal(true);
    });
  });

  describe('Token Purchase', function () {
    it('should update factory ETH balance after purchase', async function () {
      const { factory } = await loadFixture(buyTokenFixture);
      const balance = await ethers.provider.getBalance(await factory.getAddress());
      expect(balance, 'Factory balance should include fee and purchase cost').to.equal(FEE + COST);
    });

    it('should update buyer\'s token balance', async function () {
      const { token, buyer } = await loadFixture(buyTokenFixture);
      expect(await token.balanceOf(buyer.address), 'Buyer balance should match purchase amount').to.equal(AMOUNT);
    });

    it('should update token sale details', async function () {
      const { factory, token } = await loadFixture(buyTokenFixture);
      const sale = await factory.tokenToSale(await token.getAddress());
      expect(sale.sold, 'Sold amount should match purchase').to.equal(AMOUNT);
      expect(sale.raised, 'Raised amount should match cost').to.equal(COST);
      expect(sale.isOpen, 'Sale should remain open').to.equal(true);
    });

    it('should increase token cost after purchase', async function () {
      const { factory, token } = await loadFixture(buyTokenFixture);
      const sale = await factory.tokenToSale(await token.getAddress());
      const cost = await factory.getCostPerToken(sale.sold);
      expect(cost, 'Cost per token should increase').to.equal(ethers.parseUnits('0.0002', 'ether'));
    });
  });

  describe('Depositing', function () {
    it('should close sale and deposit tokens/ETH to creator', async function () {
      const { factory, token, creator, buyer } = await loadFixture(buyTokenFixture);

      // Perform second purchase to reach target and close sale
      const buyTx = await factory.connect(buyer).buy(await token.getAddress(), AMOUNT, { value: SECOND_COST });
      await buyTx.wait();

      // Verify sale is closed
      const sale = await factory.tokenToSale(await token.getAddress());
      expect(sale.isOpen, 'Sale should be closed').to.equal(false);

      // Deposit tokens and ETH
      const depositTx = await factory.connect(creator).deposit(await token.getAddress());
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
      const { factory, deployer } = await loadFixture(deployFactoryFixture);
      const withdrawTx = await factory.connect(deployer).withdraw(FEE);
      await withdrawTx.wait();

      const contractAddress = await factory.getAddress()
      const contractBalance = await ethers.provider.getBalance(contractAddress);
      expect(contractBalance, 'Factory balance should be 0 after withdrawal').to.equal(0);
    });
  });
});
