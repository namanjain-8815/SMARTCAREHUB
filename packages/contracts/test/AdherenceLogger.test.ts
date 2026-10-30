import { expect } from "chai";
import hre from "hardhat";

describe("AdherenceLogger", function () {
  let adherenceLogger: any;
  let patient: any;
  let stranger: any;

  beforeEach(async function () {
    [patient, stranger] = await hre.ethers.getSigners();
    const AdherenceLogger = await hre.ethers.getContractFactory("AdherenceLogger");
    adherenceLogger = await AdherenceLogger.deploy();
  });

  it("Should accept valid EIP-712 signed dosage confirmation and compute compliance", async function () {
    const chainId = (await hre.ethers.provider.getNetwork()).chainId;
    const contractAddress = await adherenceLogger.getAddress();

    const domain = {
      name: "SmartCareHub.AdherenceLogger",
      version: "1",
      chainId: chainId,
      verifyingContract: contractAddress,
    };

    const types = {
      DosageEvent: [
        { name: "medicationId", type: "string" },
        { name: "scheduledAt", type: "uint256" },
        { name: "confirmedAt", type: "uint256" },
      ],
    };

    const block = await hre.ethers.provider.getBlock("latest");
    const scheduledAt = block!.timestamp;
    const confirmedAt = block!.timestamp + 10;
    const medicationId = "MED-METFORMIN-500";

    const value = {
      medicationId,
      scheduledAt,
      confirmedAt,
    };

    const signature = await patient.signTypedData(domain, types, value);

    await expect(
      adherenceLogger.connect(patient).logDosage(medicationId, scheduledAt, confirmedAt, signature)
    ).to.emit(adherenceLogger, "DosageConfirmed");

    const log = await adherenceLogger.connect(patient).getMyLog();
    expect(log.length).to.equal(1);
    expect(log[0].medicationId).to.equal(medicationId);

    const [confirmed, inWindow] = await adherenceLogger.computeComplianceScore(
      patient.address,
      scheduledAt - 100,
      scheduledAt + 100
    );
    expect(confirmed).to.equal(1n);
    expect(inWindow).to.equal(1n);
  });

  it("Should reject invalid signature or wrong caller", async function () {
    const chainId = (await hre.ethers.provider.getNetwork()).chainId;
    const contractAddress = await adherenceLogger.getAddress();

    const domain = {
      name: "SmartCareHub.AdherenceLogger",
      version: "1",
      chainId: chainId,
      verifyingContract: contractAddress,
    };

    const types = {
      DosageEvent: [
        { name: "medicationId", type: "string" },
        { name: "scheduledAt", type: "uint256" },
        { name: "confirmedAt", type: "uint256" },
      ],
    };

    const block = await hre.ethers.provider.getBlock("latest");
    const scheduledAt = block!.timestamp;
    const confirmedAt = block!.timestamp + 5;
    const medicationId = "MED-ASPIRIN-100";

    // Signed by stranger, submitted by patient
    const signature = await stranger.signTypedData(domain, types, {
      medicationId,
      scheduledAt,
      confirmedAt,
    });

    await expect(
      adherenceLogger.connect(patient).logDosage(medicationId, scheduledAt, confirmedAt, signature)
    ).to.be.revertedWith("AdherenceLogger: invalid signature");
  });
});
