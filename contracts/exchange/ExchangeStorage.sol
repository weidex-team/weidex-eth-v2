pragma solidity >=0.4.22 <0.6.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract ExchangeStorage is Ownable {

    /**
      * @dev The minimum fee rate that the maker will receive
      * Note: 20% = 20 * 10^16
      */
    uint256 constant internal minMakerFeeRate = 200000000000000000;

    /**
      * @dev The maximum fee rate that the maker will receive
      * Note: 90% = 90 * 10^16
      */
    uint256 constant internal maxMakerFeeRate = 900000000000000000;

    /**
      * @dev The minimum fee rate that the taker will pay
      * Note: 0.1% = 0.1 * 10^16
      */
    uint256 constant internal minTakerFeeRate = 1000000000000000;

    /**
      * @dev The maximum fee rate that the taker will pay
      * Note: 1% = 1 * 10^16
      */
    uint256 constant internal maxTakerFeeRate = 10000000000000000;

    /**
      * @dev The referrer will receive 10% from each taker fee.
      * Note: 10% = 10 * 10^16
      */
    uint256 constant internal referralFeeRate = 100000000000000000;

    /**
      * @dev The amount of percentage the maker will receive from each taker fee.
      * Note: Initially: 50% = 50 * 10^16
      */
    uint256 public makerFeeRate;

    /**
      * @dev The amount of percentage the will pay for taking an order.
      * Note: Initially: 0.2% = 0.2 * 10^16
      */
    uint256 public takerFeeRate;

    /**
      * @dev 2-level map: tokenAddress -> userAddress -> balance
      */
    mapping(address => mapping(address => uint256)) internal balances;

    /**
      * @dev map: orderHash -> filled amount
      */
    mapping(bytes32 => uint256) internal filled;

    /**
      * @dev map: orderHash -> isCancelled
      */
    mapping(bytes32 => bool) internal cancelled;

    /**
      * @dev map: user -> userReferrer
      */
    mapping(address => address) internal referrals;

    /**
      * @dev The address where all exchange fees (0,08%) are kept.
      * Node: multisig wallet
      */
    address public feeAccount;

    /**
      * @return return the balance of `token` for certain `user`
      */
    function getBalance(
        address user,
        address token
    )
        public
        view
        returns (uint256)
    {
        return balances[token][user];
    }

    /**
      * @return return the balance of multiple tokens for certain `user`
      */
    function getBalances(
        address user,
        address[] memory token
    )
        public
        view
        returns(uint256[] memory balanceArray)
    {
        balanceArray = new uint256[](token.length);

        for(uint256 index = 0; index < token.length; index++) {
            balanceArray[index] = balances[token[index]][user];
        }
    }

    /**
      * @return return the filled amount of order specified by `orderHash`
      */
    function getFill(
        bytes32 orderHash
    )
        public
        view
        returns (uint256)
    {
        return filled[orderHash];
    }

    /**
      * @return return the filled amount of multple orders specified by `orderHash` array
      */
    function getFills(
        bytes32[] memory orderHash
    )
        public
        view
        returns (uint256[] memory filledArray)
    {
        filledArray = new uint256[](orderHash.length);

        for(uint256 index = 0; index < orderHash.length; index++) {
            filledArray[index] = filled[orderHash[index]];
        }
    }

    /**
      * @return return true(false) if order specified by `orderHash` is(not) cancelled
      */
    function getCancel(
        bytes32 orderHash
    )
        public
        view
        returns (bool)
    {
        return cancelled[orderHash];
    }

    /**
      * @return return array of true(false) if orders specified by `orderHash` array are(not) cancelled
      */
    function getCancels(
        bytes32[] memory orderHash
    )
        public
        view
        returns (bool[]memory cancelledArray)
    {
        cancelledArray = new bool[](orderHash.length);

        for(uint256 index = 0; index < orderHash.length; index++) {
            cancelledArray[index] = cancelled[orderHash[index]];
        }
    }

    /**
      * @return return the referrer address of `user`
      */
    function getReferral(
        address user
    )
        public
        view
        returns (address)
    {
        return referrals[user];
    }

    /**
      * @return set new rate for the maker fee received
      */
    function setMakerFeeRate(
        uint256 newMakerFeeRate
    )
        external
        onlyOwner
    {
        require(
            newMakerFeeRate >= minMakerFeeRate &&
            newMakerFeeRate <= maxMakerFeeRate,
            "INVALID_MAKER_FEE_RATE"
        );
        makerFeeRate = newMakerFeeRate;
    }

    /**
      * @return set new rate for the taker fee paid
      */
    function setTakerFeeRate(
        uint256 newTakerFeeRate
    )
        external
        onlyOwner
    {
        require(
            newTakerFeeRate >= minTakerFeeRate &&
            newTakerFeeRate <= maxTakerFeeRate,
            "INVALID_TAKER_FEE_RATE"
        );

        takerFeeRate = newTakerFeeRate;
    }

    /**
      * @return set new fee account
      */
    function setFeeAccount(
        address newFeeAccount
    )
        external
        onlyOwner
    {
        feeAccount = newFeeAccount;
    }
}
