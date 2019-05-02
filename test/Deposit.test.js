const WeiDexContract = artifacts.require("WeiDex");

const { constants, ether, expectEvent } = require("openzeppelin-test-helpers");

const { ZERO_ADDRESS } = constants;

const Deposit = require("./utils/deposit");

contract("WeiDex", function([_, beneficiary, referrer]) {
  const value = "1";
  const depositAmount = ether(value);

  let depositTxResult;
  let contract;

  context("Deposit Ethers", async function() {
    before(async function() {
      contract = await WeiDexContract.new();
      deposit = new Deposit(contract);
    });

    it("should deposit successfully ethers", async function() {
      depositTxResult = await deposit.depositEth(beneficiary, referrer, value);
    });

    it("should emit deposit event successfully", async function() {
      expectEvent.inLogs(depositTxResult.logs, "Deposit", {
        token: ZERO_ADDRESS,
        user: beneficiary,
        referral: referrer,
        beneficiary: beneficiary,
        amount: depositAmount,
        balance: depositAmount
      });
    });

    it("should update balance correctly", async function() {
      const balance = await contract.getBalance(beneficiary, ZERO_ADDRESS);
      expect(balance.toString()).to.be.eq(depositAmount.toString());
    });

    it("should update referrer correctly", async function() {
      const referral = await contract.getReferral(beneficiary);
      expect(referral).to.be.eq(referrer);
    });
  });
});
