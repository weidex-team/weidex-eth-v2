pragma solidity >=0.4.22 <0.6.0;
pragma experimental ABIEncoderV2;

import "./Exchange.sol";
import "./ExchangeSwap.sol";
import "./ExchangeKyberProxy.sol";
import "./ExchangeBatchTrade.sol";
import "./ExchangeMovements.sol";
import "./ExchangeUpgradability.sol";
import "./ExchangeOffering.sol";

contract WeiDex is
    Exchange,
    ExchangeKyberProxy,
    ExchangeBatchTrade,
    ExchangeMovements,
    ExchangeUpgradability,
    ExchangeOffering,
    ExchangeSwap
{
    function () external payable { }
}
