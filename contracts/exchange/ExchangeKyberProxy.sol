pragma solidity >=0.4.22 <0.6.0;
pragma experimental ABIEncoderV2;

import "./Exchange.sol";
import "./interfaces/IKyberNetworkProxy.sol";
import "../utils/LibKyberData.sol";

import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";

contract ExchangeKyberProxy is Exchange, LibKyberData {
    using SafeERC20 for IERC20;

    /**
      * @dev The precision used for calculating the amounts - 10*18
      */
    uint256 constant internal PRECISION = 1000000000000000000;

    /**
      * @dev Max decimals allowed when calculating amounts.
      */
    uint256 constant internal MAX_DECIMALS = 18;

    /**
      * @dev Decimals of Ether.
      */
    uint256 constant internal ETH_DECIMALS = 18;

    /**
      * @dev The address that represents ETH in Kyber Network Contracts.
      */
    address constant internal KYBER_ETH_TOKEN_ADDRESS =
        address(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);

    /**
      * @dev KyberNetworkProxy contract address
      */
    IKyberNetworkProxy constant internal kyberNetworkContract =
        IKyberNetworkProxy(0x818E6FECD516Ecc3849DAf6845e3EC868087B755);

    /**
      * @dev Swaps ETH/TOKEN, TOKEN/ETH or TOKEN/TOKEN using KyberNetwork reserves.
      */
    function kyberSwap(
        uint256 givenAmount,
        address givenToken,
        address receivedToken,
        bytes32 hash
    )
        public
        payable
    {
        address taker = msg.sender;

        KyberData memory kyberData = getSwapInfo(
            givenAmount,
            givenToken,
            receivedToken,
            taker
        );

        uint256 convertedAmount = kyberNetworkContract.trade.value(kyberData.value)(
            kyberData.givenToken,
            givenAmount,
            kyberData.receivedToken,
            taker,
            kyberData.expectedReceiveAmount,
            kyberData.rate,
            feeAccount
        );

        emit Trade(
            address(kyberNetworkContract),
            taker,
            hash,
            givenToken,
            receivedToken,
            givenAmount,
            convertedAmount,
            0,
            0,
            0
        );
    }

    /**
      * @dev Exchange ETH/TOKEN, TOKEN/ETH or TOKEN/TOKEN using the internal
      * balance mapping that keeps track of user's balances. It requires user to first invoke deposit function.
      * The function relies on KyberNetworkProxy contract.
      */
    function kyberTrade(
        uint256 givenAmount,
        address givenToken,
        address receivedToken,
        bytes32 hash
    )
        public
    {
        address taker = msg.sender;

        KyberData memory kyberData = getTradeInfo(
            givenAmount,
            givenToken,
            receivedToken
        );

        balances[givenToken][taker] = balances[givenToken][taker].sub(givenAmount);

        uint256 convertedAmount = kyberNetworkContract.trade.value(kyberData.value)(
            kyberData.givenToken,
            givenAmount,
            kyberData.receivedToken,
            address(this),
            kyberData.expectedReceiveAmount,
            kyberData.rate,
            feeAccount
        );

        balances[receivedToken][taker] = balances[receivedToken][taker].add(convertedAmount);

        emit Trade(
            address(kyberNetworkContract),
            taker,
            hash,
            givenToken,
            receivedToken,
            givenAmount,
            convertedAmount,
            0,
            0,
            0
        );
    }

    /**
      * @dev Helper function to determine what is being swapped.
      */
    function getSwapInfo(
        uint256 givenAmount,
        address givenToken,
        address receivedToken,
        address taker
    )
        private
        returns(KyberData memory)
    {
        KyberData memory kyberData;
        uint256 givenTokenDecimals;
        uint256 receivedTokenDecimals;

        if(givenToken == address(0x0)) {
            require(msg.value == givenAmount, "INVALID_ETH_VALUE");

            kyberData.givenToken = KYBER_ETH_TOKEN_ADDRESS;
            kyberData.receivedToken = receivedToken;
            kyberData.value = givenAmount;

            givenTokenDecimals = ETH_DECIMALS;
            receivedTokenDecimals = IERC20(receivedToken).decimals();
        } else if(receivedToken == address(0x0)) {
            kyberData.givenToken = givenToken;
            kyberData.receivedToken = KYBER_ETH_TOKEN_ADDRESS;
            kyberData.value = 0;

            givenTokenDecimals = IERC20(givenToken).decimals();
            receivedTokenDecimals = ETH_DECIMALS;

            IERC20(givenToken).safeTransferFrom(taker, address(this), givenAmount);
            IERC20(givenToken).safeApprove(address(kyberNetworkContract), givenAmount);
        } else {
            kyberData.givenToken = givenToken;
            kyberData.receivedToken = receivedToken;
            kyberData.value = 0;

            givenTokenDecimals = IERC20(givenToken).decimals();
            receivedTokenDecimals = IERC20(receivedToken).decimals();

            IERC20(givenToken).safeTransferFrom(taker, address(this), givenAmount);
            IERC20(givenToken).safeApprove(address(kyberNetworkContract), givenAmount);
        }

        (kyberData.rate, ) = kyberNetworkContract.getExpectedRate(
            kyberData.givenToken,
            kyberData.receivedToken,
            givenAmount
        );

        kyberData.expectedReceiveAmount = calculateExpectedAmount(
            givenAmount,
            givenTokenDecimals,
            receivedTokenDecimals,
            kyberData.rate
        );

        return kyberData;
    }

    /**
      * @dev Helper function to determines what is being
        swapped using the internal balance mapping.
      */
    function getTradeInfo(
        uint256 givenAmount,
        address givenToken,
        address receivedToken
    )
        private
        returns(KyberData memory)
    {
        KyberData memory kyberData;
        uint256 givenTokenDecimals;
        uint256 receivedTokenDecimals;

        if(givenToken == address(0x0)) {
            kyberData.givenToken = KYBER_ETH_TOKEN_ADDRESS;
            kyberData.receivedToken = receivedToken;
            kyberData.value = givenAmount;

            givenTokenDecimals = ETH_DECIMALS;
            receivedTokenDecimals = IERC20(receivedToken).decimals();
        } else if(receivedToken == address(0x0)) {
            kyberData.givenToken = givenToken;
            kyberData.receivedToken = KYBER_ETH_TOKEN_ADDRESS;
            kyberData.value = 0;

            givenTokenDecimals = IERC20(givenToken).decimals();
            receivedTokenDecimals = ETH_DECIMALS;
            IERC20(givenToken).safeApprove(address(kyberNetworkContract), givenAmount);
        } else {
            kyberData.givenToken = givenToken;
            kyberData.receivedToken = receivedToken;
            kyberData.value = 0;

            givenTokenDecimals = IERC20(givenToken).decimals();
            receivedTokenDecimals = IERC20(receivedToken).decimals();
            IERC20(givenToken).safeApprove(address(kyberNetworkContract), givenAmount);
        }

        (kyberData.rate, ) = kyberNetworkContract.getExpectedRate(
            kyberData.givenToken,
            kyberData.receivedToken,
            givenAmount
        );

        kyberData.expectedReceiveAmount = calculateExpectedAmount(
            givenAmount,
            givenTokenDecimals,
            receivedTokenDecimals,
            kyberData.rate
        );

        return kyberData;
    }

    function getExpectedRateBatch(
        address[] memory givenTokens,
        address[] memory receivedTokens,
        uint256[] memory givenAmounts
    )
        public
        view
        returns(uint256[] memory, uint256[] memory)
    {
        uint256 size = givenTokens.length;
        uint256[] memory expectedRates = new uint256[](size);
        uint256[] memory slippageRates = new uint256[](size);

        for(uint256 index = 0; index < size; index++) {
            (expectedRates[index], slippageRates[index]) = kyberNetworkContract.getExpectedRate(
                givenTokens[index],
                receivedTokens[index],
                givenAmounts[index]
            );
        }

       return (expectedRates, slippageRates);
    }

    /**
      * @dev Helper function to get the expected amount based on
      * the given token and the rate from the KyberNetworkProxy
      */
    function calculateExpectedAmount(
        uint256 givenAmount,
        uint256 givenDecimals,
        uint256 receivedDecimals,
        uint256 rate
    )
        internal
        pure
        returns(uint)
    {
        if (receivedDecimals >= givenDecimals) {
            require(
                (receivedDecimals - givenDecimals) <= MAX_DECIMALS,
                "MAX_DECIMALS_EXCEEDED"
            );

            return (givenAmount * rate * (10 ** (receivedDecimals - givenDecimals)) ) / PRECISION;
        } else {
            require(
                (givenDecimals - receivedDecimals) <= MAX_DECIMALS,
                "MAX_DECIMALS_EXCEEDED"
            );

            return (givenAmount * rate) / (PRECISION * (10**(givenDecimals - receivedDecimals)));
        }
    }
}
