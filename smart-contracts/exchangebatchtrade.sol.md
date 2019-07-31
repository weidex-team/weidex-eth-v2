# ExchangeBatchTrade.sol

## Functions

### cancelMultipleOrders\(\)

This function **cancels an array of orders**, but only if the message sender is **the** **same as** the original order signer.

```text
function cancelMultipleOrders(Order[] memory orders, bytes[] memory signatures) public
```

| parameter | type |
| :--- | :--- |
| orders | array of Order structs |
| signatures | array of signatures |

### takeAllOrRevert\(\)

This function executes multiple trades based on the input orders and signatures. It reverts if one or more trades fail.

```text
function takeAllOrRevert(Order[] memory orders, bytes[] memory signatures) public
```

| parameter | type |
| :--- | :--- |
| orders | array of Order structs |
| signatures | array of signatures |

### takeAllPossible\(\)

Executes multiple trades based on the input orders and signatures, but **does not** revert if one or more trades fail.

```text
function takeAllPossible(Order[] memory orders, bytes[] memory signatures) public
```

| parameter | type |
| :--- | :--- |
| orders | array of Order structs |
| signatures | array of signatures |

