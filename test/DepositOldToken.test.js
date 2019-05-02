const WeiDexContract = artifacts.require("WeiDex");
const TokenContract = artifacts.require("SimpleOldToken");

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

  let depositTxResult;
  let contract;
  let token;

  context("Deposit Old Tokens", async function() {
    before(async function() {
      contract = await WeiDexContract.new();
      token = await TokenContract.new();
      deposit = new Deposit(contract, token);
    });

    it("should deposit successfully old tokens", async function() {
      depositTxResult = await deposit.depositTokens(
        beneficiary,
        referrer,
        value
      );
    });

    it("should emit deposit event successfully", async function() {
      expectEvent.inLogs(depositTxResult.logs, "Deposit", {
        token: token.address,
        user: beneficiary,
        referral: referrer,
        beneficiary: beneficiary,
        amount: depositAmount,
        balance: depositAmount
      });
    });

    it("should update balance correctly", async function() {
      const balance = await contract.getBalance(beneficiary, token.address);
      expect(balance.toString()).to.be.eq(depositAmount.toString());
    });

    it("should update referrer correctly", async function() {
      const referral = await contract.getReferral(beneficiary);
      expect(referral).to.be.eq(referrer);
    });

    it("should fail on unsufficient balance", async function() {
      const currentBalance = await token.balanceOf(beneficiary);
      await shouldFail.reverting(
        contract.deposit(
          token.address,
          currentBalance.add(new BN(1)),
          beneficiary,
          referrer,
          {
            from: beneficiary
          }
        )
      );
    });

    it("should fail on unapproved amount", async function() {
      await token.mint(referrer, ether("1000"));
      await shouldFail.reverting(
        contract.deposit(token.address, "10", referrer, beneficiary, {
          from: referrer
        })
      );
    });

    it("should succeed once approved", async function() {
      await token.approve(contract.address, ether("10"), {
        from: referrer
      });

      contract.deposit(token.address, ether("10"), referrer, beneficiary, {
        from: referrer
      });
    });

    it("should fail when approved amount was spent", async function() {
      await shouldFail.reverting(
        contract.deposit(token.address, ether("1"), referrer, beneficiary, {
          from: referrer
        })
      );
    });
  });
});
