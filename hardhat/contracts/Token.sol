// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.28;

/*
 * Token contract: A custom ERC20 token implementation.
 * Inherits from OpenZeppelin's ERC20 for standard token behavior.
 */
import "hardhat/console.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Declares a new contract named 'Token' that inherits from OpenZeppelin's ERC20 contract.
contract Token is ERC20 {

    // Declares a public state variable 'owner' of type 'address payable'.
    // 'payable' allows this address to receive Ether.
    // Stores the address of the contract deployer, who will receive minted tokens.
    address payable public owner;

    // Declares a public state variable 'creator' of type 'address'.
    // Stores an address specified during deployment, likely for tracking the creator entity.
    address public creator;

    /*
     * @dev constructor: Initializes the token with name, symbol, supply, and creator.
     * @param _creator Address of the creator (for tracking or governance).
     * @param _name Token name (e.g., "MyToken").
     * @param _symbol Token symbol (e.g., "MTK").
     * @param _totalSupply Total token supply to mint (in wei).
     */
    constructor(
        address _creator,
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) ERC20(_name, _symbol) {

        // Sets 'owner' to the address that deploys the contract (msg.sender).
        // 'payable' ensures the address can receive Ether if needed.
        owner = payable(msg.sender);

        // Assigns the provided '_creator' address to the 'creator' state variable.
        creator = _creator;

        // Calls the internal '_mint' function from ERC20 to create '_totalSupply' tokens.
        // Tokens are minted to the deployer's address (msg.sender).
        // Token amount is in wei (e.g., 1 token with 18 decimals = 1e18 wei).
        _mint(msg.sender, _totalSupply);
    }
}
