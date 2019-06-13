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
  let tradeTxResult;
  let takerBalanceBefore;
  let takerBalanceAfter;
  let makerBalanceBefore;
  let makerBalanceAfter;
  let takerReceivedAmount;
  let orderHash;
  let signature;

  context("Trade without fees", function() {
    before(async function() {
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

    it("should trade successfully tokens for ETH", async function() {
      takerBalanceBefore = {
        eth: await contract.getBalance(taker, ZERO_ADDRESS),
        token: await contract.getBalance(taker, token.address)
      };

      makerBalanceBefore = {
        eth: await contract.getBalance(maker, ZERO_ADDRESS),
        token: await contract.getBalance(maker, token.address)
      };

      tradeTxResult = await contract.trade(order, signature, {
        from: taker
      });

      takerBalanceAfter = {
        eth: await contract.getBalance(taker, ZERO_ADDRESS),
        token: await contract.getBalance(taker, token.address)
      };

      makerBalanceAfter = {
        eth: await contract.getBalance(maker, ZERO_ADDRESS),
        token: await contract.getBalance(maker, token.address)
      };
    });

    it("should emit trade event successfully", async function() {
      const prefixedHash = await contract.getPrefixedHash(order);
      expectEvent.inLogs(tradeTxResult.logs, "Trade", {
        makerAddress: maker,
        takerAddress: taker,
        orderHash: prefixedHash,
        makerFilledAmount: ether("1"),
        takerFilledAmount: ether("100"),
        takerFeePaid: new BN(0),
        makerFeeReceived: new BN(0),
        referralFeeReceived: new BN(0)
      });
    });

    it("should update maker ETH balance", async function() {
      expect(makerBalanceAfter.eth.toString()).to.be.eq(
        makerBalanceBefore.eth.add(order[2]).toString()
      );
    });

    it("should update maker Token balance", async function() {
      expect(makerBalanceAfter.token.toString()).to.be.eq(
        makerBalanceBefore.token.sub(takerReceivedAmount).toString()
      );
    });

    it("should update taker ETH balance", async function() {
      expect(takerBalanceAfter.eth.toString()).to.be.eq(
        takerBalanceBefore.eth.sub(order[2]).toString()
      );
    });

    it("should update taker Token balance", async function() {
      expect(takerBalanceAfter.token.toString()).to.be.eq(
        takerBalanceBefore.token.add(takerReceivedAmount).toString()
      );
    });

    it("should update order status", async function() {
      const result = await contract.getOrderInfo(takerReceivedAmount, order);
      expect(result["status"]).to.be.eq("5"); // fully filled status
    });

    it("should update filled status", async function() {
      const prefixedHash = await contract.getPrefixedHash(order);
      const result = await contract.getFill(prefixedHash);
      expect(result.toString()).to.be.eq(order[1].toString()); // fully filled status
    });

    it("should fail when signature invalid", async function() {
      const invalidSignature = await signMessage(taker, orderHash);
      await shouldFail.reverting.withMessage(
        contract.trade(order, invalidSignature, { from: taker }),
        "INVALID_TRADE"
      );
    });

    it("should fail when order is filled", async function() {
      const result = await contract.getOrderInfo(takerReceivedAmount, order);
      expect(result["status"]).to.be.eq("5"); // fully filled status
      await shouldFail.reverting.withMessage(
        contract.trade(order, signature, { from: taker }),
        "INVALID_TRADE"
      );
    });
  });
});
