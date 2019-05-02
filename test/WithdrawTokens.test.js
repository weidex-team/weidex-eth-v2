const WeiDexContract = artifacts.require("WeiDex");
const TokenContract = artifacts.require("SimpleToken");

const {
  ether,
  expectEvent,
  shouldFail,
  BN
} = require("openzeppelin-test-helpers");

const Deposit = require("./utils/deposit");

contract("WeiDex", function([_, beneficiary, referrer]) {
  const value = "1";
  const depositAmount = ether(value);

  let contract;
  let token;
  let balanceBeforeWithdraw;
  let balanceAfterWithdraw;
  let withdrawTxResult;

  context("Withdraw Tokens", async function() {
    before(async function() {
      contract = await WeiDexContract.new();
      token = await TokenContract.new();
      deposit = new Deposit(contract, token);
    });

    it("should withdraw successfully ethers", async function() {
      await deposit.depositTokens(beneficiary, referrer, value);

      balanceBeforeWithdraw = await contract.getBalance(
        beneficiary,
        token.address
      );

      withdrawTxResult = await contract.withdraw(token.address, depositAmount, {
        from: beneficiary
      });

      balanceAfterWithdraw = await contract.getBalance(
        beneficiary,
        token.address
      );
    });

    it("should emit withdraw event successfully", async function() {
      expectEvent.inLogs(withdrawTxResult.logs, "Withdraw", {
        token: token.address,
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
        token.address
      );

      await shouldFail(
        contract.withdraw(token.address, currentBalance.add(new BN(1)), {
          from: beneficiary
        })
      );
    });
  });
});
