# ExchangeStorage.sol

## Functions

### getBalance\(\)

Returns the balance of a token for a certain user.

```text
function getBalance(address user, address token) public view returns (uint256)
```

| parameter | type |
| :--- | :--- |
| user | address |
| token | address |

### getBalances\(\)

Returns the balance of multiple tokens for a certain user.

```text
function getBalances(address user, address[] memory token) public view
returns(uint256[] memory balanceArray)
```

| parameter | type |
| :--- | :--- |
| user | address |
| token | array of addresses |
| balanceArray | array of uint256 |

### getFill\(\)

Returns the filled amount of order  specified by 'orderHash'.

```text
function getFill(bytes32 orderHash) public view returns (uint256)
```

| parameter | type |
| :--- | :--- |
| orderHash | bytes32 |

### getFills\(\)

Returns the filled amount of multiple orders specified by the 'orderHash' array.

```text
function getFills(bytes32[] memory orderHash) public view
returns (uint256[] memory filledArray)
```

| parameter | type |
| :--- | :--- |
| orderHash | array of bytes32 |
| filledArray | array of uint256 |

### getCancel\(\)

Returns true or false depending on if 'orderHash' is or is not canceled.

```text
function getCancel(bytes32 orderHash) public view returns (bool)
```

| parameter | type |
| :--- | :--- |
| orderHash | array of bytes32 |

### getCancels\(\)

Returns array of true or false depending on if orders specified by 'orderHash' array are or are not canceled.

```text
function getCancels(bytes32[] memory orderHash) public view
returns (bool[]memory cancelledArray)
```

| parameters | type |
| :--- | :--- |
| orderHash | array of bytes32 |
| cancelledArray | array of bools |

### getReferral\(\)

Returns the referrer address of the specified user.

```text
function getReferral(address user) public view returns (address)
```

| parameters | type |
| :--- | :--- |
| user | address |

### setMakerFeeRate\(\)

Sets new rate for the received maker fee.

```text
function setMakerFeeRate(uint256 newMakerFeeRate) external onlyOwner
```

| parameter | type |
| :--- | :--- |
| newMakerFeeRate | uint256 |

### setTakerFeeRate\(\)

Sets new rate for the paid taker fee.

```text
function setTakerFeeRate(uint256 newTakerFeeRate) external onlyOwner
```

| parameter | type |
| :--- | :--- |
| newTakerFeeRate | uint256 |

### setFeeAccount\(\)

Sets new fee account.

```text
 function setFeeAccount(address newFeeAccount) external onlyOwner
```

| parameter | type |
| :--- | :--- |
| newFeeAccount | address |

