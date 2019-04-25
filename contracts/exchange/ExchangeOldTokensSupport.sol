pragma solidity >=0.4.22 <0.6.0;

import "./ExchangeMovements.sol";
import "../utils/SafeToken.sol";

contract ExchangeOldTokensSupport is ExchangeMovements {
        
    /**
      * @dev This is a non-standard ERC-20. Similar to ERC-20 transfer, 
      * except it handles a False result from `transferFrom` and returns an explanatory
      * error code rather than reverting. This wrapper safely handles non-standard 
      * ERC-20 tokens that do not return a value.
      */                  
    function depositOld(
        address token,
        uint256 amount,
        address beneficiary,
        address referral
    )
        external
    {
        address user = msg.sender;

        SafeOldERC20.transferFrom(token, user, address(this), amount);

        balances[token][beneficiary] = balances[token][beneficiary].add(amount);

        if(referrals[user] != address(0x0)) {
            referrals[user] = referral;
        }

        emit Deposit(
            token,
            user,
            referral,
            beneficiary,
            amount,
            balances[token][beneficiary]
        );
    }

    /**
      * @dev Similar to ERC20 transfer, except it handles a False result from `transfer` and returns an explanatory
      * error code rather than reverting. If caller has not called checked protocol's balance, this may revert due to
      * insufficient cash held in this contract. If caller has checked protocol's balance prior to this call, and verified
      * it is >= amount, this should not revert in normal conditions.
      */                  
    function withdrawOld(
        address token,
        uint amount
    )
        external
    {
        address user = msg.sender;

        require(
            balances[token][user] >= amount,
            "INVALID_WITHDRAW"
        );

        balances[token][user] = balances[token][user].sub(amount);

        SafeOldERC20.transfer(token,user, amount);

        emit Withdraw(
            token,
            user,
            amount,
            balances[token][user]
        );
    }
}
