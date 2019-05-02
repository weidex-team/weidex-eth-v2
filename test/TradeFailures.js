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

contract("WeiDex", function([_, maker, taker]) {
  let contract;
  let token;
  let order;
  let deposit;
  let takerReceivedAmount;
  let orderHash;
  let signature;

  context("Trade failures", function() {
    before(async function() {
      contract = await WeiDexContract.new();
      token = await TokenContract.new();
      deposit = new Deposit(contract, token);

      order = [
        (makerSellAmount = ether("100")),
        (makerBuyAmount = ether("1")),
        (takerSellAmount = ether("1")),
        (salt = new Date().getTime()),
        (expiration = await time.latestBlock()),
        taker,
        maker,
        (makerSellToken = token.address),
        (makerBuyToken = ZERO_ADDRESS)
      ];
      takerReceivedAmount = order[0].mul(order[2]).div(order[1]);
      orderHash = await contract.getHash(order);
      signature = await signMessage(maker, orderHash);
    });

    it("should fail on taker balance", async function() {
      const result = await contract.getOrderInfo(takerReceivedAmount, order);
      expect(result["status"]).to.be.eq("1"); // invalid taker amount

      await shouldFail.reverting.withMessage(
        contract.trade(order, signature, { from: taker }),
        "INVALID_ORDER"
      );

      await deposit.depositEth(taker, ZERO_ADDRESS, "10");
    });

    it("should fail on maker balance", async function() {
      const result = await contract.getOrderInfo(takerReceivedAmount, order);
      expect(result["status"]).to.be.eq("2"); // invalid maker amount

      await shouldFail.reverting.withMessage(
        contract.trade(order, signature, { from: taker }),
        "INVALID_ORDER"
      );

      await deposit.depositTokens(maker, ZERO_ADDRESS, "200");
    });

    it("should fail on expiration", async function() {
      const result = await contract.getOrderInfo(takerReceivedAmount, order);
      expect(result["status"]).to.be.eq("4"); // order expired

      await shouldFail.reverting.withMessage(
        contract.trade(order, signature, { from: taker }),
        "INVALID_ORDER"
      );
    });
  });
});
