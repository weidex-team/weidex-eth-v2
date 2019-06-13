const WeiDexContract = artifacts.require("WeiDex");
const TokenContract = artifacts.require("SimpleToken");

const { constants } = require("openzeppelin-test-helpers");

const { signMessage } = require("./utils/signer");
const { getDefaultOrder } = require("./utils/order");

const { ZERO_ADDRESS } = constants;

const Deposit = require("./utils/deposit");

contract("WeiDex", function([_, maker, taker]) {
  let contract;
  let token;
  let firstOrder;
  let secondOrder;
  let deposit;
  let takerBalanceBefore;
  let takerBalanceAfter;
  let makerBalanceBefore;
  let makerBalanceAfter;
  let firstOrderTakerReceivedAmount;
  let secondOrderTakerReceivedAmount;

  context("Batch trade all or revert", function() {
    before(async function() {
      contract = await WeiDexContract.new();
      token = await TokenContract.new();
      deposit = new Deposit(contract, token);

      await deposit.depositEth(taker, ZERO_ADDRESS, "90");
      await deposit.depositTokens(maker, ZERO_ADDRESS, "2000");

      firstOrder = await getDefaultOrder(maker, taker, token);
      secondOrder = await getDefaultOrder(maker, taker, token);

      firstOrderTakerReceivedAmount = firstOrder[0]
        .mul(firstOrder[2])
        .div(firstOrder[1]);
      secondOrderTakerReceivedAmount = secondOrder[0]
        .mul(secondOrder[2])
        .div(secondOrder[1]);
    });

    it("should trade successfully two orders", async function() {
      const firstOrderHash = await contract.getHash(firstOrder);
      const secondOrderHash = await contract.getHash(secondOrder);
      const firstOrderSig = await signMessage(maker, firstOrderHash);
      const secondOrderSig = await signMessage(maker, secondOrderHash);

      takerBalanceBefore = {
        eth: await contract.getBalance(taker, ZERO_ADDRESS),
        token: await contract.getBalance(taker, token.address)
      };

      makerBalanceBefore = {
        eth: await contract.getBalance(maker, ZERO_ADDRESS),
        token: await contract.getBalance(maker, token.address)
      };

      await contract.takeAllOrRevert(
        [firstOrder, secondOrder],
        [firstOrderSig, secondOrderSig],
        {
          from: taker
        }
      );

      takerBalanceAfter = {
        eth: await contract.getBalance(taker, ZERO_ADDRESS),
        token: await contract.getBalance(taker, token.address)
      };

      makerBalanceAfter = {
        eth: await contract.getBalance(maker, ZERO_ADDRESS),
        token: await contract.getBalance(maker, token.address)
      };
    });

    it("should update maker ETH balance", async function() {
      expect(makerBalanceAfter.eth.toString()).to.be.eq(
        makerBalanceBefore.eth
          .add(firstOrder[2])
          .add(secondOrder[2])
          .toString()
      );
    });

    it("should update maker Token balance", async function() {
      expect(makerBalanceAfter.token.toString()).to.be.eq(
        makerBalanceBefore.token
          .sub(firstOrderTakerReceivedAmount)
          .sub(secondOrderTakerReceivedAmount)
          .toString()
      );
    });

    it("should update taker ETH balance", async function() {
      expect(takerBalanceAfter.eth.toString()).to.be.eq(
        takerBalanceBefore.eth
          .sub(firstOrder[2])
          .sub(secondOrder[2])
          .toString()
      );
    });

    it("should update taker Token balance", async function() {
      expect(takerBalanceAfter.token.toString()).to.be.eq(
        takerBalanceBefore.token
          .add(firstOrderTakerReceivedAmount)
          .add(secondOrderTakerReceivedAmount)
          .toString()
      );
    });

    it("should update orders fill state", async function() {
      const firstOrderHash = await contract.getPrefixedHash(firstOrder);
      const secondOrderHash = await contract.getPrefixedHash(secondOrder);
      const result = await contract.getFills([firstOrderHash, secondOrderHash]);
      expect(result[0].toString()).to.be.eq(firstOrder[1].toString());
      expect(result[1].toString()).to.be.eq(secondOrder[1].toString());
    });

    it("should update orders status", async function() {
      const firstOrderResult = await contract.getOrderInfo(
        firstOrderTakerReceivedAmount,
        firstOrder
      );
      expect(firstOrderResult["status"]).to.be.eq("5"); // fully filled status

      const secondOrderResult = await contract.getOrderInfo(
        secondOrderTakerReceivedAmount,
        secondOrder
      );
      expect(secondOrderResult["status"]).to.be.eq("5"); // fully filled status
    });
  });
});
