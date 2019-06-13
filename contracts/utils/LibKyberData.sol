pragma solidity >=0.4.22 <0.6.0;

contract LibKyberData {

    struct KyberData {
        uint256 expectedReceiveAmount;
        uint256 rate;
        uint256 value;
        address givenToken;
        address receivedToken;
    }


    /**
      * @dev Calculates the hash of a given and received token addresses.
      */
    function getHash(
        address givenToken,
        address receivedToken
    )
        internal
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                givenToken,
                receivedToken
            )
        );
    }
}