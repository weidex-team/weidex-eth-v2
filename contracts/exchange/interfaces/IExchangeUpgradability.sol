pragma solidity >=0.4.22 <0.6.0;

contract IExchangeUpgradability {

    uint8 public VERSION;

    event FundsMigrated(address indexed user, address indexed newExchange);
    
    function allowOrRestrictMigrations() external;

    function migrateFunds(address[] calldata tokens) external;

    function migrateEthers() private;

    function migrateTokens(address[] memory tokens) private;

    function importEthers(address user) external payable;

    function importTokens(address tokenAddress, uint256 tokenAmount, address user) external;

}
