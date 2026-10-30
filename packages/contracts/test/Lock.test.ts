import { expect } from "chai";
import hre from "hardhat";

describe("Lock", function () {
  it("Should set the right unlockTime", async function () {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const unlockTime = (await hre.ethers.provider.getBlock("latest")).timestamp + ONE_YEAR_IN_SECS;

    const Lock = await hre.ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: hre.ethers.parseEther("1") });

    expect(await lock.unlockTime()).to.equal(unlockTime);
  });
});
