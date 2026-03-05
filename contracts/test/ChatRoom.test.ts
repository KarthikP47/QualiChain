import { expect } from "chai";
import hre from "hardhat";

describe("ChatRoom Contract", function () {
    let chatRoom: any;
    let owner: any;
    let addr1: any;
    let addr2: any;

    beforeEach(async function () {
        [owner, addr1, addr2] = await hre.ethers.getSigners();
        const ChatRoom = await hre.ethers.getContractFactory("ChatRoom");
        chatRoom = await ChatRoom.deploy();
    });

    it("Should create a room", async function () {
        await chatRoom.createRoom(1n, "Crypto Talk", "password123");

        const roomInfo = await chatRoom.getRoomInfo(1n);
        expect(roomInfo.name).to.equal("Crypto Talk");
        expect(roomInfo.creator).to.equal(owner.address);
        expect(roomInfo.exists).to.equal(true);

        const memberCount = await chatRoom.getMemberCount(1n);
        expect(memberCount).to.equal(1n);
    });

    it("Should allow a user to join a room with correct password", async function () {
        await chatRoom.createRoom(1n, "Crypto Talk", "password123");

        await chatRoom.connect(addr1).joinRoom(1n, "password123");
        const isMember = await chatRoom.isMember(1n, addr1.address);
        expect(isMember).to.equal(true);

        const memberCount = await chatRoom.getMemberCount(1n);
        expect(memberCount).to.equal(2n);
    });

    it("Should fail to join with wrong password", async function () {
        await chatRoom.createRoom(1n, "Crypto Talk", "password123");

        let failed = false;
        try {
            await chatRoom.connect(addr1).joinRoom(1n, "wrongpass");
        } catch (error: any) {
            failed = true;
            expect(error.message).to.include("Incorrect password");
        }
        expect(failed).to.equal(true);
    });

    it("Should allow a user to leave a room", async function () {
        await chatRoom.createRoom(1n, "Crypto Talk", "password123");
        await chatRoom.connect(addr1).joinRoom(1n, "password123");

        await chatRoom.connect(addr1).leaveRoom(1n);
        const isMember = await chatRoom.isMember(1n, addr1.address);
        expect(isMember).to.equal(false);

        const memberCount = await chatRoom.getMemberCount(1n);
        expect(memberCount).to.equal(1n);
    });

    it("Should allow creator to delete room", async function () {
        await chatRoom.createRoom(1n, "Crypto Talk", "password123");
        await chatRoom.deleteRoom(1n);

        const roomInfo = await chatRoom.getRoomInfo(1n);
        expect(roomInfo.exists).to.equal(false);
    });
});
