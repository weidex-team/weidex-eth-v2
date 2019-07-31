# Exchange.sol

## Events

### Trade\(\)

This event is emitted when a **trade is executed**.

```text
event Trade(address indexed makerAddress, address indexed takerAddress,
bytes32 indexed orderHash, address makerFilledAsset, address takerFilledAsset,
uint256 makerFilledAmount, uint256 takerFilledAmount, uint256 takerFeePaid,
uint256 makerFeeReceived, uint256 referralFeeReceived);
```

| parameter | type | description |
| :--- | :--- | :--- |
| makerAddress | address | address that created the order |
| takerAddress | address | address that filled the order |
| orderHash | bytes32 | hash of the order |
| makerFilledAsset | address | address of assets filled for maker |
| takerFilledAsset | address | address of assets filled for taker |
| makerFilledAmount | uint256 | amount of assets filled for maker |
| takerFilledAmount | uint256 | amount of assets filled for taker |
| takerFeePaid | uint256 | amount of fee paid by the taker |
| makerFeeReceived | uint256 | amount of fee received by the maker |
| referralFeeReceived | uint256 | amount of fee received by the referrer |

### Cancel\(\)

This event is emitted when a **cancel order is executed**.

```text
event Cancel(address indexed makerBuyToken, address makerSellToken,
address indexed maker, bytes32 indexed orderHash);
```

| parameter | type | description |
| :--- | :--- | :--- |
| makerBuyToken | address | address of asset being bought |
| makerSellToken | address | address of asset being sold  |
| maker | address | address that created the order |
| orderHash | bytes32 | hash of the order |

## Functions

### getOrderInfo\(\)

This function is used to compute the **status** of an order. It should be called **before** a contract execution is performed in order to not waste gas. 

```text
function getOrderInfo(uint256 partialAmount, Order memory order) public view 
returns (OrderInfo memory orderInfo)
```

| parameter | type |
| :--- | :--- |
| partialAmount | uint256 |
| order | Order struct |
| orderInfo | Order struct |

### trade\(\)

This function **executes a trade** based on the input order and signature, it **reverts** if order is not valid.

```text
function trade(Order memory order, bytes memory signature) public
```

| parameter | type |
| :--- | :--- |
| order | Order struct |
| signature | signature |

### cancelSignleOrder\(\)

With this function an **order is canceled**, but only if the message sender is **the same as** the original order signer.

```text
function cancelSingleOrder(Order memory order, bytes memory signature) public
```

| parameter | type |
| :--- | :--- |
| order | Order struct |
| signature | signature |

