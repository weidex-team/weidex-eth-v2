pragma solidity >=0.4.22 <0.6.0;

import "./OldERC20.sol";

/**
 * @title SimpleToken
 * @dev Very simple ERC20 Token used for testing
 */
contract SimpleOldToken is OldERC20 {
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}