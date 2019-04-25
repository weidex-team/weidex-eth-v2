const {
  balance,
  BN,
  constants,
  ether,
  expectEvent,
  shouldFail
} = require("openzeppelin-test-helpers");
const { ZERO_ADDRESS } = constants;

const WeiDexContract = artifacts.require("WeiDex");

contract("WeiDex", function([_, beneficiary, referrer]) {
  const value = ether("1");

  let depositTxResult;
  let contract;

  context("Deposit", async function() {
    before(async function() {
      contract = await WeiDexContract.new();
    });

    it("should deposit successfully ethers", async function() {
      depositTxResult = await contract.deposit(
        ZERO_ADDRESS,
        value,
        beneficiary,
        referrer,
        {
          value: value,
          from: beneficiary
        }
      );
    });

    it("should emit deposit event successfully", async function() {
      expectEvent.inLogs(depositTxResult.logs, "Deposit", {
        token: ZERO_ADDRESS,
        user: beneficiary,
        referral: referrer,
        beneficiary: beneficiary,
        amount: value,
        balance: value
      });
    });

    it("should update balance correctly", async function() {
      const balance = await contract.getBalance(beneficiary, ZERO_ADDRESS);
      expect(balance.toString()).to.be.eq(value.toString());
    });

    it("should update referrer correctly", async function() {
      const referral = await contract.getReferral(beneficiary);
      expect(referral).to.be.eq(referrer);
    });
  });
});
