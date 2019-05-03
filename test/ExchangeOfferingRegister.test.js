const WeiDexContract = artifacts.require("WeiDex");
const TokenContract = artifacts.require("SimpleToken");

const {
  ether,
  time,
  shouldFail,
  BN,
  constants
} = require("openzeppelin-test-helpers");

const { getDefaultCrowdsale } = require("./utils/crowdsale");
const { ZERO_ADDRESS } = constants;
const CROWDSALE_CAP = ether("100");
const TOKEN_RATIO = new BN(100);
const TOKENS_FOR_SALE = CROWDSALE_CAP.mul(TOKEN_RATIO);

contract("WeiDex", function([_, crowdsaleWallet]) {
  let contract;

  context("Registering Initial Exchange Offering", function() {
    before(async function() {
      contract = await WeiDexContract.new();
    });

    it("should register crowdsale", async function() {
      const token = await TokenContract.new();
      const startBlock = (await time.latestBlock()).add(new BN(10));
      const crowdsale = getDefaultCrowdsale(
        startBlock,
        CROWDSALE_CAP,
        crowdsaleWallet
      );
      await token.mint(crowdsaleWallet, TOKENS_FOR_SALE);
      await token.approve(contract.address, TOKENS_FOR_SALE, {
        from: crowdsaleWallet
      });
      await contract.registerCrowdsale(crowdsale, token.address);
    });

    it("should fail when hard cap is not approved", async function() {
      const token = await TokenContract.new();
      const startBlock = (await time.latestBlock()).add(new BN(10));
      const crowdsale = getDefaultCrowdsale(
        startBlock,
        CROWDSALE_CAP,
        crowdsaleWallet
      );
      await token.mint(crowdsaleWallet, TOKENS_FOR_SALE);
      await token.approve(contract.address, TOKENS_FOR_SALE.sub(ether("100")), {
        from: crowdsaleWallet
      });
      await shouldFail.reverting(
        contract.registerCrowdsale(crowdsale, token.address)
      );
    });

    it("should fail on register the same crowdsale", async function() {
      const token = await TokenContract.new();
      const startBlock = (await time.latestBlock()).add(new BN(10));
      const crowdsale = getDefaultCrowdsale(
        startBlock,
        CROWDSALE_CAP,
        crowdsaleWallet
      );
      await token.mint(crowdsaleWallet, TOKENS_FOR_SALE);
      await token.approve(contract.address, TOKENS_FOR_SALE, {
        from: crowdsaleWallet
      });
      await contract.registerCrowdsale(crowdsale, token.address);

      await token.mint(crowdsaleWallet, TOKENS_FOR_SALE);
      await token.approve(contract.address, TOKENS_FOR_SALE, {
        from: crowdsaleWallet
      });
      await shouldFail.reverting.withMessage(
        contract.registerCrowdsale(crowdsale, token.address),
        "CROWDSALE_ALREADY_EXISTS"
      );
    });

    it("should fail on invalid start block", async function() {
      const token = await TokenContract.new();
      const crowdsale = getDefaultCrowdsale(
        new BN(0),
        CROWDSALE_CAP,
        crowdsaleWallet
      );

      await token.mint(crowdsaleWallet, TOKENS_FOR_SALE);
      await token.approve(contract.address, TOKENS_FOR_SALE, {
        from: crowdsaleWallet
      });

      const result = await contract.getCrowdsaleStatus(crowdsale);
      expect(result.toString()).to.be.eq("0"); // invalid start block

      await shouldFail.reverting.withMessage(
        contract.registerCrowdsale(crowdsale, token.address),
        "INVALID_CROWDSALE"
      );
    });

    it("should fail on invalid end block", async function() {
      const token = await TokenContract.new();
      const startBlock = (await time.latestBlock()).add(new BN(10));
      const crowdsale = getDefaultCrowdsale(
        startBlock,
        CROWDSALE_CAP,
        crowdsaleWallet
      );
      crowdsale[1] = startBlock.sub(new BN(1));

      await token.mint(crowdsaleWallet, TOKENS_FOR_SALE);
      await token.approve(contract.address, TOKENS_FOR_SALE, {
        from: crowdsaleWallet
      });

      const result = await contract.getCrowdsaleStatus(crowdsale);
      expect(result.toString()).to.be.eq("1"); // invalid end block

      await shouldFail.reverting.withMessage(
        contract.registerCrowdsale(crowdsale, token.address),
        "INVALID_CROWDSALE"
      );
    });

    it("should fail on invalid token ratio", async function() {
      const token = await TokenContract.new();
      const startBlock = (await time.latestBlock()).add(new BN(10));
      const crowdsale = getDefaultCrowdsale(
        startBlock,
        CROWDSALE_CAP,
        crowdsaleWallet
      );
      crowdsale[4] = 0;
      await token.mint(crowdsaleWallet, TOKENS_FOR_SALE);
      await token.approve(contract.address, TOKENS_FOR_SALE, {
        from: crowdsaleWallet
      });

      const result = await contract.getCrowdsaleStatus(crowdsale);
      expect(result.toString()).to.be.eq("2"); // invalid token ratio

      await shouldFail.reverting.withMessage(
        contract.registerCrowdsale(crowdsale, token.address),
        "INVALID_CROWDSALE"
      );
    });

    it("should fail on invalid left amount", async function() {
      const token = await TokenContract.new();
      const startBlock = (await time.latestBlock()).add(new BN(10));
      const crowdsale = getDefaultCrowdsale(
        startBlock,
        CROWDSALE_CAP,
        crowdsaleWallet
      );
      crowdsale[3] = ether("9000");

      await token.mint(crowdsaleWallet, ether("10000"));
      await token.approve(contract.address, ether("10000"), {
        from: crowdsaleWallet
      });

      const result = await contract.getCrowdsaleStatus(crowdsale);
      expect(result.toString()).to.be.eq("3"); // invalid left amount

      await shouldFail.reverting.withMessage(
        contract.registerCrowdsale(crowdsale, token.address),
        "INVALID_CROWDSALE"
      );
    });

    it("should fail on invalid wallet", async function() {
      const token = await TokenContract.new();
      const startBlock = (await time.latestBlock()).add(new BN(10));
      const crowdsale = getDefaultCrowdsale(
        startBlock,
        ether("10000"),
        ZERO_ADDRESS
      );

      await token.mint(crowdsaleWallet, TOKENS_FOR_SALE);
      await token.approve(contract.address, TOKENS_FOR_SALE, {
        from: crowdsaleWallet
      });

      await shouldFail.reverting(
        contract.registerCrowdsale(crowdsale, token.address)
      );
    });

    it("should fail on when not owner", async function() {
      const token = await TokenContract.new();
      const startBlock = (await time.latestBlock()).add(new BN(10));
      const crowdsale = getDefaultCrowdsale(
        startBlock,
        CROWDSALE_CAP,
        crowdsaleWallet
      );
      await token.mint(crowdsaleWallet, TOKENS_FOR_SALE);
      await token.approve(contract.address, TOKENS_FOR_SALE, {
        from: crowdsaleWallet
      });
      await contract.registerCrowdsale(crowdsale, token.address);

      await shouldFail.reverting(
        contract.registerCrowdsale(crowdsale, token.address, {
          from: crowdsaleWallet
        })
      );
    });
  });
});
