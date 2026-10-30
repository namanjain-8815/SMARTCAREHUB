const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CIRCUITS = [
  { id: 'vaccination_range', pascal: 'VaccinationRange' },
  { id: 'vitals_range', pascal: 'VitalsRange' },
  { id: 'age_threshold', pascal: 'AgeThreshold' },
];

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const contractsDir = path.resolve(rootDir, '../contracts/contracts');
  const webCircuitsDir = path.resolve(rootDir, '../../apps/web/public/circuits');
  const ptauFile = path.resolve(rootDir, 'ptau/pot12_final.ptau');

  for (const { id, pascal } of CIRCUITS) {
    console.log(`\n========================================`);
    console.log(`Processing Circuit: ${id}`);
    console.log(`========================================`);

    const circuitBuildDir = path.resolve(rootDir, `build/${id}`);
    const r1csPath = path.join(circuitBuildDir, `${id}.r1cs`);
    const zkey0Path = path.join(circuitBuildDir, `${id}_0000.zkey`);
    const zkeyFinalPath = path.join(circuitBuildDir, `${id}_final.zkey`);
    const vkeyPath = path.join(circuitBuildDir, 'verification_key.json');
    const wasmSource = path.join(circuitBuildDir, `${id}_js/${id}.wasm`);

    // 1. Groth16 Setup
    console.log(`Running Groth16 setup...`);
    execSync(`npx snarkjs groth16 setup "${r1csPath}" "${ptauFile}" "${zkey0Path}"`, {
      cwd: rootDir,
      stdio: 'inherit',
    });

    // 2. Contribute to ceremony
    console.log(`Contributing to zkey ceremony...`);
    execSync(
      `npx snarkjs zkey contribute "${zkey0Path}" "${zkeyFinalPath}" --name="SmartCareHub Dev" -v -e="sch_contrib_${id}"`,
      { cwd: rootDir, stdio: 'inherit' }
    );

    // 3. Export verification key JSON
    console.log(`Exporting verification key JSON...`);
    execSync(`npx snarkjs zkey export verificationkey "${zkeyFinalPath}" "${vkeyPath}"`, {
      cwd: rootDir,
      stdio: 'inherit',
    });

    // 4. Export Solidity verifier contract
    console.log(`Exporting Solidity verifier contract...`);
    const verifierSolPath = path.join(contractsDir, `${pascal}Verifier.sol`);
    execSync(`npx snarkjs zkey export solidityverifier "${zkeyFinalPath}" "${verifierSolPath}"`, {
      cwd: rootDir,
      stdio: 'inherit',
    });

    // In generated verifier, rename contract name to match pascal name
    let solContent = fs.readFileSync(verifierSolPath, 'utf8');
    solContent = solContent.replace('contract Groth16Verifier', `contract ${pascal}Verifier`);
    fs.writeFileSync(verifierSolPath, solContent);

    // 5. Copy artifacts to web app public folder
    const targetWebDir = path.join(webCircuitsDir, id);
    if (!fs.existsSync(targetWebDir)) {
      fs.mkdirSync(targetWebDir, { recursive: true });
    }

    fs.copyFileSync(wasmSource, path.join(targetWebDir, `${id}.wasm`));
    fs.copyFileSync(zkeyFinalPath, path.join(targetWebDir, `${id}_final.zkey`));
    fs.copyFileSync(vkeyPath, path.join(targetWebDir, 'verification_key.json'));
    console.log(`Artifacts copied to apps/web/public/circuits/${id}/`);
  }

  console.log(`\nAll 3 circuits successfully setup and exported!`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
