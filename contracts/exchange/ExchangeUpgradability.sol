pragma solidity >=0.4.22 <0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./ExchangeStorage.sol";
import "./interfaces/IExchangeUpgradability.sol";

contract ExchangeUpgradability is Ownable, ExchangeStorage {

    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    /**
      * @dev version of the exchange
      */
    uint8 constant public VERSION = 1;

    /**
      * @dev the address of the upgraded exchange contract
      */
    address public newExchange;

    /**
      * @dev flag to allow migrating to an upgraded contract
      */
    bool public migrationAllowed;

    /**
      * @dev emitted when funds are migrated
      */
    event FundsMigrated(address indexed user, address indexed newExchange);

    /**
    * @dev Owner can set the address of the new version of the exchange contract.
    */
    function setNewExchangeAddress(address exchange)
        external
        onlyOwner
    {
        newExchange = exchange;
    }

    /**
    * @dev Enables/Disables the migrations. Can be called only by the owner.
    */
    function allowOrRestrictMigrations()
        external
        onlyOwner
    {
        migrationAllowed = !migrationAllowed;
    }

    /**
    * @dev Migrating assets of the caller to the new exchange contract
    */
    function migrateFunds(address[] calldata tokens) external {

        require(
            false != migrationAllowed,
            "MIGRATIONS_DISALLOWED"
        );

        require(
            IExchangeUpgradability(newExchange).VERSION() > VERSION,
            "INVALID_VERSION"
        );

        migrateEthers();

        migrateTokens(tokens);

        emit FundsMigrated(msg.sender, newExchange);
    }

    /**
    * @dev Helper function to migrate user's Ethers. Should be called in migrateFunds() function.
    */
    function migrateEthers() private {
        address user = msg.sender;
        uint256 etherAmount = balances[address(0x0)][user];
        if (etherAmount > 0) {
            balances[address(0x0)][user] = 0;
            IExchangeUpgradability(newExchange).importEthers.value(etherAmount)(user);
        }
    }

    /**
    * @dev Helper function to migrate user's tokens. Should be called in migrateFunds() function.
    */
    function migrateTokens(address[] memory tokens) private {
        address user = msg.sender;
        address exchange = newExchange;
        for (uint256 index = 0; index < tokens.length; index++) {

            address tokenAddress = tokens[index];

            uint256 tokenAmount = balances[tokenAddress][user];

            if (0 == tokenAmount) {
                continue;
            }

            IERC20(tokenAddress).safeApprove(exchange, tokenAmount);

            balances[tokenAddress][user] = 0;

            IExchangeUpgradability(exchange).importTokens(tokenAddress, tokenAmount, user);
        }
    }

    /**
    * @dev Helper function to migrate user's Ethers. Should be called only from the new exchange contract.
    */
    function importEthers(address user)
        external
        payable
    {
        require(
            false != migrationAllowed,
            "MIGRATION_DISALLOWED"
        );

        require(
            user != address(0x0),
            "INVALID_USER"
        );

        require(
            msg.value > 0,
            "INVALID_AMOUNT"
        );

        require(
            IExchangeUpgradability(msg.sender).VERSION() < VERSION,
            "INVALID_VERSION"
        );

        balances[address(0x0)][user] = balances[address(0x0)][user].add(msg.value); // todo: constants
    }
    
    /**
    * @dev Helper function to migrate user's Tokens. Should be called only from the new exchange contract.
    */
    function importTokens(
        address token,
        uint256 amount,
        address user
    )
        external
    {
        require(
            false != migrationAllowed,
            "MIGRATION_DISALLOWED"
        );

        require(
            token != address(0x0),
            "INVALID_TOKEN"
        );

        require(
            user != address(0x0),
            "INVALID_USER"
        );

        require(
            amount > 0,
            "INVALID_AMOUNT"
        );

        require(
            IExchangeUpgradability(msg.sender).VERSION() < VERSION,
            "INVALID_VERSION"
        );

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        balances[token][user] = balances[token][user].add(amount);
    }
}
