import { expect } from "chai";
import hre from "hardhat";

describe("HealthProver", function () {
  let healthProver: any;
  let mockVerifier: any;
  let owner: any;
  let prover: any;

  beforeEach(async function () {
    [owner, prover] = await hre.ethers.getSigners();

    const MockVerifier = await hre.ethers.getContractFactory("MockVerifier");
    mockVerifier = await MockVerifier.deploy(true);

    const HealthProver = await hre.ethers.getContractFactory("HealthProver");
    healthProver = await HealthProver.deploy();
  });

  it("Should set verifier and verify valid proof emitting event", async function () {
    const verifierAddress = await mockVerifier.getAddress();
    // ClaimType 0 = VACCINATION
    await healthProver.setVerifier(0, verifierAddress);

    const pA: [bigint, bigint] = [1n, 2n];
    const pB: [[bigint, bigint], [bigint, bigint]] = [
      [3n, 4n],
      [5n, 6n],
    ];
    const pC: [bigint, bigint] = [7n, 8n];
    const pubSignals: bigint[] = [12345n, 67890n];

    await expect(
      healthProver.connect(prover).verifyHealthClaim(0, pA, pB, pC, pubSignals)
    ).to.emit(healthProver, "ProofVerified");
  });

  it("Should reject verification if verifier is not set", async function () {
    const pA: [bigint, bigint] = [1n, 2n];
    const pB: [[bigint, bigint], [bigint, bigint]] = [
      [3n, 4n],
      [5n, 6n],
    ];
    const pC: [bigint, bigint] = [7n, 8n];
    const pubSignals: bigint[] = [12345n];

    await expect(
      healthProver.connect(prover).verifyHealthClaim(1, pA, pB, pC, pubSignals)
    ).to.be.revertedWith("HealthProver: verifier not registered");
  });
});
