const { ether, constants } = require("openzeppelin-test-helpers");
const { ZERO_ADDRESS } = constants;

class Deposit {
  constructor(exchangeContract, tokenContract) {
    this.exchange = exchangeContract;
    this.token = tokenContract;
  }

  async deposit(who, referrer, asset, amount, value) {
    return await this.exchange.deposit(asset, amount, who, referrer, {
      value: value,
      from: who
    });
  }

  async depositEth(who, referrer, amount) {
    return await this.deposit(
      who,
      referrer,
      ZERO_ADDRESS,
      ether(amount),
      ether(amount)
    );
  }

  async depositTokens(who, referrer, amount) {
    await this.token.mint(who, ether(amount));

    await this.token.approve(this.exchange.address, ether(amount), {
      from: who
    });

    return await this.deposit(who, referrer, this.token.address, ether(amount));
  }
}

module.exports = Deposit;
