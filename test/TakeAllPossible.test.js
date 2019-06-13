const WeiDexContract = artifacts.require("WeiDex");
const TokenContract = artifacts.require("SimpleToken");

const { constants, shouldFail } = require("openzeppelin-test-helpers");

const { signMessage } = require("./utils/signer");
const { getDefaultOrder, getInvalidOrder } = require("./utils/order");

const { ZERO_ADDRESS } = constants;

const Deposit = require("./utils/deposit");

const methodArray = require("./utils/contractMethods");

contract("WeiDex", function([_, maker, taker]) {
  let contract;
  let token;
  let validOrder;
  let invalidOrder;
  let deposit;
  let takerBalanceBefore;
  let takerBalanceAfter;
  let makerBalanceBefore;
  let makerBalanceAfter;
  let validOrderTakerReceivedAmount;
  let invalidOrderTakerReceivedAmount;

  context("Batch trade all possible", function() {
    before(async function() {
      contract = await WeiDexContract.new();

      token = await TokenContract.new();
      deposit = new Deposit(contract, token);

      await deposit.depositEth(taker, ZERO_ADDRESS, "90");
      await deposit.depositTokens(maker, ZERO_ADDRESS, "2000");

      validOrder = await getDefaultOrder(maker, taker, token);
      invalidOrder = await getInvalidOrder(maker, taker, token);

      validOrderTakerReceivedAmount = validOrder[0]
        .mul(validOrder[2])
        .div(validOrder[1]);
      invalidOrderTakerReceivedAmount = invalidOrder[0]
        .mul(invalidOrder[2])
        .div(invalidOrder[1]);
    });

    it("should trade only the valid orders", async function() {
      const validOrderHash = await contract.getHash(validOrder);
      const invalidOrderHash = await contract.getHash(invalidOrder);
      const validOrderSig = await signMessage(maker, validOrderHash);
      const invalidOrderSig = await signMessage(maker, invalidOrderHash);

      takerBalanceBefore = {
        eth: await contract.getBalance(taker, ZERO_ADDRESS),
        token: await contract.getBalance(taker, token.address)
      };

      makerBalanceBefore = {
        eth: await contract.getBalance(maker, ZERO_ADDRESS),
        token: await contract.getBalance(maker, token.address)
      };

      contract.takeAllPossible(
        [validOrder, invalidOrder],
        [validOrderSig, invalidOrderSig],
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
        makerBalanceBefore.eth.add(validOrder[2]).toString()
      );
    });

    it("should update maker Token balance", async function() {
      expect(makerBalanceAfter.token.toString()).to.be.eq(
        makerBalanceBefore.token.sub(validOrderTakerReceivedAmount).toString()
      );
    });

    it("should update taker ETH balance", async function() {
      expect(takerBalanceAfter.eth.toString()).to.be.eq(
        takerBalanceBefore.eth.sub(validOrder[2]).toString()
      );
    });

    it("should update taker Token balance", async function() {
      expect(takerBalanceAfter.token.toString()).to.be.eq(
        takerBalanceBefore.token.add(validOrderTakerReceivedAmount).toString()
      );
    });

    it("should update orders fill state", async function() {
      const validOrderHash = await contract.getPrefixedHash(validOrder);
      const invalidOrderHash = await contract.getPrefixedHash(invalidOrder);
      const result = await contract.getFills([
        validOrderHash,
        invalidOrderHash
      ]);
      expect(result[0].toString()).to.be.eq(validOrder[1].toString());
      expect(result[1].toString()).to.be.eq("0");
    });

    it("should update orders status", async function() {
      const firstOrderResult = await contract.getOrderInfo(
        validOrderTakerReceivedAmount,
        validOrder
      );
      expect(firstOrderResult["status"]).to.be.eq("5"); // fillable status

      const secondOrderResult = await contract.getOrderInfo(
        invalidOrderTakerReceivedAmount,
        invalidOrder
      );
      expect(secondOrderResult["status"]).to.be.eq("4"); // expired status
    });
  });
});
