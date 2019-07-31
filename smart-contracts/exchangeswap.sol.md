# ExchangeSwap.sol

## Functions

### swapFill\(\)

This function is used to **spaw** ETH/TOKEN, TOKEN/ETH or TOKEN/TOKEN using **off-chain signed messages**. The flow of the function is Desposit --&gt; Trade --&gt; Withdraw to allow users to **directly take liquidity** without the need of manual deposit and withdraw.

```text
function swapFill(Order[] memory orders, bytes[] memory signatures,
uint256 givenAmount, address givenToken,address receivedToken,
address referral) public payable
```

| parameter | type |
| :--- | :--- |
| orders | array of Order struct |
| signatures | array of bytes |
| givenAmount | uint256 |
| givenToken | address |
| receivedToken | address |
| referral | address |

