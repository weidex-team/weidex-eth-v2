const WeiDexContract = artifacts.require("WeiDex");

const { shouldFail } = require("openzeppelin-test-helpers");

contract("WeiDex", function([owner, user]) {
  let contract;

  before(async function() {
    contract = await WeiDexContract.new();
  });

  context("Maker fee received", async function() {
    it("should update MakerFeeRate", async function() {
      const newMakerFeeRate = "500000000000000000";
      await contract.setMakerFeeRate(newMakerFeeRate, { from: owner });
      const result = await contract.makerFeeRate();
      expect(result.toString()).to.be.eq(newMakerFeeRate);
    });

    it("should fail when upper limit is exceeded", async function() {
      const newMakerFeeRate = "910000000000000000";
      const oldMakerFeeRate = await contract.makerFeeRate();
      await shouldFail.reverting(
        contract.setMakerFeeRate(newMakerFeeRate, { from: user })
      );
      const result = await contract.makerFeeRate();
      expect(result.toString()).to.be.eq(oldMakerFeeRate.toString());
    });

    it("should fail when lower limit is exceeded", async function() {
      const newMakerFeeRate = "190000000000000000";
      const oldMakerFeeRate = await contract.makerFeeRate();
      await shouldFail.reverting(
        contract.setMakerFeeRate(newMakerFeeRate, { from: user })
      );
      const result = await contract.makerFeeRate();
      expect(result.toString()).to.be.eq(oldMakerFeeRate.toString());
    });

    it("should fail when not owner", async function() {
      const newMakerFeeRate = "700000000000000000";
      const oldMakerFeeRate = await contract.makerFeeRate();
      await shouldFail.reverting(
        contract.setMakerFeeRate(newMakerFeeRate, { from: user })
      );
      const result = await contract.makerFeeRate();
      expect(result.toString()).to.be.eq(oldMakerFeeRate.toString());
    });
  });

  context("Taker fee paid", async function() {
    it("should update TakerFeeRate", async function() {
      const newTakerFeeRate = "5000000000000000";
      await contract.setTakerFeeRate(newTakerFeeRate, { from: owner });
      const result = await contract.takerFeeRate();
      expect(result.toString()).to.be.eq(newTakerFeeRate);
    });

    it("should fail when upper limit is exceeded", async function() {
      const newTakerFeeRate = "11000000000000000";
      const oldTakerFeeRate = await contract.takerFeeRate();
      await shouldFail.reverting(
        contract.setTakerFeeRate(newTakerFeeRate, { from: user })
      );
      const result = await contract.takerFeeRate();
      expect(result.toString()).to.be.eq(oldTakerFeeRate.toString());
    });

    it("should fail when lower limit is exceeded", async function() {
      const newTakerFeeRate = "900000000000000";
      const oldTakerFeeRate = await contract.takerFeeRate();
      await shouldFail.reverting(
        contract.setTakerFeeRate(newTakerFeeRate, { from: user })
      );
      const result = await contract.takerFeeRate();
      expect(result.toString()).to.be.eq(oldTakerFeeRate.toString());
    });

    it("should fail when not owner", async function() {
      const newTakerFeeRate = "700000000000000000";
      const oldTakerFeeRate = await contract.takerFeeRate();
      await shouldFail.reverting(
        contract.setTakerFeeRate(newTakerFeeRate, { from: user })
      );
      const result = await contract.takerFeeRate();
      expect(result.toString()).to.be.eq(oldTakerFeeRate.toString());
    });
  });
});
