# ExchangeUpgradability.sol

## Events

### FundsMigrated\(\)

This event is emitted when funds are migrated to the new exchange, specified by the address 'newExchange'.

```text
event FundsMigrated(address indexed user, address indexed newExchange);
```

| parameter | type |
| :--- | :--- |
| user | address |
| newExchange | address |

## Functions

### setNewExchangeAddress\(\)

With this function the owner can set the address of the new version of the exchange contract.

```text
function setNewExchangeAddress(address exchange) external onlyOwner
```

| parameter | type |
| :--- | :--- |
| exchange | address |

### allowOrRestrictMigrations\(\)

This function is used to **enable or disable the migrations**. Can be called only by the **owner**.

```text
function allowOrRestrictMigrations() external onlyOwner
```

### migrateFunds\(\)

This function is used to **migrate** assets of the caller to the **new exchange contract**.

```text
function migrateFunds(address[] calldata tokens) external
```

| parameter | type |
| :--- | :--- |
| tokens | array of addresses |

### importEthers\(\)

This is a helper function used to migrate users' Ethers. It should be called only from the new exchange contract.

```text
function importEthers(address user) external payable
```

| parameter | type |
| :--- | :--- |
| user | address |

### importTokens\(\)

This is a helper function used to migrate users' Tokens. It should be called only from the new exchange contract.

```text
function importTokens(address token, uint256 amount,
address user) external
```

| parameter | type |
| :--- | :--- |
| token | address |
| amount | uint256 |
| user | address |

