const WeiDexContract = artifacts.require("WeiDex");

const {
  constants,
  ether,
  expectEvent,
  shouldFail,
  BN
} = require("openzeppelin-test-helpers");
const { ZERO_ADDRESS } = constants;

const Deposit = require("./utils/deposit");

contract("WeiDex", function([_, beneficiary, referrer]) {
  const value = "1";
  const depositAmount = ether(value);

  let contract;
  let balanceBeforeWithdraw;
  let balanceAfterWithdraw;
  let withdrawTxResult;

  context("Withdraw Ethers", async function() {
    before(async function() {
      contract = await WeiDexContract.new();
      deposit = new Deposit(contract);
    });

    it("should withdraw successfully ethers", async function() {
      await deposit.depositEth(beneficiary, referrer, value);

      balanceBeforeWithdraw = await contract.getBalance(
        beneficiary,
        ZERO_ADDRESS
      );

      withdrawTxResult = await contract.withdraw(ZERO_ADDRESS, depositAmount, {
        from: beneficiary
      });

      balanceAfterWithdraw = await contract.getBalance(
        beneficiary,
        ZERO_ADDRESS
      );
    });

    it("should emit withdraw event successfully", async function() {
      expectEvent.inLogs(withdrawTxResult.logs, "Withdraw", {
        token: ZERO_ADDRESS,
        user: beneficiary,
        amount: depositAmount,
        balance: balanceBeforeWithdraw.sub(depositAmount)
      });
    });

    it("should update balance correctly", async function() {
      expect(balanceAfterWithdraw.toString()).to.be.eq(
        balanceBeforeWithdraw.sub(depositAmount).toString()
      );
    });

    it("should fail on unsufficient balance", async function() {
      const currentBalance = await contract.getBalance(
        beneficiary,
        ZERO_ADDRESS
      );

      await shouldFail(
        contract.withdraw(ZERO_ADDRESS, currentBalance.add(new BN(1)), {
          from: beneficiary
        })
      );
    });
  });
});
