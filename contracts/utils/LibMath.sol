pragma solidity >=0.4.22 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract LibMath {
    using SafeMath for uint256;

    function getPartialAmount(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        internal
        pure
        returns (uint256 partialAmount)
    {
        partialAmount = numerator.mul(target).div(denominator);
    }

    function getFeeAmount(
        uint256 numerator,
        uint256 target
    )
        internal
        pure
        returns (uint256 feeAmount)
    {
        feeAmount = numerator.mul(target).div(1 ether); // todo: constants
    }
}
