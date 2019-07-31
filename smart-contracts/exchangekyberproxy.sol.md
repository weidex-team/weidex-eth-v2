# ExchangeKyberProxy.sol

## Functions

### kyberSwap\(\)

This function **swaps** ETH/TOKEN, TOKEN/ETH or TOKEN/TOKEN using Kyber Network reserves.

```text
function kyberSwap(uint256 givenAmount, address givenToken,
address receivedToken, bytes32 hash) public payable
```

| parameter | type |
| :--- | :--- |
| givenAmount | uint256 |
| givenToken | address |
| receivedToken | address |
| hash | bytes32 |

### kyberTrade\(\)

This function **exchanges** ETH/TOKEN, TOKEN/ETH or TOKEN/TOKEN using the internal balance mapping that keeps track of users' balances. It **requires** the user to first invoke the **deposit function**.

```text
function kyberTrade(uint256 givenAmount, address givenToken,
address receivedToken, bytes32 hash) public
```

| parameter | type |
| :--- | :--- |
| givenAmount | uint256 |
| givenToken | address |
| receivedToken | address |
| hash | bytes32 |

### getExpectedRateBatch\(\)

```text
function getExpectedRateBatch(address[] memory givenTokens,
address[] memory receivedTokens, uint256[] memory givenAmounts)
public view returns(uint256[] memory, uint256[] memory)
```

| parameters | type |
| :--- | :--- |
| givenTokens | array of addresses |
| receivedTokens | array of addresses |
| givenAmounts | array of uint256 |

