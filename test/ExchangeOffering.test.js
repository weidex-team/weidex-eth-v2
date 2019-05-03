const WeiDexContract = artifacts.require("WeiDex");
const TokenContract = artifacts.require("SimpleToken");

const {
  ether,
  time,
  shouldFail,
  expectEvent,
  BN,
  constants
} = require("openzeppelin-test-helpers");

const { getDefaultCrowdsale, parseCrowdsale } = require("./utils/crowdsale");
const { ZERO_ADDRESS } = constants;
const CROWDSALE_CAP = ether("15");
const TOKEN_RATIO = new BN(100);
const VALID_BUY_AMOUNT = ether("0.5");
const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD";

contract("WeiDex", function([_, crowdsaleWallet, user, anotherUser]) {
  let contract;
  let token;
  let crowdsale;
  let buyTokensTxResult;
  let burnTokensTxResult;

  context("Initial Exchange Offering", function() {
    before(async function() {
      contract = await WeiDexContract.new();
      token = await TokenContract.new();
      const startBlock = (await time.latestBlock()).add(new BN(10));
      crowdsale = getDefaultCrowdsale(
        startBlock,
        CROWDSALE_CAP,
        crowdsaleWallet
      );
    });

    it("should register crowdsale", async function() {
      const tokenForSale = CROWDSALE_CAP.mul(TOKEN_RATIO);
      await token.mint(crowdsaleWallet, tokenForSale);
      await token.approve(contract.address, tokenForSale, {
        from: crowdsaleWallet
      });
      const result = await contract.registerCrowdsale(crowdsale, token.address);
    });

    it("should fail when crowdsale isn't started yet", async function() {
      const currentCrowdsale = await contract.crowdsales(token.address);
      const parsedCrowdsale = parseCrowdsale(currentCrowdsale);

      const result = await contract.validContribution(
        ether("0.5"),
        parsedCrowdsale,
        user,
        token.address
      );

      expect(result.toString()).to.be.eq("0"); // not opened yet

      await shouldFail.reverting.withMessage(
        contract.buyTokens(token.address, {
          from: user,
          value: ether("0.5")
        }),
        "INVALID_CONTRIBUTION"
      );

      for (let i = 0; i < 5; i++) {
        await time.advanceBlock();
      }
    });

    it("should fail on minimum contribution", async function() {
      const currentCrowdsale = await contract.crowdsales(token.address);
      const parsedCrowdsale = parseCrowdsale(currentCrowdsale);
      const result = await contract.validContribution(
        ether("0.09"),
        parsedCrowdsale,
        user,
        token.address
      );

      expect(result.toString()).to.be.eq("1"); // min contribution

      await shouldFail.reverting.withMessage(
        contract.buyTokens(token.address, {
          from: user,
          value: ether("0.09")
        }),
        "INVALID_CONTRIBUTION"
      );
    });

    it("should fail on maximum contribution", async function() {
      const currentCrowdsale = await contract.crowdsales(token.address);
      const parsedCrowdsale = parseCrowdsale(currentCrowdsale);

      const result = await contract.validContribution(
        ether("15"),
        parsedCrowdsale,
        user,
        token.address
      );

      expect(result.toString()).to.be.eq("2"); // max contribution

      await shouldFail.reverting.withMessage(
        contract.buyTokens(token.address, {
          from: user,
          value: ether("15")
        }),
        "INVALID_CONTRIBUTION"
      );
    });

    it("should buy tokens", async function() {
      const currentCrowdsale = await contract.crowdsales(token.address);
      const parsedCrowdsale = parseCrowdsale(currentCrowdsale);

      const result = await contract.validContribution(
        VALID_BUY_AMOUNT,
        parsedCrowdsale,
        user,
        token.address
      );

      expect(result.toString()).to.be.eq("4"); // valid contribution

      buyTokensTxResult = await contract.buyTokens(token.address, {
        from: user,
        value: VALID_BUY_AMOUNT
      });
    });

    it("should emit TokenPurchase event", async function() {
      const tokenAmount = VALID_BUY_AMOUNT.mul(new BN(crowdsale[4]));
      expectEvent.inLogs(buyTokensTxResult.logs, "TokenPurchase", {
        token: token.address,
        user: user,
        tokenAmount: tokenAmount,
        weiAmount: VALID_BUY_AMOUNT
      });
    });

    it("should update user balance", async function() {
      const tokenAmount = VALID_BUY_AMOUNT.mul(new BN(crowdsale[4]));
      const userBalance = await contract.getBalance(user, token.address);
      expect(userBalance.toString()).to.be.eq(tokenAmount.toString());
    });

    it("should update crowdsale wallet balance", async function() {
      const walletBalance = await contract.getBalance(
        crowdsaleWallet,
        ZERO_ADDRESS
      );
      expect(walletBalance.toString()).to.be.eq(VALID_BUY_AMOUNT.toString());
    });

    it("should update user contribution", async function() {
      const userContributions = await contract.contributions(
        token.address,
        user
      );
      expect(userContributions.toString()).to.be.eq(
        VALID_BUY_AMOUNT.toString()
      );
    });

    it("should update crowdsale stats", async function() {
      const tokenAmount = VALID_BUY_AMOUNT.mul(new BN(crowdsale[4]));
      const updatedCrowdsale = await contract.crowdsales(token.address);
      expect(updatedCrowdsale.leftAmount.toString()).to.be.eq(
        new BN(crowdsale[3]).sub(tokenAmount).toString()
      );

      expect(updatedCrowdsale.weiRaised.toString()).to.be.eq(
        VALID_BUY_AMOUNT.toString()
      );
    });

    it("should fail on max contribution", async function() {
      const currentCrowdsale = await contract.crowdsales(token.address);
      const parsedCrowdsale = parseCrowdsale(currentCrowdsale);

      const result = await contract.validContribution(
        ether("9.6"),
        parsedCrowdsale,
        user,
        token.address
      );

      expect(result.toString()).to.be.eq("2"); // max contribution

      await shouldFail.reverting.withMessage(
        contract.buyTokens(token.address, {
          from: user,
          value: ether("9.6")
        }),
        "INVALID_CONTRIBUTION"
      );
    });

    it("should buy all tokens", async function() {
      await contract.buyTokens(token.address, {
        from: user,
        value: ether("9.5")
      });

      await contract.buyTokens(token.address, {
        from: anotherUser,
        value: ether("5")
      });
    });

    it("should update users contribution", async function() {
      const userContributions = await contract.contributions(
        token.address,
        user
      );

      expect(userContributions.toString()).to.be.eq(ether("10").toString());

      const anotherUserContributions = await contract.contributions(
        token.address,
        anotherUser
      );

      expect(anotherUserContributions.toString()).to.be.eq(
        ether("5").toString()
      );
    });

    it("should update users balance", async function() {
      const userBalance = await contract.getBalance(user, token.address);

      expect(userBalance.toString()).to.be.eq(ether("1000").toString());

      const anotherUserBalance = await contract.getBalance(
        anotherUser,
        token.address
      );

      expect(anotherUserBalance.toString()).to.be.eq(ether("500").toString());
    });

    it("should update wallet balance", async function() {
      const walletBalance = await contract.getBalance(
        crowdsaleWallet,
        ZERO_ADDRESS
      );
      expect(walletBalance.toString()).to.be.eq(ether("15").toString());
    });

    it("should update crowdsale stats", async function() {
      const updatedCrowdsale = await contract.crowdsales(token.address);
      expect(updatedCrowdsale.leftAmount.toString()).to.be.eq("0");
      expect(updatedCrowdsale.weiRaised.toString()).to.be.eq(
        ether("15").toString()
      );
    });

    it("should fail after hard cap reached", async function() {
      const currentCrowdsale = await contract.crowdsales(token.address);
      const parsedCrowdsale = parseCrowdsale(currentCrowdsale);

      const result = await contract.validContribution(
        ether("1"),
        parsedCrowdsale,
        anotherUser,
        token.address
      );

      expect(result.toString()).to.be.eq("3"); // hardcap reached

      await shouldFail.reverting.withMessage(
        contract.buyTokens(token.address, {
          from: user,
          value: ether("1")
        }),
        "INVALID_CONTRIBUTION"
      );
    });

    it("should fail to burn when still active", async function() {
      await shouldFail.reverting.withMessage(
        contract.burnTokensWhenFinished(token.address),
        "CROWDSALE_NOT_FINISHED_YET"
      );
    });

    it("should be able to burn once crowdsale is over", async function() {
      for (let i = 0; i < 1000; i++) {
        await time.advanceBlock();
      }

      const currentCrowdsale = await contract.crowdsales(token.address);
      const parsedCrowdsale = parseCrowdsale(currentCrowdsale);

      const result = await contract.validContribution(
        ether("1"),
        parsedCrowdsale,
        anotherUser,
        token.address
      );

      expect(result.toString()).to.be.eq("0"); // crowdsale finished

      burnTokensTxResult = await contract.burnTokensWhenFinished(token.address);
    });

    it("should emit token burn event", async function() {
      const currentCrowdsale = await contract.crowdsales(token.address);

      expectEvent.inLogs(burnTokensTxResult.logs, "TokenBurned", {
        token: token.address,
        tokenAmount: currentCrowdsale.leftAmount.toString()
      });
    });

    it("should emit token transfer event", async function() {
      const currentCrowdsale = await contract.crowdsales(token.address);

      const result = await token.getPastEvents("Transfer", {
        fromBlock: 1022,
        toBlock: "latest"
      });

      expect(result[0].args.from).to.be.eq(contract.address);
      expect(result[0].args.to).to.be.eq(BURN_ADDRESS);
      expect(result[0].args.value.toString()).to.be.eq(
        currentCrowdsale.leftAmount.toString()
      );
    });
  });
});
