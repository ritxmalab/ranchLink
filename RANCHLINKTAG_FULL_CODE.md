# RanchLinkTag.sol - Código Completo

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title RanchLinkTag
 * @dev ERC-721 NFT for livestock tags. Soulbound until transfer.
 * TokenURI points to latest animal.json CID on IPFS.
 */
contract RanchLinkTag is ERC721URIStorage, Ownable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 private _nextTokenId = 1;
    
    // Mapping: tokenId -> publicIdHash (keccak256 of public_id like "AUS0001")
    mapping(uint256 => bytes32) public tokenToPublicId;
    mapping(bytes32 => uint256) public publicIdToToken;
    
    // Soulbound until transfer
    mapping(uint256 => bool) public isSoulbound;
    
    event TagMinted(uint256 indexed tokenId, bytes32 indexed publicIdHash, address to, string cid);
    event CIDUpdated(uint256 indexed tokenId, string newCID);
    event SoulboundUnlocked(uint256 indexed tokenId, address from, address to);

    constructor(address initialOwner) ERC721("RanchLink Tag", "RLTAG") Ownable(initialOwner) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
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
     * @dev Override transfer to unlock soulbound
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721, IERC721) {
        if (isSoulbound[tokenId]) {
            isSoulbound[tokenId] = false;
            emit SoulboundUnlocked(tokenId, from, to);
        }
        super.transferFrom(from, to, tokenId);
    }

    /**
     * @dev Get token ID for a public ID hash
     */
    function getTokenId(bytes32 publicIdHash) external view returns (uint256) {
        return publicIdToToken[publicIdHash];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

