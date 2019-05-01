const {
    constants,
    ether,
    time,
    BN,
} = require("openzeppelin-test-helpers");

const { ZERO_ADDRESS } = constants;

async function getDefaultOrder(maker, taker, token) {
    const order = [
        (makerSellAmount = ether("100")),
        (makerBuyAmount = ether("1")),
        (takerSellAmount = ether("1")),
        (salt = new Date().getTime()),
        (expiration = (await time.latestBlock()).add(new BN(100))),
        taker,
        maker,
        (makerSellToken = token.address),
        (makerBuyToken = ZERO_ADDRESS)
    ];

    return order;
}

async function getInvalidOrder(maker, taker, token) {
    const order = [
        (makerSellAmount = ether("100")),
        (makerBuyAmount = ether("1")),
        (takerSellAmount = ether("1")),
        (salt = new Date().getTime()),
        (expiration = (await time.latestBlock())),
        taker,
        maker,
        (makerSellToken = token.address),
        (makerBuyToken = ZERO_ADDRESS)
    ];

    return order;
}

module.exports = {
    getDefaultOrder,
    getInvalidOrder
}