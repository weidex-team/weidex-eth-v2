pragma solidity >=0.4.22 <0.6.0;

contract LibKyberData {

    struct KyberData {
        uint256 expectedReceiveAmount;
        uint256 rate;
        uint256 value;
        address givenToken;
        address receivedToken;
    }
}