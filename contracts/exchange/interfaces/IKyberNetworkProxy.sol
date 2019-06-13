pragma solidity >=0.4.22 <0.6.0;

contract IKyberNetworkProxy {
    function getExpectedRate(address src, address dest, uint srcQty) public view
        returns (uint expectedRate, uint slippageRate);

    function trade(
        address src,
        uint srcAmount,
        address dest,
        address destAddress,
        uint maxDestAmount,
        uint minConversionRate,
        address walletId
    ) public payable returns(uint256);
}
