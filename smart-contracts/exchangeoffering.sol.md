# ExchangeOffering.sol

## Events

### TokenPurchase\(\)

```text
event TokenPurchase(address indexed token, address indexed user,
uint256 tokenAmount, uint256 weiAmount);
```

| parameter | type |
| :--- | :--- |
| token | address |
| user | address |
| tokenAmount | uint256 |
| weiAmount | uint256 |

### TokenBurned\(\)

```text
event TokenBurned(address indexed token, uint256 tokenAmount);
```

| parameter | type |
| :--- | :--- |
| token | address |
| tokenAmount | uint256 |

## Functions

### registerCrowdsale\(\)

```text
function registerCrowdsale(Crowdsale memory crowdsale, address token) public onlyOwner
```

| parameter | type |
| :--- | :--- |
| crowdsale | Crowdsale struct |
| token | address |

### buyTokens\(\)

```text
function buyTokens(address token) public payable
```

| parameter | type |
| :--- | :--- |
| token | adress |

### burnTokensWhenFinished\(\)

```text
function burnTokensWhenFinished(address token) public
```

| parameter | type |
| :--- | :--- |
| token | address |

### validContribution\(\)

```text
function validContribution(uint256 weiAmount, Crowdsale memory crowdsale,
address user, address token)public view returns(ContributionStatus)
```

| parameter | type |
| :--- | :--- |
| weiAmount | uint256 |
| crowdsale | Crowdsale struct |
| user | address |
| token | address |

