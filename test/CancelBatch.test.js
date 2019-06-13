const WeiDexContract = artifacts.require("WeiDex");
const TokenContract = artifacts.require("SimpleToken");

const { constants, shouldFail } = require("openzeppelin-test-helpers");

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
  let firstOrderTakerReceivedAmount;
  let secondOrderTakerReceivedAmount;
  let firstOrderHash;
  let firstOrderSig;
  let secondOrderHash;
  let secondOrderSig;

  context("Cancel batch orders", function() {
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

      firstOrderHash = await contract.getHash(firstOrder);
      firstOrderSig = await signMessage(maker, firstOrderHash);

      secondOrderHash = await contract.getHash(secondOrder);
      secondOrderSig = await signMessage(maker, secondOrderHash);
    });

    it("should cancel batch orders successfully", async function() {
      tradeTxResult = await contract.cancelMultipleOrders(
        [firstOrder, secondOrder],
        [firstOrderSig, secondOrderSig],
        {
          from: maker
        }
      );
    });

    it("should update orders status", async function() {
      const firstOrderInfo = await contract.getOrderInfo(
        firstOrderTakerReceivedAmount,
        firstOrder
      );
      expect(firstOrderInfo["status"]).to.be.eq("6"); // cancel status

      const secondOrderInfo = await contract.getOrderInfo(
        secondOrderTakerReceivedAmount,
        secondOrder
      );
      expect(secondOrderInfo["status"]).to.be.eq("6"); // cancel status
    });

    it("should update cancel status", async function() {
      const firstOrderPrefixedHash = await contract.getPrefixedHash(firstOrder);
      const secondOrderPrefixedHash = await contract.getPrefixedHash(
        secondOrder
      );
      const cancelled = await contract.getCancels([
        firstOrderPrefixedHash,
        secondOrderPrefixedHash
      ]);
      expect(cancelled[0]).to.be.eq(true); // cancel status
      expect(cancelled[1]).to.be.eq(true); // cancel status
    });

    it("should fail when maker is invalid", async function() {
      await shouldFail.reverting.withMessage(
        contract.cancelMultipleOrders(
          [firstOrder, secondOrder],
          [firstOrderSig, secondOrderSig],
          { from: taker }
        ),
        "INVALID_SIGNER"
      );
    });

    it("should fail on trade order", async function() {
      await shouldFail.reverting.withMessage(
        contract.trade(firstOrder, firstOrderSig, { from: taker }),
        "INVALID_TRADE"
      );

      await shouldFail.reverting.withMessage(
        contract.trade(secondOrder, secondOrderSig, { from: taker }),
        "INVALID_TRADE"
      );
    });
  });
});
