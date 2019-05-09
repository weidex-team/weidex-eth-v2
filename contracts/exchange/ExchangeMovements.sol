pragma solidity >=0.4.22 <0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "./ExchangeStorage.sol";

contract ExchangeMovements is ExchangeStorage {

    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    /**
      * @dev emitted when a deposit is received
      */
    event Deposit(
        address indexed token,
        address indexed user,
        address indexed referral,
        address beneficiary,
        uint256 amount,
        uint256 balance
    );

    /**
      * @dev emitted when a withdraw is received
      */
    event Withdraw(
        address indexed token,
        address indexed user,
        uint256 amount,
        uint256 balance
    );

    /**
      * @dev emitted when a transfer is received
      */
    event Transfer(
        address indexed token,
        address indexed user,
        address indexed beneficiary,
        uint256 amount,
        uint256 userBalance,
        uint256 beneficiaryBalance
    );

    /**
      * @dev Updates the level 2 map `balances` based on the input
      *      Note: token address is (0x0) when the deposit is for ETH
      */
    function deposit(
        address token,
        uint256 amount,
        address beneficiary,
        address referral
    )
        external
        payable
    {
        uint256 value = amount;
        address user = msg.sender;

        if(token == address(0x0)) {
            value = msg.value;
        } else {
            IERC20(token).safeTransferFrom(user, address(this), value);
        }

        balances[token][beneficiary] = balances[token][beneficiary].add(value);

        if(referrals[user] == address(0x0)) {
            referrals[user] = referral;
        }

        emit Deposit(
            token,
            user,
            referrals[user],
            beneficiary,
            value,
            balances[token][beneficiary]
        );
    }

    /**
      * @dev Updates the level 2 map `balances` based on the input
      *      Note: token address is (0x0) when the deposit is for ETH
      */
    function withdraw(
        address token,
        uint amount
    )
        external
    {
        address payable user = msg.sender;

        require(
            balances[token][user] >= amount,
            "INVALID_WITHDRAW"
        );

        balances[token][user] = balances[token][user].sub(amount);

        if (token == address(0x0)) {
            user.transfer(amount);
        } else {
            IERC20(token).safeTransfer(user, amount);
        }

        emit Withdraw(
            token,
            user,
            amount,
            balances[token][user]
        );
    }

    /**
      * @dev Transfer assets between two users inside the exchange. Updates the level 2 map `balances`
      */
    function transfer(
        address token,
        address to,
        uint256 amount
    )
        external
        payable
    {
        address user = msg.sender;

        require(
            balances[token][user] >= amount,
            "INVALID_TRANSFER"
        );

        balances[token][user] = balances[token][user].sub(amount);

        balances[token][to] = balances[token][to].add(amount);

        emit Transfer(
            token,
            user,
            to,
            amount,
            balances[token][user],
            balances[token][to]
        );
    }
}
