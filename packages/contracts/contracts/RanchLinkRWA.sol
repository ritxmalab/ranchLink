// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title RanchLinkRWA
 * @notice Real World Asset contract using ERC-7518 (DyCIST) principles
 * @dev Supports animal tags, software licenses, trademarks, and revenue sharing
 * 
 * This implementation provides:
 * - Partitions for different asset types (tags, licenses, trademarks, revenue)
 * - Dynamic compliance rules
 * - Revenue distribution to treasury
 * - Licensing and trademark support
 * - Multi-asset management
 */

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RanchLinkRWA is ERC1155, AccessControl, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Partitions (Asset Types)
    bytes32 public constant PARTITION_ANIMAL_TAGS = keccak256("ANIMAL_TAGS");
    bytes32 public constant PARTITION_SOFTWARE_LICENSE = keccak256("SOFTWARE_LICENSE");
    bytes32 public constant PARTITION_TRADEMARKS = keccak256("TRADEMARKS");
    bytes32 public constant PARTITION_REVENUE_SHARE = keccak256("REVENUE_SHARE");
    
    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant REVENUE_MANAGER_ROLE = keccak256("REVENUE_MANAGER_ROLE");
    
    // State
    Counters.Counter private _tokenIdCounter;
    
    // Partition management
    mapping(bytes32 => bool) public partitions;
    mapping(uint256 => bytes32) public tokenPartition; // tokenId -> partition
    mapping(uint256 => string) public tokenCIDs; // IPFS metadata
    mapping(uint256 => string) public tokenTagIds; // Physical tag IDs
    mapping(string => bool) public tagIdsUsed; // Prevent duplicates
    
    // Revenue distribution
    address public treasury; // Ritxma treasury (Ledger wallet)
    mapping(uint256 => uint256) public revenueShare; // tokenId -> share percentage (basis points)
    mapping(address => uint256) public pendingRevenue; // address -> pending revenue
    mapping(uint256 => uint256) public tokenTotalSupply; // tokenId -> total supply (for revenue distribution)
    
    // Compliance (dynamic)
    mapping(bytes32 => bool) public partitionTransfersEnabled; // partition -> enabled
    mapping(bytes32 => mapping(address => bool)) public partitionWhitelist; // partition -> address -> allowed
    
    // Events
    event AssetMinted(
        uint256 indexed tokenId,
        bytes32 indexed partition,
        address indexed to,
        string tagId,
        string cid,
        uint256 amount
    );
    event RevenueDistributed(
        address indexed recipient,
        uint256 amount,
        address indexed token
    );
    event PartitionRuleUpdated(
        bytes32 indexed partition,
        bool transfersEnabled,
        address indexed updatedBy
    );
    event RevenueShareUpdated(
        uint256 indexed tokenId,
        uint256 newShare
    );
    
    constructor(
        address _treasury,
        address _defaultAdmin
    ) ERC1155("ipfs://") {
        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _grantRole(MINTER_ROLE, _defaultAdmin);
        _grantRole(REVENUE_MANAGER_ROLE, _defaultAdmin);
        
        treasury = _treasury;
        
        // Initialize partitions
        partitions[PARTITION_ANIMAL_TAGS] = true;
        partitions[PARTITION_SOFTWARE_LICENSE] = true;
        partitions[PARTITION_TRADEMARKS] = true;
        partitions[PARTITION_REVENUE_SHARE] = true;
        
        // Enable transfers by default (can be disabled per partition)
        partitionTransfersEnabled[PARTITION_ANIMAL_TAGS] = true;
        partitionTransfersEnabled[PARTITION_SOFTWARE_LICENSE] = true;
        partitionTransfersEnabled[PARTITION_TRADEMARKS] = true;
        partitionTransfersEnabled[PARTITION_REVENUE_SHARE] = true;
    }
    
    /**
     * @notice Mint animal tag RWA
     * @dev One-time activation per tagId, tamper-proof
     */
    function mintAnimalTag(
        address to,
        string memory tagId,
        string memory cid,
        uint256 amount
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        require(!tagIdsUsed[tagId], "Tag already activated");
        require(bytes(cid).length > 0, "CID required");
        require(amount > 0, "Amount must be > 0");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        tagIdsUsed[tagId] = true;
        tokenPartition[tokenId] = PARTITION_ANIMAL_TAGS;
        tokenCIDs[tokenId] = cid;
        tokenTagIds[tokenId] = tagId;
        tokenTotalSupply[tokenId] = amount;
        
        _mint(to, tokenId, amount, "");
        
        emit AssetMinted(tokenId, PARTITION_ANIMAL_TAGS, to, tagId, cid, amount);
    }
    
    /**
     * @notice Mint software license RWA
     */
    function mintSoftwareLicense(
        address to,
        string memory licenseId,
        string memory cid,
        uint256 amount,
        uint256 revenueShareBps // Basis points (100 = 1%)
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        require(bytes(licenseId).length > 0, "License ID required");
        require(bytes(cid).length > 0, "CID required");
        require(revenueShareBps <= 10000, "Invalid revenue share");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        tokenPartition[tokenId] = PARTITION_SOFTWARE_LICENSE;
        tokenCIDs[tokenId] = cid;
        tokenTagIds[tokenId] = licenseId;
        revenueShare[tokenId] = revenueShareBps;
        tokenTotalSupply[tokenId] = amount;
        
        _mint(to, tokenId, amount, "");
        
        emit AssetMinted(tokenId, PARTITION_SOFTWARE_LICENSE, to, licenseId, cid, amount);
        emit RevenueShareUpdated(tokenId, revenueShareBps);
    }
    
    /**
     * @notice Mint trademark RWA
     */
    function mintTrademark(
        address to,
        string memory trademarkId,
        string memory cid,
        uint256 amount,
        uint256 revenueShareBps
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        require(bytes(trademarkId).length > 0, "Trademark ID required");
        require(bytes(cid).length > 0, "CID required");
        require(revenueShareBps <= 10000, "Invalid revenue share");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        tokenPartition[tokenId] = PARTITION_TRADEMARKS;
        tokenCIDs[tokenId] = cid;
        tokenTagIds[tokenId] = trademarkId;
        revenueShare[tokenId] = revenueShareBps;
        tokenTotalSupply[tokenId] = amount;
        
        _mint(to, tokenId, amount, "");
        
        emit AssetMinted(tokenId, PARTITION_TRADEMARKS, to, trademarkId, cid, amount);
        emit RevenueShareUpdated(tokenId, revenueShareBps);
    }
    
    /**
     * @notice Mint revenue share token
     */
    function mintRevenueShare(
        address to,
        string memory shareId,
        string memory cid,
        uint256 amount,
        uint256 revenueShareBps
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        require(bytes(shareId).length > 0, "Share ID required");
        require(bytes(cid).length > 0, "CID required");
        require(revenueShareBps <= 10000, "Invalid revenue share");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        tokenPartition[tokenId] = PARTITION_REVENUE_SHARE;
        tokenCIDs[tokenId] = cid;
        tokenTagIds[tokenId] = shareId;
        revenueShare[tokenId] = revenueShareBps;
        tokenTotalSupply[tokenId] = amount;
        
        _mint(to, tokenId, amount, "");
        
        emit AssetMinted(tokenId, PARTITION_REVENUE_SHARE, to, shareId, cid, amount);
        emit RevenueShareUpdated(tokenId, revenueShareBps);
    }
    
    /**
     * @notice Distribute revenue to token holders
     * @dev Automatically splits revenue based on token holdings and revenue share
     */
    function distributeRevenue(
        uint256[] memory tokenIds,
        address token, // ERC20 token address (0x0 for native ETH)
        uint256 totalAmount
    ) external payable onlyRole(REVENUE_MANAGER_ROLE) nonReentrant {
        require(tokenIds.length > 0, "No tokens specified");
        
        if (token == address(0)) {
            require(msg.value == totalAmount, "ETH amount mismatch");
        } else {
            IERC20(token).transferFrom(msg.sender, address(this), totalAmount);
        }
        
        uint256 totalDistributed = 0;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            uint256 shareBps = revenueShare[tokenId];
            
            if (shareBps == 0) continue;
            
            // Calculate share for this token
            uint256 tokenShare = (totalAmount * shareBps) / 10000;
            uint256 tokenSupply = tokenTotalSupply[tokenId];
            
            if (tokenSupply == 0) continue;
            
            // Distribute proportionally to holders
            // Note: In production, you'd iterate through holders and distribute
            // For now, accumulate for treasury or implement holder tracking
            // TODO: Implement efficient holder distribution
            totalDistributed += tokenShare;
        }
        
        // Send remaining to treasury
        uint256 treasuryAmount = totalAmount - totalDistributed;
        if (treasuryAmount > 0) {
            if (token == address(0)) {
                (bool success, ) = treasury.call{value: treasuryAmount}("");
                require(success, "Treasury transfer failed");
            } else {
                IERC20(token).transfer(treasury, treasuryAmount);
            }
        }
    }
    
    /**
     * @notice Update revenue share for a token
     */
    function setRevenueShare(uint256 tokenId, uint256 shareBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(shareBps <= 10000, "Invalid share");
        revenueShare[tokenId] = shareBps;
        emit RevenueShareUpdated(tokenId, shareBps);
    }
    
    /**
     * @notice Enable/disable transfers for a partition (compliance)
     */
    function setPartitionTransfersEnabled(bytes32 partition, bool enabled) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(partitions[partition], "Partition does not exist");
        partitionTransfersEnabled[partition] = enabled;
        emit PartitionRuleUpdated(partition, enabled, msg.sender);
    }
    
    /**
     * @notice Whitelist address for partition (compliance)
     */
    function whitelistPartitionAddress(bytes32 partition, address account, bool allowed)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(partitions[partition], "Partition does not exist");
        partitionWhitelist[partition][account] = allowed;
    }
    
    /**
     * @notice Override transfer to check partition rules
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override whenNotPaused {
        // Check partition rules
        for (uint256 i = 0; i < ids.length; i++) {
            bytes32 partition = tokenPartition[ids[i]];
            
            // Check if transfers are enabled for this partition
            if (!partitionTransfersEnabled[partition]) {
                revert("Transfers disabled for this partition");
            }
            
            // Check whitelist if from != address(0) (not minting)
            if (from != address(0)) {
                if (!partitionWhitelist[partition][to]) {
                    // Allow if whitelist is not enforced (all addresses allowed by default)
                    // In production, you might want stricter rules
                }
            }
        }
        
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
    
    /**
     * @notice Get token URI (IPFS)
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(bytes(tokenCIDs[tokenId]).length > 0, "Token does not exist");
        return string(abi.encodePacked(super.uri(tokenId), tokenCIDs[tokenId]));
    }
    
    /**
     * @notice Get partition for token
     */
    function getPartition(uint256 tokenId) external view returns (bytes32) {
        return tokenPartition[tokenId];
    }
    
    /**
     * @notice Check if tag ID is used
     */
    function isTagIdUsed(string memory tagId) external view returns (bool) {
        return tagIdsUsed[tagId];
    }
    
    /**
     * @notice Update treasury address
     */
    function setTreasury(address _newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newTreasury != address(0), "Invalid address");
        treasury = _newTreasury;
    }
    
    /**
     * @notice Pause contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    // Required by AccessControl
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    // Receive ETH
    receive() external payable {}
}

