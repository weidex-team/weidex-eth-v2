const {
  constants,
  ether,
  expectEvent,
  shouldFail,
  BN
} = require("openzeppelin-test-helpers");
const { ZERO_ADDRESS } = constants;

const WeiDexContract = artifacts.require("WeiDex");

contract("WeiDex", function([_, user, beneficiary]) {
  const depositAmount = ether("1");
  const transferAmount = ether("0.5");

  let transferTxResult;
  let contract;

  context("Transfer", async function() {
    before(async function() {
      contract = await WeiDexContract.new();
    });

    it("should transfer successfully", async function() {
      await contract.deposit(ZERO_ADDRESS, depositAmount, user, beneficiary, {
        value: depositAmount,
        from: user
      });

      transferTxResult = await contract.transfer(
        ZERO_ADDRESS,
        beneficiary,
        transferAmount,
        {
          from: user
        }
      );
    });

    it("should emit transfer event successfully", async function() {
      expectEvent.inLogs(transferTxResult.logs, "Transfer", {
        token: ZERO_ADDRESS,
        user: user,
        beneficiary: beneficiary,
        amount: transferAmount,
        userBalance: depositAmount.sub(transferAmount),
        beneficiaryBalance: transferAmount
      });
    });

    it("should update balance correctly", async function() {
      const userBalance = await contract.getBalance(user, ZERO_ADDRESS);
      const beneficiaryBalance = await contract.getBalance(
        beneficiary,
        ZERO_ADDRESS
      );

      expect(userBalance.toString()).to.be.eq(
        depositAmount.sub(transferAmount).toString()
      );

      expect(beneficiaryBalance.toString()).to.be.eq(transferAmount.toString());
    });

    it("should fail on unsufficient balance", async function() {
      const currentBalance = await contract.getBalance(user, ZERO_ADDRESS);
      await shouldFail(
        contract.transfer(
          ZERO_ADDRESS,
          beneficiary,
          currentBalance.add(new BN(1)),
          {
            from: user
          }
        )
      );
    });
  });
});
