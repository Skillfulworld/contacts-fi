// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @dev Minimal ERC-20 mock for SettleXPoints tests.
///      `transferFromShouldSucceed` is toggled to simulate a failed transferFrom.
contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 public totalSupply;

    /// @dev When false, transferFrom returns false (simulates low-level failure).
    bool public transferFromShouldSucceed = true;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    // ── configuration helpers ────────────────────────────────────────────────

    function setTransferFromResult(bool succeed) external {
        transferFromShouldSucceed = succeed;
    }

    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        totalSupply += amount;
    }

    // ── ERC-20 surface ───────────────────────────────────────────────────────

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(_balances[msg.sender] >= amount, "MockERC20: insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (!transferFromShouldSucceed) return false;
        // For test purposes, bypass allowance checks — the contract just needs funds.
        if (_balances[from] >= amount) {
            _balances[from] -= amount;
            _balances[to] += amount;
        }
        return true;
    }
}
