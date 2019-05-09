pragma solidity >=0.4.22 <0.6.0;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../utils/LibMath.sol";
import "../utils/LibOrder.sol";
import "../utils/LibSignatureValidator.sol";
import "./ExchangeStorage.sol";

contract Exchange is LibMath, LibOrder, LibSignatureValidator, ExchangeStorage {

    using SafeMath for uint256;

    /**
      * @dev emitted when a trade is executed
      */
    event Trade(
        address indexed makerAddress,        // Address that created the order   
        address indexed takerAddress,        // Address that filled the order
        bytes32 indexed orderHash,           // Hash of the order
        uint256 makerFilledAmount,           // Amount of assets filled for maker
        uint256 takerFilledAmount,           // Amount of assets filled for taker
        uint256 takerFeePaid,                // Amount of fee paid by the taker
        uint256 makerFeeReceived,            // Amount of fee received by the maker
        uint256 referralFeeReceived          // Amount of fee received by the referrer
    );

    /**
      * @dev emitted when a cancel order is executed
      */
    event Cancel(
        address indexed makerBuyToken,        // Address of asset being bought. 
        address makerSellToken,               // Address of asset being sold.
        address indexed maker,                // Address that created the order
        bytes32 indexed orderHash             // Hash of the order
    );

    /**
      * @dev Compute the status of an order. 
      * Should be called before a contract execution is performet in order to not waste gas.
      * @return OrderStatus.FILLABLE if the order is valid for taking.
      * Note: See LibOrder.sol to see all statuses
      */
    function getOrderInfo(
        uint256 partialAmount,
        Order memory order
    )
        public
        view
        returns (OrderInfo memory orderInfo)
    {
        // Compute the order hash
        orderInfo.hash = getPrefixedHash(order);

        // Fetch filled amount
        orderInfo.filledAmount = filled[orderInfo.hash];

        // Check taker balance
        if(balances[order.makerBuyToken][order.taker] < order.takerSellAmount) {
            orderInfo.status = uint8(OrderStatus.INVALID_TAKER_AMOUNT);
            return orderInfo;
        }

        // Check maker balance
        if(balances[order.makerSellToken][order.maker] < partialAmount) {
            orderInfo.status = uint8(OrderStatus.INVALID_MAKER_AMOUNT);
            return orderInfo;
        }

        // Check if order is filled
        if (orderInfo.filledAmount.add(order.takerSellAmount) > order.makerBuyAmount) {
            orderInfo.status = uint8(OrderStatus.FULLY_FILLED);
            return orderInfo;
        }

        // Check for expiration
        if (block.number >= order.expiration) {
            orderInfo.status = uint8(OrderStatus.EXPIRED);
            return orderInfo;
        }

        // Check if order has been cancelled
        if (cancelled[orderInfo.hash]) {
            orderInfo.status = uint8(OrderStatus.CANCELLED);
            return orderInfo;
        }

        orderInfo.status = uint8(OrderStatus.FILLABLE);
        return orderInfo;
    }

    /**
      * @dev Execute a trade based on the input order and signature.
      */
    function trade(
        Order memory order,
        bytes memory signature
    )
        public
    {
        order.taker = msg.sender;

        uint256 takerReceivedAmount = getPartialAmount(
            order.makerSellAmount,
            order.makerBuyAmount,
            order.takerSellAmount
        );

        OrderInfo memory orderInfo = getOrderInfo(takerReceivedAmount, order);

        assertTakeOrder(orderInfo.hash, orderInfo.status, order.maker, signature);

        OrderFill memory orderFill = getOrderFillResult(takerReceivedAmount, order);

        executeTrade(order, orderFill);

        filled[orderInfo.hash] = filled[orderInfo.hash].add(order.takerSellAmount);

        emit Trade(
            order.maker, 
            order.taker, 
            orderInfo.hash,
            orderFill.makerFillAmount, 
            orderFill.takerFillAmount, 
            orderFill.takerFeePaid, 
            orderFill.makerFeeReceived,
            orderFill.referralFeeReceived
        );
    }

    /**
      * @dev Cancel an order if msg.sender is the order signer.
      */
    function cancelSingleOrder(
        Order memory order,
        bytes memory signature
    )
        public
    {
        bytes32 orderHash = getPrefixedHash(order);

        require(
            recover(orderHash, signature) == msg.sender,
            "INVALID_SIGNER"
        );

        cancelled[orderHash] = true;

        emit Cancel(
            order.makerBuyToken,
            order.makerSellToken,
            msg.sender,
            orderHash
        );
    }

    /**
      * @dev Computation of the following properties based on the order input:
      * takerFillAmount -> amount of assets received by the taker
      * makerFillAmount -> amount of assets received by the maker
      * takerFeePaid -> amount of fee paid by the taker (0.2% of takerFillAmount)
      * makerFeeReceived -> amount of fee received by the maker (50% of takerFeePaid)
      * referralFeeReceived -> amount of fee received by the taker referrer (10% of takerFeePaid)
      * exchangeFeeReceived -> amount of fee received by the exchange (40% of takerFeePaid)
      */
    function getOrderFillResult(
        uint256 takerReceivedAmount,
        Order memory order
    )
        internal
        view
        returns (OrderFill memory orderFill)
    {       
        orderFill.takerFillAmount = takerReceivedAmount;

        orderFill.makerFillAmount = order.takerSellAmount;

        // 0.2% == 0.2*10^16
        orderFill.takerFeePaid = getFeeAmount(
            takerReceivedAmount,
            takerFeeRate 
        );

        // 50% of taker fee == 50*10^16
        orderFill.makerFeeReceived = getFeeAmount(
            orderFill.takerFeePaid,
            makerFeeRate 
        );

        // 10% of taker fee == 10*10^16
        orderFill.referralFeeReceived = getFeeAmount(
            orderFill.takerFeePaid,
            referralFeeRate
        );

        // exchangeFee = (takerFeePaid - makerFeeReceived - referralFeeReceived)
        orderFill.exchangeFeeReceived = orderFill.takerFeePaid.sub(
            orderFill.makerFeeReceived).sub(
                orderFill.referralFeeReceived);

    }

    /**
      * @dev Throws when the order status is invalid or the signer is not valid.
      */
    function assertTakeOrder(
        bytes32 orderHash,
        uint8 status,
        address signer,
        bytes memory signature
    )
        internal
        pure
    {
        require(
            recover(orderHash, signature) == signer,
            "INVALID_SIGNER"
        );

        require(
            status == uint8(OrderStatus.FILLABLE),
            "INVALID_ORDER"
        );
    }

    /**
      * @dev Updates the contract state i.e. user balances
      */
    function executeTrade(
        Order memory order,
        OrderFill memory orderFill
    )
        private
    {
        uint256 makerGiveAmount = orderFill.takerFillAmount.sub(orderFill.makerFeeReceived);
        uint256 takerFillAmount = orderFill.takerFillAmount.sub(orderFill.takerFeePaid);

        address referrer = referrals[order.taker];
        address feeAddress = feeAccount;

        balances[order.makerSellToken][referrer] = balances[order.makerSellToken][referrer].add(orderFill.referralFeeReceived);
        balances[order.makerSellToken][feeAddress] = balances[order.makerSellToken][feeAddress].add(orderFill.exchangeFeeReceived);

        balances[order.makerBuyToken][order.taker] = balances[order.makerBuyToken][order.taker].sub(orderFill.makerFillAmount);
        balances[order.makerBuyToken][order.maker] = balances[order.makerBuyToken][order.maker].add(orderFill.makerFillAmount);

        balances[order.makerSellToken][order.taker] = balances[order.makerSellToken][order.taker].add(takerFillAmount);
        balances[order.makerSellToken][order.maker] = balances[order.makerSellToken][order.maker].sub(makerGiveAmount);
    }
}
