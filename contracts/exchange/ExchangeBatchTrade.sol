pragma solidity >=0.4.22 <0.6.0;
pragma experimental ABIEncoderV2;

import "./Exchange.sol";

contract ExchangeBatchTrade is Exchange {

    /**
      * @dev Cancel an array of orders if msg.sender is the order signer.
      */
    function cancelMultipleOrders(
        Order[] memory orders,
        bytes[] memory signatures
    )
        public
    {
        for (uint256 index = 0; index < orders.length; index++) {
            cancelSingleOrder(
                orders[index],
                signatures[index]
            );
        }
    }

    /**
      * @dev Execute multiple trades based on the input orders and signatures.
      * Note: reverts of one or more trades fail.
      */
    function takeAllOrRevert(
        Order[] memory orders,
        bytes[] memory signatures
    )
        public
    {
        for (uint256 index = 0; index < orders.length; index++) {
            bool result = _trade(orders[index], signatures[index]);
            require(result, "INVALID_TAKEALL");
        }
    }

    /**
      * @dev Execute multiple trades based on the input orders and signatures.
      * Note: does not revert if one or more trades fail.
      */
    function takeAllPossible(
        Order[] memory orders,
        bytes[] memory signatures
    )
        public
    {
        for (uint256 index = 0; index < orders.length; index++) {
            _trade(orders[index], signatures[index]);
        }
    }
}