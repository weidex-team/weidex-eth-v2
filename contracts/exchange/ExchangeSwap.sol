pragma solidity >=0.4.22 <0.6.0;
pragma experimental ABIEncoderV2;

import "./Exchange.sol";
import "./ExchangeMovements.sol";

contract ExchangeSwap is Exchange, ExchangeMovements  {

    /**
      * @dev Swaps ETH/TOKEN, TOKEN/ETH or TOKEN/TOKEN using off-chain signed messages.
      * The flow of the function is Deposit -> Trade -> Withdraw to allow users to directly
      * take liquidity without the need of deposit and withdraw.
      */
    function swapFill(
        Order[] memory orders,
        bytes[] memory signatures,
        uint256 givenAmount,
        address givenToken,
        address receivedToken,
        address referral
    )
        public
        payable
    {
        address taker = msg.sender;

        uint256 balanceGivenBefore = balances[givenToken][taker];
        uint256 balanceReceivedBefore = balances[receivedToken][taker];

        deposit(givenToken, givenAmount, taker, referral);

        for (uint256 index = 0; index < orders.length; index++) {
            require(orders[index].makerBuyToken == givenToken, "GIVEN_TOKEN");
            require(orders[index].makerSellToken == receivedToken, "RECEIVED_TOKEN");

            _trade(orders[index], signatures[index]);
        }

        uint256 balanceGivenAfter = balances[givenToken][taker];
        uint256 balanceReceivedAfter = balances[receivedToken][taker];

        uint256 balanceGivenDelta = balanceGivenAfter.sub(balanceGivenBefore);
        uint256 balanceReceivedDelta = balanceReceivedAfter.sub(balanceReceivedBefore);

        if(balanceGivenDelta > 0) {
            withdraw(givenToken, balanceGivenDelta);
        }

        if(balanceReceivedDelta > 0) {
            withdraw(receivedToken, balanceReceivedDelta);
        }
    }
}
