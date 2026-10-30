import * as fs from 'fs';
import * as path from 'path';

const CONTRACT_NAMES = [
  'RecordRegistry',
  'DelegationManager',
  'AdherenceLogger',
  'HealthProver',
  'CredentialLocker',
];

async function main() {
  const artifactsDir = path.resolve(__dirname, '../artifacts/contracts');
  const webAbisDir = path.resolve(__dirname, '../../../apps/web/src/lib/abis');

  if (!fs.existsSync(webAbisDir)) {
    fs.mkdirSync(webAbisDir, { recursive: true });
  }

  const indexExports: string[] = [];

  for (const name of CONTRACT_NAMES) {
    const artifactPath = path.join(artifactsDir, `${name}.sol`, `${name}.json`);
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      const tsContent = `export const ${name}Abi = ${JSON.stringify(artifact.abi, null, 2)} as const;\n`;
      fs.writeFileSync(path.join(webAbisDir, `${name}Abi.ts`), tsContent);
      indexExports.push(`export { ${name}Abi } from './${name}Abi';`);
      console.log(`Exported ABI for ${name}`);
    } else {
      console.warn(`Artifact not found: ${artifactPath}`);
    }
  }

  fs.writeFileSync(path.join(webAbisDir, 'index.ts'), indexExports.join('\n') + '\n');
  console.log('All contract ABIs exported to apps/web/src/lib/abis/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
