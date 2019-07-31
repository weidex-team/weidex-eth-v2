# ExchangeMovements.sol

## Events

### Deposit\(\)

This event is emitted when a **deposit is received.**

```text
event Deposit(address indexed token, address indexed user, address indexed referral, 
address beneficiary, uint256 amount, uint256 balance);
```

| parameter | type |
| :--- | :--- |
| token | address |
| user | address |
| referral | address |
| beneficiary | address |
| amount | uint256 |
| balance | uint256 |

### Withdraw\(\)

This event is emitted when a **withdraw is received**.

```text
 event Withdraw(address indexed token, address indexed user, uint256 amount,
 uint256 balance);
```

| parameter | type |
| :--- | :--- |
| token | address |
| user | address |
| amount | uint256 |
| balance | uint256 |

### Transfer\(\)

This event is emitted when a **transfer is received**.

```text
  event Transfer(address indexed token, address indexed user,
  address indexed beneficiary, uint256 amount, uint256 userBalance,
  uint256 beneficiaryBalance);
```

| parameter | type |
| :--- | :--- |
| token | address |
| user | address |
| beneficiary | address |
| amount | uint256 |
| userBalance | uint256 |
| beneficiaryBalance | uint256 |

## Functions

### deposit\(\)

This function **updates the 'balances' map** based on the input. **Note**: If the deposit is for ETH the token address is \(0x0\).

```text
 function deposit(address token, uint256 amount, address beneficiary,
 address referral) public payable
```

| parameter | type |
| :--- | :--- |
| token | address |
| amount | uint256 |
| beneficiary | address |
| referral | address |

### withdraw\(\)

This function **updates the 'balances' map** based on the input. **Note**: If the withdraw is for ETH the token address is \(0x0\).

```text
 function withdraw(address token, uint amount) public
```

| parameter | type |
| :--- | :--- |
| token | address |
| amount | uint |

### transfer\(\)

This is a function used for the **transfer of assets** between two users **inside** the exchange.

```text
 function transfer(address token, address to, uint256 amount) external payable
```

| parameter | type |
| :--- | :--- |
| token | address |
| to | address |
| amount | uint256 |

