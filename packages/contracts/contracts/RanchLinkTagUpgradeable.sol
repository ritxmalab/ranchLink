// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title RanchLinkTagUpgradeable
 * @dev ERC-721 NFT for livestock tags. Soulbound until transfer.
 * Upgradeable using UUPS (Universal Upgradeable Proxy Standard) pattern.
 * 
 * IMPORTANT: This contract will be deployed behind a proxy.
 * The proxy address will be the permanent contract address that users interact with.
 * The implementation can be upgraded while maintaining the same proxy address.
 */
contract RanchLinkTagUpgradeable is 
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    OwnableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 private _nextTokenId;
    
    // Mapping: tokenId -> publicIdHash (keccak256 of public_id like "AUS0001")
    mapping(uint256 => bytes32) public tokenToPublicId;
    mapping(bytes32 => uint256) public publicIdToToken;
    
    // Soulbound until transfer
    mapping(uint256 => bool) public isSoulbound;
    
    event TagMinted(uint256 indexed tokenId, bytes32 indexed publicIdHash, address to, string cid);
    event CIDUpdated(uint256 indexed tokenId, string newCID);
    event SoulboundUnlocked(uint256 indexed tokenId, address from, address to);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize function (replaces constructor for upgradeable contracts)
     * @param initialOwner Address that will own the contract
     */
    function initialize(address initialOwner) public initializer {
        __ERC721_init("RanchLink Tag", "RLTAG");
        __ERC721URIStorage_init();
        __Ownable_init(initialOwner);
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
        
        _nextTokenId = 1;
    }

    /**
     * @dev Mint a new tag NFT
     * @param to Address to mint to
     * @param publicIdHash keccak256 hash of public_id (e.g., "AUS0001")
     * @param cid IPFS CID for animal.json metadata
     */
    function mintTo(
        address to,
        bytes32 publicIdHash,
        string memory cid
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(publicIdToToken[publicIdHash] == 0, "Public ID already minted");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", cid)));
        isSoulbound[tokenId] = true;
        
        tokenToPublicId[tokenId] = publicIdHash;
        publicIdToToken[publicIdHash] = tokenId;
        
        emit TagMinted(tokenId, publicIdHash, to, cid);
        return tokenId;
    }

    /**
     * @dev Update the CID for an animal (owner or admin)
     */
    function setCID(uint256 tokenId, string memory cid) external {
        require(
            ownerOf(tokenId) == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", cid)));
        emit CIDUpdated(tokenId, cid);
    }

    /**
     * @dev Override _update to unlock soulbound on transfer
     * This is called by both transferFrom and safeTransferFrom
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address previousOwner = super._update(to, tokenId, auth);
        
        // If this is a transfer (not mint), unlock soulbound
        if (previousOwner != address(0) && isSoulbound[tokenId]) {
            isSoulbound[tokenId] = false;
            emit SoulboundUnlocked(tokenId, previousOwner, to);
        }
        
        return previousOwner;
    }

    /**
     * @dev Get token ID for a public ID hash
     */
    function getTokenId(bytes32 publicIdHash) external view returns (uint256) {
        return publicIdToToken[publicIdHash];
    }

    /**
     * @dev Required by UUPSUpgradeable - controls who can upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}

