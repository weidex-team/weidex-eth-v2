const { ether, BN } = require("openzeppelin-test-helpers");


function getDefaultCrowdsale(startBlock, hardCap, wallet) {
    const crowdsale = [
        startBlock,                     // 0 startBlock
        startBlock.add(new BN(1000)),   // 1 endBlock
        hardCap.toString(),             // 2 hardCap
        hardCap.toString(),             // 3 leftAmount
        100,                            // 4 tokenRatio
        ether("0.1").toString(),        // 5 minContribution
        ether("10").toString(),         // 6 maxContribution
        0,                              // 7 weiRaised
        wallet,                         // 8 crowdsale wallet
    ]

    return crowdsale;
}

module.exports = {
    getDefaultCrowdsale
}