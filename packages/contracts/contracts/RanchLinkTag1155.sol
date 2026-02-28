// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title RanchLinkTag1155
 * @notice ERC-1155 livestock tag with two-layer identity:
 *
 *   Layer 1 — Pre-identity (factory, ~$0.05/batch any size)
 *     anchorBatch() writes a Merkle root. Every tag has provable on-chain
 *     existence from birth before any farmer claims it.
 *
 *   Layer 2 — Active RWA (claim/attach, ~$0.002/tag)
 *     lazyMint() activates a pre-identity into a full ERC-1155 token,
 *     verifying the tag was in the original factory batch via Merkle proof.
 *
 * Token IDs: uint256(keccak256(tagCode)) — deterministic, no sequential counter.
 * Each tag has supply = 1 (unique identity token).
 */
contract RanchLinkTag1155 is ERC1155, AccessControl {
    bytes32 public constant ADMIN_ROLE  = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // batchId => merkleRoot
    mapping(bytes32 => bytes32) public batchRoots;
    // batchId => IPFS URI of batch manifest
    mapping(bytes32 => string)  public batchURIs;
    // tokenId => IPFS CID (animal metadata)
    mapping(uint256 => string)  private _tokenCIDs;
    // tokenId => activated (lazy-minted)
    mapping(uint256 => bool)    public activated;
    // tokenId => batchId
    mapping(uint256 => bytes32) public tokenBatch;

    event BatchAnchored(bytes32 indexed batchId, bytes32 merkleRoot, string batchURI, uint256 timestamp);
    event TagActivated(uint256 indexed tokenId, bytes32 indexed batchId, address to, string tagCode);
    event CIDUpdated(uint256 indexed tokenId, string newCID);

    constructor(address initialOwner) ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE,         initialOwner);
        _grantRole(MINTER_ROLE,        initialOwner);
    }

    /**
     * @notice Anchor a factory batch. One tx covers any batch size.
     * @param batchId    keccak256(batchName + timestamp)
     * @param merkleRoot Root of Merkle tree of all tagCodes in the batch
     * @param batchURI   IPFS URI of batch manifest JSON
     */
    function anchorBatch(
        bytes32 batchId,
        bytes32 merkleRoot,
        string calldata batchURI
    ) external onlyRole(MINTER_ROLE) {
        require(batchRoots[batchId] == bytes32(0), "Batch already anchored");
        require(merkleRoot != bytes32(0), "Empty merkle root");
        require(bytes(batchURI).length > 0, "Empty batch URI");
        batchRoots[batchId] = merkleRoot;
        batchURIs[batchId]  = batchURI;
        emit BatchAnchored(batchId, merkleRoot, batchURI, block.timestamp);
    }

    /**
     * @notice Activate a single tag (lazy mint at claim time).
     * @param to      Recipient address
     * @param tagCode Tag code string e.g. "RL-008"
     * @param batchId Batch this tag belongs to
     * @param proof   Merkle proof that tagCode is in batchId tree
     * @param cid     Initial IPFS CID for animal metadata
     */
    function lazyMint(
        address to,
        string calldata tagCode,
        bytes32 batchId,
        bytes32[] calldata proof,
        string calldata cid
    ) external onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        tokenId = uint256(keccak256(abi.encodePacked(tagCode)));
        require(!activated[tokenId], "Tag already activated");
        require(batchRoots[batchId] != bytes32(0), "Batch not anchored");
        bytes32 leaf = keccak256(abi.encodePacked(tagCode));
        require(MerkleProof.verify(proof, batchRoots[batchId], leaf), "Invalid Merkle proof");
        activated[tokenId]  = true;
        tokenBatch[tokenId] = batchId;
        _tokenCIDs[tokenId] = cid;
        _mint(to, tokenId, 1, "");
        emit TagActivated(tokenId, batchId, to, tagCode);
    }

    /**
     * @notice Batch activate multiple tags in one tx (~$0.002/tag at scale).
     */
    function batchLazyMint(
        address[] calldata to,
        string[]  calldata tagCodes,
        bytes32[] calldata batchIds,
        bytes32[][] calldata proofs,
        string[]  calldata cids
    ) external onlyRole(MINTER_ROLE) {
        require(
            to.length == tagCodes.length &&
            tagCodes.length == batchIds.length &&
            batchIds.length == proofs.length &&
            proofs.length == cids.length,
            "Array length mismatch"
        );
        for (uint256 i = 0; i < tagCodes.length; i++) {
            uint256 tokenId = uint256(keccak256(abi.encodePacked(tagCodes[i])));
            if (activated[tokenId]) continue;
            require(batchRoots[batchIds[i]] != bytes32(0), "Batch not anchored");
            bytes32 leaf = keccak256(abi.encodePacked(tagCodes[i]));
            require(MerkleProof.verify(proofs[i], batchRoots[batchIds[i]], leaf), "Invalid proof");
            activated[tokenId]  = true;
            tokenBatch[tokenId] = batchIds[i];
            _tokenCIDs[tokenId] = cids[i];
            _mint(to[i], tokenId, 1, "");
            emit TagActivated(tokenId, batchIds[i], to[i], tagCodes[i]);
        }
    }

    /**
     * @notice Update animal metadata CID (called on every animal record update).
     */
    function setCID(uint256 tokenId, string calldata cid) external {
        require(
            balanceOf(msg.sender, tokenId) > 0 || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        _tokenCIDs[tokenId] = cid;
        emit CIDUpdated(tokenId, cid);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory cid = _tokenCIDs[tokenId];
        if (bytes(cid).length == 0) return "";
        return string(abi.encodePacked("ipfs://", cid));
    }

    /**
     * @notice Derive tokenId for a tag code (deterministic, no state read needed).
     */
    function tagCodeToTokenId(string calldata tagCode) external pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(tagCode)));
    }

    /**
     * @notice Read-only Merkle proof check — verify tag is in a batch.
     */
    function verifyTag(
        string calldata tagCode,
        bytes32 batchId,
        bytes32[] calldata proof
    ) external view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(tagCode));
        return MerkleProof.verify(proof, batchRoots[batchId], leaf);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
