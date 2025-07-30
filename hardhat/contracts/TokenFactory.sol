// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

import {Token} from "./Token.sol";
import "hardhat/console.sol";

/**
 * @title TokenFactory
 * @dev Manages the creation and sale of ERC20 tokens. Allows creators to deploy tokens, buyers to purchase tokens, and creators to finalize sales by transferring remaining tokens and ETH to a liquidity pool or creator.
 */
contract TokenFactory {
    /**
     * @dev Target ETH amount to raise per token sale (3 ETH).
     */
    uint256 public constant TARGET = 3 ether;

    /**
     * @dev Maximum tokens to sell per sale (500,000 tokens in wei).
     */
    uint256 public constant TOKEN_LIMIT = 500_000 ether;

    /**
     * @dev Total supply of tokens created per sale (1,000,000 tokens in wei).
     */
    uint256 public constant TOTAL_SUPPLY = 1_000_000 ether;

    /**
     * @dev Minimum purchase amount per transaction (1 token in wei).
     */
    uint256 public constant MIN_PURCHASE = 1 ether;

    /**
     * @dev Maximum purchase amount per transaction (10,000 tokens in wei).
     */
    uint256 public constant MAX_PURCHASE = 10_000 ether;

    /**
     * @dev Immutable fee required to create a token, set during deployment.
     */
    uint256 public immutable fee;

    /**
     * @dev Address of the contract owner (deployer), who can withdraw funds.
     */
    address public owner;

    /**
     * @dev Total number of tokens created.
     */
    uint256 public totalTokens;

    /**
     * @dev Array storing addresses of all created tokens.
     */
    address[] public tokenAddresses;

    /**
     * @dev Struct to store token sale details.
     * @param token Address of the token contract.
     * @param name Name of the token.
     * @param creator Address of the token creator.
     * @param sold Total tokens sold in the sale (in wei).
     * @param raised Total ETH raised in the sale.
     * @param isOpen Boolean indicating if the sale is active.
     */
    struct TokenSale {
        address token;
        string name;
        address creator;
        uint256 sold;
        uint256 raised;
        bool isOpen;
    }

    /**
     * @dev Maps token addresses to their respective sale details.
     */
    mapping(address => TokenSale) public tokenToSale;

    /**
     * @dev Emitted when a new token is created.
     * @param token Address of the created token.
     */
    event Created(address indexed token);

    /**
     * @dev Emitted when tokens are purchased.
     * @param token Address of the token purchased.
     * @param amount Amount of tokens purchased (in wei).
     */
    event Buy(address indexed token, uint256 amount);

    /**
     * @dev Initializes the contract with a creation fee and sets the owner.
     * @param _fee The fee (in wei) required to create a new token.
     */
    constructor(uint256 _fee) {
        fee = _fee;
        owner = msg.sender;
    }

    /**
     * @dev Creates a new token and initializes its sale.
     * @param _name Name of the new token.
     * @param _symbol Symbol of the new token.
     */
    function create(string memory _name, string memory _symbol) external payable {
        require(msg.value >= fee, "Factory: Creator fee not met");

        Token token = new Token(msg.sender, _name, _symbol, TOTAL_SUPPLY);
        tokenAddresses.push(address(token));
        totalTokens++;

        TokenSale memory sale = TokenSale(
            address(token),
            _name,
            msg.sender,
            0,
            0,
            true
        );
        tokenToSale[address(token)] = sale;

        emit Created(address(token));
    }

    /**
     * @dev Allows users to buy tokens from an active sale.
     * @param _token Address of the token to buy.
     * @param _amount Amount of tokens to buy (in wei).
     */
    function buy(address _token, uint256 _amount) external payable {
        TokenSale storage sale = tokenToSale[_token];
        require(sale.isOpen == true, "Factory: Buying closed");
        require(_amount >= MIN_PURCHASE, "Factory: Amount too low");
        require(_amount <= MAX_PURCHASE, "Factory: Amount exceeded");

        uint256 costPerToken = getCostPerToken(sale.sold);
        uint256 totalPrice = costPerToken * (_amount / 10 ** 18);
        require(msg.value >= totalPrice, "Factory: Insufficient ETH received");

        sale.sold += _amount;
        sale.raised += totalPrice;

        if (sale.sold >= TOKEN_LIMIT || sale.raised >= TARGET) {
            sale.isOpen = false;
        }

        Token(_token).transfer(msg.sender, _amount);
        emit Buy(_token, _amount);
    }

    /**
     * @dev Calculates the cost of a token based on tokens sold.
     * @param _sold Total tokens sold in the sale (in wei).
     * @return Cost of one token (in wei).
     */
    function getCostPerToken(uint256 _sold) public pure returns (uint256) {
        uint256 floor = 0.0001 ether;
        uint256 step = 0.0001 ether;
        uint256 increment = 10_000 ether;

        uint256 cost = (step * (_sold / increment)) + floor;
        return cost;
    }

    /**
     * @dev Transfers remaining tokens and raised ETH to the creator after the sale closes.
     * @param _token Address of the token whose sale is being finalized.
     */
    function deposit(address _token) external {
        Token token = Token(_token);
        TokenSale memory sale = tokenToSale[_token];
        require(sale.isOpen == false, "Factory: Target not reached");

        token.transfer(sale.creator, token.balanceOf(address(this)));
        (bool success,) = payable(sale.creator).call{value: sale.raised}("");
        require(success, "Factory: ETH transfer failed");
    }

    /**
     * @dev Allows the owner to withdraw ETH from the contract.
     * @param _amount Amount of ETH to withdraw (in wei).
     */
    function withdraw(uint256 _amount) external {
        require(msg.sender == owner, "Factory: Not owner");
        (bool success,) = payable(owner).call{value: _amount}("");
        require(success, "Factory: ETH transfer failed");
    }

    /**
     * @dev Retrieves details of a token sale by index.
     * @param _index Index of the token in the tokenAddresses array.
     * @return TokenSale struct containing sale details.
     */
    function getTokenSale(uint256 _index) public view returns (TokenSale memory) {
        return tokenToSale[tokenAddresses[_index]];
    }
}
