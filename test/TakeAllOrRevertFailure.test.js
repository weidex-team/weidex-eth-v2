const WeiDexContract = artifacts.require("WeiDex");
const TokenContract = artifacts.require("SimpleToken");

const { constants, shouldFail } = require("openzeppelin-test-helpers");

const { signMessage } = require("./utils/signer");
const { getDefaultOrder, getInvalidOrder } = require("./utils/order");

const { ZERO_ADDRESS } = constants;

const Deposit = require("./utils/deposit");

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

  context("Batch trade failure", function() {
    before(async function() {
      contract = await WeiDexContract.new();
      token = await TokenContract.new();
      deposit = new Deposit(contract, token);

      await contract.allowOrRestrictMethod(
        "0x6db281564fe9547306996d6f77552aebb6a1b3451dd77b0e3cd65337b6741ad2",
        true
      );
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

    it("should fail on invalid order", async function() {
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

      await shouldFail.reverting.withMessage(
        contract.takeAllOrRevert(
          [validOrder, invalidOrder],
          [validOrderSig, invalidOrderSig],
          "trade((uint256,uint256,uint256,uint256,uint256,address,address,address,address),bytes)",
          {
            from: taker
          }
        ),
        "INVALID_TAKEALL"
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

    it("should not update maker ETH balance", async function() {
      expect(makerBalanceAfter.eth.toString()).to.be.eq(
        makerBalanceBefore.eth.toString()
      );
    });

    it("should not update maker Token balance", async function() {
      expect(makerBalanceAfter.token.toString()).to.be.eq(
        makerBalanceBefore.token.toString()
      );
    });

    it("should not update taker ETH balance", async function() {
      expect(takerBalanceAfter.eth.toString()).to.be.eq(
        takerBalanceBefore.eth.toString()
      );
    });

    it("should not update taker Token balance", async function() {
      expect(takerBalanceAfter.token.toString()).to.be.eq(
        takerBalanceBefore.token.toString()
      );
    });

    it("should not update orders fill state", async function() {
      const validOrderHash = await contract.getPrefixedHash(validOrder);
      const invalidOrderHash = await contract.getPrefixedHash(invalidOrder);
      const result = await contract.getFills([
        validOrderHash,
        invalidOrderHash
      ]);
      expect(result[0].toString()).to.be.eq("0");
      expect(result[1].toString()).to.be.eq("0");
    });

    it("should not update orders status", async function() {
      const firstOrderResult = await contract.getOrderInfo(
        validOrderTakerReceivedAmount,
        validOrder
      );
      expect(firstOrderResult["status"]).to.be.eq("3"); // fillable status

      const secondOrderResult = await contract.getOrderInfo(
        invalidOrderTakerReceivedAmount,
        invalidOrder
      );
      expect(secondOrderResult["status"]).to.be.eq("4"); // expired status
    });
  });
});
