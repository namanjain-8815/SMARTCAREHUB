import { expect } from "chai";
import hre from "hardhat";

describe("CredentialLocker", function () {
  let credentialLocker: any;
  let owner: any;
  let patient: any;
  let guardian: any;
  let medic: any;
  let stranger: any;

  beforeEach(async function () {
    [owner, patient, guardian, medic, stranger] = await hre.ethers.getSigners();
    const CredentialLocker = await hre.ethers.getContractFactory("CredentialLocker");
    credentialLocker = await CredentialLocker.deploy();
  });

  it("Should issue soulbound credential and revert on transfer attempts", async function () {
    const dummyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("DoctorCertification"));
    const expiresAt = 0; // Never

    await expect(
      credentialLocker.issueCredential(patient.address, "DOCTOR_LICENSE", expiresAt, dummyHash)
    )
      .to.emit(credentialLocker, "CredentialIssued")
      .withArgs(1n, patient.address, "DOCTOR_LICENSE");

    expect(await credentialLocker.ownerOf(1n)).to.equal(patient.address);

    // Soulbound check: transfer should revert
    await expect(
      credentialLocker.connect(patient).transferFrom(patient.address, stranger.address, 1n)
    ).to.be.revertedWith("CredentialLocker: soulbound - transfers disabled");
  });

  it("Should allow guardian break-glass and record audit event", async function () {
    const triageCID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
    await credentialLocker.connect(patient).setTriagePayload(triageCID, [guardian.address]);

    // Stranger tries break-glass: must revert
    await expect(
      credentialLocker.connect(stranger).breakGlassAsGuardian(patient.address)
    ).to.be.revertedWith("CredentialLocker: not a guardian");

    // Guardian break-glass: must succeed and emit BreakGlassAccessed
    await expect(
      credentialLocker.connect(guardian).breakGlassAsGuardian(patient.address)
    )
      .to.emit(credentialLocker, "BreakGlassAccessed")
      .withArgs(patient.address, guardian.address, "GUARDIAN_SIGNED", (val: any) => val > 0);

    const auditLog = await credentialLocker.getAuditLog(patient.address);
    expect(auditLog.length).to.equal(1);
    expect(auditLog[0].accessedBy).to.equal(guardian.address);
    expect(auditLog[0].reason).to.equal("GUARDIAN_SIGNED");
  });

  it("Should allow verified medic with active credential to break glass", async function () {
    const triageCID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
    await credentialLocker.connect(patient).setTriagePayload(triageCID, [guardian.address]);

    // Issue medic credential
    const dummyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("MedicLicence"));
    await credentialLocker.issueCredential(medic.address, "PARAMEDIC", 0, dummyHash);

    // Not yet registered as verified medic: must revert
    await expect(
      credentialLocker.connect(medic).breakGlassAsMedic(patient.address, 1n)
    ).to.be.revertedWith("CredentialLocker: not a verified medic");

    // Register medic
    await credentialLocker.registerMedic(medic.address, true);

    // Medic break-glass: must succeed
    await expect(
      credentialLocker.connect(medic).breakGlassAsMedic(patient.address, 1n)
    )
      .to.emit(credentialLocker, "BreakGlassAccessed")
      .withArgs(patient.address, medic.address, "MEDIC_CREDENTIAL", (val: any) => val > 0);

    const auditLog = await credentialLocker.getAuditLog(patient.address);
    expect(auditLog.length).to.equal(1);
    expect(auditLog[0].accessedBy).to.equal(medic.address);
    expect(auditLog[0].reason).to.equal("MEDIC_CREDENTIAL");
  });
});
