pragma solidity >=0.4.22 <0.6.0;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../utils/LibCrowdsale.sol";
import "./ExchangeStorage.sol";

contract ExchangeOffering is ExchangeStorage, LibCrowdsale {

    address constant internal ETH_ADDRESS = address(0);

    using SafeERC20 for IERC20;

    using SafeMath for uint256;

    mapping(address => Crowdsale) public crowdsales;

    mapping(address => mapping(address => uint256)) public contributions;

    event TokenPurchase(
        address indexed project,
        address indexed user,
        uint256 tokens,
        uint256 weiAmount
    );

    function registerCrowdsale(
        Crowdsale memory crowdsale,
        address token
    )
        public
        onlyOwner
    {
        require(
            CrowdsaleStatus.VALID == getCrowdsaleStatus(crowdsale),
            "INVALID_CROWDSALE"
        );

        require(
            crowdsales[token].wallet == address(0),
            "CROWDSALE_ALREADY_EXISTS"
        );

        IERC20(token).safeTransferFrom(crowdsale.wallet, address(this), crowdsale.hardCap);

        crowdsales[token] = crowdsale;
    }

    function buyTokens(address token)
       public
       payable
    {
        require(msg.value != 0, "INVALID_MSG_VALUE");

        uint256 weiAmount = msg.value;

        address user = msg.sender;

        Crowdsale memory crowdsale = crowdsales[token];

        require(
            ContributionStatus.VALID == validContribution(weiAmount, crowdsale, user, token),
            "INVALID_CONTRIBUTION"
        );

        uint256 purchasedTokens = weiAmount.mul(crowdsale.tokenRatio);

        crowdsale.leftAmount = crowdsale.leftAmount.sub(purchasedTokens);

        crowdsale.weiRaised = crowdsale.weiRaised.add(weiAmount);

        balances[ETH_ADDRESS][crowdsale.wallet] = balances[ETH_ADDRESS][crowdsale.wallet].add(weiAmount);

        balances[token][user] = balances[token][user].add(purchasedTokens);

        contributions[token][user] = contributions[token][user].add(weiAmount);

        crowdsales[token] = crowdsale;

        emit TokenPurchase(token, user, purchasedTokens, weiAmount);
    }

    function burnTokensWhenFinished(address token) public 
    {
        require(
            isFinished(crowdsales[token].endBlock),
            "CROWDSALE_NOT_FINISHED_YET"
        );

        uint256 leftAmount = crowdsales[token].leftAmount;

        crowdsales[token].leftAmount = 0;

        IERC20(token).safeTransfer(ETH_ADDRESS, leftAmount);
    }

    function validContribution(
        uint256 weiAmount,
        Crowdsale memory crowdsale,
        address user,
        address token
    )
        public
        view
        returns(ContributionStatus)
    {
        if (!isOpened(crowdsale.startBlock, crowdsale.endBlock)) {
            return ContributionStatus.CROWDSALE_NOT_OPEN;
        }

        if(weiAmount < crowdsale.minContribution) {
            return ContributionStatus.MIN_CONTRIBUTION;
        }

        if (contributions[token][user].add(weiAmount) > crowdsale.maxContribution) {
            return ContributionStatus.MAX_CONTRIBUTION;
        }

        if (crowdsale.hardCap < crowdsale.weiRaised.add(weiAmount)) {
            return ContributionStatus.HARDCAP_REACHED;
        }

        return ContributionStatus.VALID;
    }
}