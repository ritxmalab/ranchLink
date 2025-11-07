// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SolanaBridge
 * @notice Bridge contract for cross-chain operations with Solana
 * @dev Handles revenue distribution to Solana address via Wormhole or LayerZero
 * 
 * This contract allows:
 * - Receiving revenue on EVM chains
 * - Bridging to Solana address
 * - Unified revenue management
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SolanaBridge is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    
    // Solana address (base58 encoded, stored as bytes)
    bytes public solanaTreasury;
    
    // Bridge provider (Wormhole, LayerZero, etc.)
    address public bridgeProvider;
    
    // Events
    event RevenueBridged(
        address indexed token,
        uint256 amount,
        bytes solanaAddress,
        uint256 timestamp
    );
    
    event SolanaAddressUpdated(bytes newAddress);
    
    constructor(
        bytes memory _solanaTreasury,
        address _bridgeProvider,
        address _defaultAdmin
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _grantRole(BRIDGE_ROLE, _defaultAdmin);
        
        solanaTreasury = _solanaTreasury;
        bridgeProvider = _bridgeProvider;
    }
    
    /**
     * @notice Bridge revenue to Solana
     * @dev Sends funds to Solana address via bridge
     */
    function bridgeToSolana(
        address token, // ERC20 token (0x0 for native ETH)
        uint256 amount
    ) external payable onlyRole(BRIDGE_ROLE) whenNotPaused nonReentrant {
        if (token == address(0)) {
            require(msg.value == amount, "ETH amount mismatch");
            // Bridge native ETH to Solana
            // (Implementation depends on bridge provider)
        } else {
            IERC20(token).transferFrom(msg.sender, address(this), amount);
            // Bridge ERC20 to Solana
            // (Implementation depends on bridge provider)
        }
        
        emit RevenueBridged(token, amount, solanaTreasury, block.timestamp);
    }
    
    /**
     * @notice Update Solana treasury address
     */
    function setSolanaTreasury(bytes memory _newAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newAddress.length > 0, "Invalid address");
        solanaTreasury = _newAddress;
        emit SolanaAddressUpdated(_newAddress);
    }
    
    /**
     * @notice Update bridge provider
     */
    function setBridgeProvider(address _newProvider) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newProvider != address(0), "Invalid address");
        bridgeProvider = _newProvider;
    }
    
    /**
     * @notice Pause bridge
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause bridge
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    receive() external payable {}
}

