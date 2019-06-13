pragma solidity >=0.4.22 <0.6.0;
pragma experimental ABIEncoderV2;

contract LibOrder {

    struct Order {
        uint256 makerSellAmount;
        uint256 makerBuyAmount;
        uint256 takerSellAmount;
        uint256 salt;
        uint256 expiration;
        address taker;
        address maker;
        address makerSellToken;
        address makerBuyToken;
    }

    struct OrderInfo {
        uint256 filledAmount;
        bytes32 hash;
        uint8 status;
    }

    struct OrderFill {
        uint256 makerFillAmount;
        uint256 takerFillAmount;
        uint256 takerFeePaid;
        uint256 exchangeFeeReceived;
        uint256 referralFeeReceived;
        uint256 makerFeeReceived;
    }

    enum OrderStatus {
        INVALID_SIGNER,
        INVALID_TAKER_AMOUNT,
        INVALID_MAKER_AMOUNT,
        FILLABLE,
        EXPIRED,
        FULLY_FILLED,
        CANCELLED
    }

    function getHash(Order memory order)
        public
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                order.maker,
                order.makerSellToken,
                order.makerSellAmount,
                order.makerBuyToken,
                order.makerBuyAmount,
                order.salt,
                order.expiration
            )
        );
    }

    function getPrefixedHash(Order memory order)
        public
        pure
        returns (bytes32)
    {
        bytes32 orderHash = getHash(order);
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", orderHash));
    }
}
