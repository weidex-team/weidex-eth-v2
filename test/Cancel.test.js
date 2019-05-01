const WeiDexContract = artifacts.require("WeiDex");
const TokenContract = artifacts.require("SimpleToken");

const {
    constants,
    ether,
    time,
    expectEvent,
    BN,
    shouldFail
} = require("openzeppelin-test-helpers");

const { signMessage } = require("./utils/signer");

const { ZERO_ADDRESS } = constants;

const Deposit = require("./utils/deposit");

contract("WeiDex", function ([_, maker, taker]) {
    let contract;
    let token;
    let order;
    let deposit;
    let takerReceivedAmount;
    let orderHash;
    let signature;

    context("Cancel", function () {
        before(async function () {
            contract = await WeiDexContract.new();
            token = await TokenContract.new();
            deposit = new Deposit(contract, token);

            await deposit.depositEth(taker, ZERO_ADDRESS, "10");
            await deposit.depositTokens(maker, ZERO_ADDRESS, "200");

            order = [
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

            takerReceivedAmount = order[0].mul(order[2]).div(order[1]);
            orderHash = await contract.getHash(order);
            signature = await signMessage(maker, orderHash);
        });

        it("should cancel order successfully", async function () {
            const orderInfo = await contract.getOrderInfo(takerReceivedAmount, order);
            expect(orderInfo["status"]).to.be.eq("3"); // fillable status

            tradeTxResult = await contract.cancelSingleOrder(order, signature, {
                from: maker
            });
        });

        it("should emit cancel event successfully", async function () {
            const prefixedHash = await contract.getPrefixedHash(order);
            expectEvent.inLogs(tradeTxResult.logs, "Cancel", {
                makerBuyToken: order[8],
                makerSellToken: order[7],
                maker: maker,
                orderHash: prefixedHash
            });
        });

        it("should update order status", async function () {
            const orderInfo = await contract.getOrderInfo(takerReceivedAmount, order);
            expect(orderInfo["status"]).to.be.eq("6"); // cancel status
        });

        it("should update cancel status", async function () {
            const prefixedHash = await contract.getPrefixedHash(order);
            const cancelled = await contract.getCancel(prefixedHash);
            expect(cancelled).to.be.eq(true); // cancel status
        });

        it("should fail when maker is invalid", async function () {
            await shouldFail.reverting.withMessage(
                contract.cancelSingleOrder(order, signature, { from: taker }),
                "INVALID_SIGNER"
            );
        });

        it("should fail on trade order", async function () {
            await shouldFail.reverting.withMessage(
                contract.trade(order, signature, { from: taker }),
                "INVALID_ORDER"
            );
        });
    });
});
