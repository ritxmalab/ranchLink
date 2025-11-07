// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SecureRanchLinkTag
 * @notice ERC-721 NFT contract for RanchLink animal tags with security features
 * @dev Tamper-proof, flexible, and secure for owner, server, and users
 */
contract SecureRanchLinkTag is ERC721, AccessControl, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    // State
    Counters.Counter private _tokenIdCounter;
    mapping(uint256 => string) private _tokenCIDs; // IPFS metadata CIDs
    mapping(string => bool) private _tagIdsUsed; // Prevent duplicate tag activations
    mapping(uint256 => address) private _tagIdToToken; // Tag ID -> Token ID mapping
    
    // Security settings
    address public treasury; // Treasury address (Ledger wallet)
    uint256 public maxMintPerTx = 10; // Limit batch mints
    bool public transfersEnabled = true; // Can disable transfers (soulbound mode)
    
    // Events
    event TagMinted(uint256 indexed tokenId, string tagId, address indexed to, string cid);
    event MetadataUpdated(uint256 indexed tokenId, string newCID);
    event TransfersToggled(bool enabled);
    event TagIdRegistered(string tagId, uint256 tokenId);
    
    constructor(
        address _treasury,
        address _defaultAdmin
    ) ERC721("RanchLink Tag", "RLTAG") {
        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _grantRole(MINTER_ROLE, _defaultAdmin); // Can grant to server wallet
        treasury = _treasury;
    }
    
    /**
     * @notice Mint a new tag (only MINTER_ROLE)
     * @dev One-time activation per tagId, tamper-proof
     */
    function mintTo(
        address to,
        string memory tagId,
        string memory cid
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        require(!_tagIdsUsed[tagId], "Tag already activated");
        require(bytes(cid).length > 0, "CID required");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _tagIdsUsed[tagId] = true;
        _tagIdToToken[_tokenIdToNumericId(tagId)] = tokenId;
        _tokenCIDs[tokenId] = cid;
        
        _safeMint(to, tokenId);
        
        emit TagMinted(tokenId, tagId, to, cid);
        emit TagIdRegistered(tagId, tokenId);
    }
    
    /**
     * @notice Batch mint (with limit protection)
     */
    function batchMint(
        address[] calldata to,
        string[] calldata tagIds,
        string[] calldata cids
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        require(to.length == tagIds.length && tagIds.length == cids.length, "Array length mismatch");
        require(to.length <= maxMintPerTx, "Exceeds max batch size");
        
        for (uint256 i = 0; i < to.length; i++) {
            require(!_tagIdsUsed[tagIds[i]], "Tag already activated");
            require(bytes(cids[i]).length > 0, "CID required");
            
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            
            _tagIdsUsed[tagIds[i]] = true;
            _tagIdToToken[_tagIdToNumericId(tagIds[i])] = tokenId;
            _tokenCIDs[tokenId] = cids[i];
            
            _safeMint(to[i], tokenId);
            
            emit TagMinted(tokenId, tagIds[i], to[i], cids[i]);
            emit TagIdRegistered(tagIds[i], tokenId);
        }
    }
    
    /**
     * @notice Update metadata CID (owner or operator only)
     */
    function setCID(uint256 tokenId, string memory newCID) external {
        require(_exists(tokenId), "Token does not exist");
        require(
            hasRole(OPERATOR_ROLE, msg.sender) || ownerOf(tokenId) == msg.sender,
            "Not authorized"
        );
        require(bytes(newCID).length > 0, "CID required");
        
        _tokenCIDs[tokenId] = newCID;
        emit MetadataUpdated(tokenId, newCID);
    }
    
    /**
     * @notice Override transfer to respect soulbound mode
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override whenNotPaused {
        if (from != address(0) && to != address(0)) {
            require(transfersEnabled, "Transfers disabled");
        }
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    /**
     * @notice Toggle transfers (admin only)
     */
    function setTransfersEnabled(bool _enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        transfersEnabled = _enabled;
        emit TransfersToggled(_enabled);
    }
    
    /**
     * @notice Set max mint per transaction (security limit)
     */
    function setMaxMintPerTx(uint256 _max) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_max > 0 && _max <= 100, "Invalid limit");
        maxMintPerTx = _max;
    }
    
    /**
     * @notice Update treasury address (admin only, with timelock in production)
     */
    function setTreasury(address _newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newTreasury != address(0), "Invalid address");
        treasury = _newTreasury;
    }
    
    /**
     * @notice Pause contract (emergency stop)
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
    
    /**
     * @notice Get token URI (IPFS)
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return string(abi.encodePacked("ipfs://", _tokenCIDs[tokenId]));
    }
    
    /**
     * @notice Check if tag ID is already used
     */
    function isTagIdUsed(string memory tagId) external view returns (bool) {
        return _tagIdsUsed[tagId];
    }
    
    /**
     * @notice Get token ID from tag ID
     */
    function getTokenIdFromTagId(string memory tagId) external view returns (uint256) {
        uint256 numericId = _tagIdToNumericId(tagId);
        return _tagIdToToken[numericId];
    }
    
    /**
     * @notice Get metadata CID
     */
    function getCID(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenCIDs[tokenId];
    }
    
    /**
     * @notice Helper: Convert tag ID to numeric (simplified)
     */
    function _tagIdToNumericId(string memory tagId) private pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(tagId)));
    }
    
    // Required by AccessControl
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

