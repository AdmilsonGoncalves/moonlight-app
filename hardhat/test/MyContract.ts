import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractTransactionResponse } from 'ethers';
import { MyContract } from '../typechain-types';

describe("MyContract", function () {
  let contract: MyContract & {
    deploymentTransaction(): ContractTransactionResponse;
  };

  beforeEach(async function () {
    const contractFactory = await ethers.getContractFactory("MyContract");
    contract = await contractFactory.deploy();
    await contract.waitForDeployment();
  });

  it("should set and get value", async function () {
    await contract.setValue(42);
    expect(await contract.getValue()).to.equal(42);
  });
});
