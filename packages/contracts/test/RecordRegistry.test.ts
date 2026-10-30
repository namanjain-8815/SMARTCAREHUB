import { expect } from "chai";
import hre from "hardhat";

describe("RecordRegistry", function () {
  let recordRegistry: any;
  let owner: any;
  let otherAccount: any;

  beforeEach(async function () {
    [owner, otherAccount] = await hre.ethers.getSigners();
    const RecordRegistry = await hre.ethers.getContractFactory("RecordRegistry");
    recordRegistry = await RecordRegistry.deploy();
  });

  it("Should anchor a new record commitment", async function () {
    const dummyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("EncryptedMedicalData"));
    const dummyCID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

    await expect(recordRegistry.anchorRecord(dummyHash, dummyCID))
      .to.emit(recordRegistry, "RecordAnchored")
      .withArgs(owner.address, dummyHash, dummyCID, (val: any) => val > 0);

    const records = await recordRegistry.getMyRecords();
    expect(records.length).to.equal(1);
    expect(records[0].contentHash).to.equal(dummyHash);
    expect(records[0].encryptedCID).to.equal(dummyCID);
    expect(records[0].revoked).to.equal(false);
  });

  it("Should revert on empty hash or empty CID", async function () {
    const emptyHash = hre.ethers.ZeroHash;
    const dummyCID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
    const dummyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("Data"));

    await expect(recordRegistry.anchorRecord(emptyHash, dummyCID))
      .to.be.revertedWith("RecordRegistry: empty hash");

    await expect(recordRegistry.anchorRecord(dummyHash, ""))
      .to.be.revertedWith("RecordRegistry: empty CID");
  });

  it("Should verify valid record and reject revoked record", async function () {
    const dummyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("Data"));
    const dummyCID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

    await recordRegistry.anchorRecord(dummyHash, dummyCID);
    expect(await recordRegistry.verifyRecord(owner.address, 0, dummyHash)).to.equal(true);

    // Revoke
    await expect(recordRegistry.revokeRecord(0))
      .to.emit(recordRegistry, "RecordRevoked")
      .withArgs(owner.address, 0);

    expect(await recordRegistry.verifyRecord(owner.address, 0, dummyHash)).to.equal(false);
  });
});
