// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SecureRegistry
 * @notice Tamper-proof data anchoring for RanchLink events
 * @dev Anchors data hashes on-chain for permanent record
 */
contract SecureRegistry is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ANCHORER_ROLE = keccak256("ANCHORER_ROLE");
    
    struct Anchor {
        bytes32 dataHash;
        uint256 timestamp;
        address anchorer;
        string eventType;
    }
    
    mapping(bytes32 => Anchor) public anchors; // dataHash -> Anchor
    mapping(string => bytes32[]) public eventAnchors; // eventType -> dataHashes[]
    
    // Events
    event DataAnchored(
        bytes32 indexed dataHash,
        string eventType,
        address indexed anchorer,
        uint256 timestamp
    );
    
    constructor(address _defaultAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _grantRole(ANCHORER_ROLE, _defaultAdmin);
    }
    
    /**
     * @notice Anchor a data hash (tamper-proof record)
     * @dev Server wallet can anchor, creates permanent record
     */
    function anchor(
        bytes32 dataHash,
        string memory eventType
    ) external onlyRole(ANCHORER_ROLE) whenNotPaused nonReentrant {
        require(anchors[dataHash].timestamp == 0, "Hash already anchored");
        require(bytes(eventType).length > 0, "Event type required");
        
        anchors[dataHash] = Anchor({
            dataHash: dataHash,
            timestamp: block.timestamp,
            anchorer: msg.sender,
            eventType: eventType
        });
        
        eventAnchors[eventType].push(dataHash);
        
        emit DataAnchored(dataHash, eventType, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Batch anchor (efficient)
     */
    function batchAnchor(
        bytes32[] calldata dataHashes,
        string[] calldata eventTypes
    ) external onlyRole(ANCHORER_ROLE) whenNotPaused nonReentrant {
        require(dataHashes.length == eventTypes.length, "Array length mismatch");
        require(dataHashes.length <= 50, "Batch too large");
        
        for (uint256 i = 0; i < dataHashes.length; i++) {
            require(anchors[dataHashes[i]].timestamp == 0, "Hash already anchored");
            require(bytes(eventTypes[i]).length > 0, "Event type required");
            
            anchors[dataHashes[i]] = Anchor({
                dataHash: dataHashes[i],
                timestamp: block.timestamp,
                anchorer: msg.sender,
                eventType: eventTypes[i]
            });
            
            eventAnchors[eventTypes[i]].push(dataHashes[i]);
            
            emit DataAnchored(dataHashes[i], eventTypes[i], msg.sender, block.timestamp);
        }
    }
    
    /**
     * @notice Verify if data hash is anchored
     */
    function isAnchored(bytes32 dataHash) external view returns (bool) {
        return anchors[dataHash].timestamp > 0;
    }
    
    /**
     * @notice Get anchor details
     */
    function getAnchor(bytes32 dataHash) external view returns (Anchor memory) {
        require(anchors[dataHash].timestamp > 0, "Hash not anchored");
        return anchors[dataHash];
    }
    
    /**
     * @notice Get all anchors for event type
     */
    function getEventAnchors(string memory eventType) external view returns (bytes32[] memory) {
        return eventAnchors[eventType];
    }
    
    /**
     * @notice Pause (emergency)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}

