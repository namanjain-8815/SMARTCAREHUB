import { expect } from "chai";
import hre from "hardhat";

describe("DelegationManager", function () {
  let delegationManager: any;
  let grantor: any;
  let delegate: any;
  let stranger: any;

  beforeEach(async function () {
    [grantor, delegate, stranger] = await hre.ethers.getSigners();
    const DelegationManager = await hre.ethers.getContractFactory("DelegationManager");
    delegationManager = await DelegationManager.deploy();
  });

  it("Should grant and verify valid delegation", async function () {
    const dummyKey = hre.ethers.toUtf8Bytes("EncryptedWrappedKeyData");
    const block = await hre.ethers.provider.getBlock("latest");
    const expiresAt = block!.timestamp + 3600; // 1 hour

    await expect(
      delegationManager.grantDelegation(delegate.address, 1, expiresAt, dummyKey)
    )
      .to.emit(delegationManager, "DelegationGranted")
      .withArgs(grantor.address, delegate.address, 1, expiresAt);

    const [valid, role] = await delegationManager.hasValidAccess(grantor.address, delegate.address);
    expect(valid).to.equal(true);
    expect(role).to.equal(1);
  });

  it("Should return invalid after revocation", async function () {
    const dummyKey = hre.ethers.toUtf8Bytes("Key");
    const expiresAt = 0; // Never expires

    await delegationManager.grantDelegation(delegate.address, 2, expiresAt, dummyKey);
    let [valid, role] = await delegationManager.hasValidAccess(grantor.address, delegate.address);
    expect(valid).to.equal(true);
    expect(role).to.equal(2);

    await expect(delegationManager.revokeDelegation(0))
      .to.emit(delegationManager, "DelegationRevoked")
      .withArgs(grantor.address, 0);

    [valid, role] = await delegationManager.hasValidAccess(grantor.address, delegate.address);
    expect(valid).to.equal(false);
    expect(role).to.equal(0);
  });

  it("Should return invalid for expired delegation", async function () {
    const dummyKey = hre.ethers.toUtf8Bytes("Key");
    const block = await hre.ethers.provider.getBlock("latest");
    const expiresAt = block!.timestamp + 10;

    await delegationManager.grantDelegation(delegate.address, 1, expiresAt, dummyKey);

    // Fast-forward time past expiration
    await hre.network.provider.send("evm_increaseTime", [20]);
    await hre.network.provider.send("evm_mine");

    const [valid, role] = await delegationManager.hasValidAccess(grantor.address, delegate.address);
    expect(valid).to.equal(false);
    expect(role).to.equal(0);
  });
});
