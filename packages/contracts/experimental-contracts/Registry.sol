// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Registry
 * @dev Optional registry for anchoring IPFS CIDs to Base L2
 * Provides tamper-evident proof of data snapshots
 */
contract Registry {
    event Anchored(bytes32 indexed publicIdHash, bytes32 indexed dataHash, uint256 timestamp);
    
    // Mapping: publicIdHash -> dataHash -> timestamp
    mapping(bytes32 => mapping(bytes32 => uint256)) public anchors;
    
    /**
     * @dev Anchor a data hash for a public ID
     * @param publicIdHash keccak256 hash of public_id
     * @param dataHash keccak256 hash of the data being anchored
     */
    function anchor(bytes32 publicIdHash, bytes32 dataHash) external {
        anchors[publicIdHash][dataHash] = block.timestamp;
        emit Anchored(publicIdHash, dataHash, block.timestamp);
    }
    
    /**
     * @dev Check if a data hash is anchored
     */
    function isAnchored(bytes32 publicIdHash, bytes32 dataHash) external view returns (bool) {
        return anchors[publicIdHash][dataHash] > 0;
    }
}


