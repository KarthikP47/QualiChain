// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ChatRoom {
    struct Room {
        string name;
        address creator;
        uint256 createdAt;
        bool exists;
        string password;
    }

    struct Member {
        address wallet;
        uint256 joinedAt;
        bool isActive;
    }

    mapping(uint256 => Room) public rooms;
    mapping(uint256 => mapping(address => Member)) public roomMembers;
    mapping(uint256 => address[]) public roomMemberList;
    uint256 public roomCount;

    event RoomCreated(uint256 indexed roomId, string name, address creator);
    event MemberJoined(uint256 indexed roomId, address member);
    event MemberLeft(uint256 indexed roomId, address member);
    event RoomDeleted(uint256 indexed roomId);

    function createRoom(uint256 roomId, string memory name, string memory password) external {
        require(!rooms[roomId].exists, "Room ID already exists");
        
        rooms[roomId] = Room({
            name: name,
            creator: msg.sender,
            createdAt: block.timestamp,
            exists: true,
            password: password
        });
        
        // Add creator as first member
        roomMembers[roomId][msg.sender] = Member({
            wallet: msg.sender,
            joinedAt: block.timestamp,
            isActive: true
        });
        roomMemberList[roomId].push(msg.sender);

        emit RoomCreated(roomId, name, msg.sender);
        emit MemberJoined(roomId, msg.sender);
    }

    function joinRoom(uint256 roomId, string memory password) external {
        require(rooms[roomId].exists, "Room does not exist");
        require(!roomMembers[roomId][msg.sender].isActive, "Already a member");
        require(keccak256(abi.encodePacked(rooms[roomId].password)) == keccak256(abi.encodePacked(password)), "Incorrect password");

        roomMembers[roomId][msg.sender] = Member({
            wallet: msg.sender,
            joinedAt: block.timestamp,
            isActive: true
        });
        roomMemberList[roomId].push(msg.sender);

        emit MemberJoined(roomId, msg.sender);
    }

    function leaveRoom(uint256 roomId) external {
        require(roomMembers[roomId][msg.sender].isActive, "Not a member");
        
        roomMembers[roomId][msg.sender].isActive = false;
        emit MemberLeft(roomId, msg.sender);
    }

    function deleteRoom(uint256 roomId) external {
        require(rooms[roomId].exists, "Room does not exist");
        require(rooms[roomId].creator == msg.sender, "Only creator can delete room");
        
        rooms[roomId].exists = false;
        emit RoomDeleted(roomId);
    }

    function isMember(uint256 roomId, address user) external view returns (bool) {
        return roomMembers[roomId][user].isActive;
    }

    function getRoomInfo(uint256 roomId) external view returns (
        string memory name,
        address creator,
        uint256 createdAt,
        bool exists
    ) {
        Room memory room = rooms[roomId];
        return (room.name, room.creator, room.createdAt, room.exists);
    }

    function getMemberCount(uint256 roomId) external view returns (uint256) {
        uint256 count = 0;
        address[] memory members = roomMemberList[roomId];
        for (uint256 i = 0; i < members.length; i++) {
            if (roomMembers[roomId][members[i]].isActive) {
                count++;
            }
        }
        return count;
    }
}
