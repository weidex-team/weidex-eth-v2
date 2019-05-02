pragma solidity >=0.4.22 <0.6.0;
pragma experimental ABIEncoderV2;

contract LibCrowdsale {

    struct Crowdsale {
        uint256 startBlock;
        uint256 endBlock;
        uint256 hardCap;
        uint256 leftAmount;
        uint256 tokenRatio;
        uint256 minContribution;
        uint256 maxContribution;
        uint256 weiRaised;
        address wallet;
    }

    enum ContributionStatus {
        CROWDSALE_NOT_OPEN,
        MIN_CONTRIBUTION,
        MAX_CONTRIBUTION,
        HARDCAP_REACHED,
        VALID
    }

    enum CrowdsaleStatus {
        INVALID_START_BLOCK,
        INVALID_END_BLOCK,
        INVALID_TOKEN_RATIO,
        INVALID_LEFT_AMOUNT,
        VALID
    }

    function getCrowdsaleStatus(Crowdsale memory crowdsale)
        public
        view
        returns (CrowdsaleStatus)
    {

        if(crowdsale.startBlock < block.number) {
            return CrowdsaleStatus.INVALID_START_BLOCK;
        }

        if(crowdsale.endBlock < crowdsale.startBlock) {
            return CrowdsaleStatus.INVALID_END_BLOCK;
        }

        if(crowdsale.tokenRatio == 0) {
            return CrowdsaleStatus.INVALID_TOKEN_RATIO;
        }

        if(crowdsale.hardCap != crowdsale.leftAmount) {
            return CrowdsaleStatus.INVALID_LEFT_AMOUNT;
        }

        return CrowdsaleStatus.VALID;
    }

    function isOpened(uint256 startBlock, uint256 endBlock)
        internal
        view
        returns (bool)
    {
        return (block.number >= startBlock && block.number <= endBlock);
    }


    function isFinished(uint256 endBlock)
        internal
        view
        returns (bool)
    {
        return block.number > endBlock;
    }
}