import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('SmartCareHub', (m) => {
  const recordRegistry = m.contract('RecordRegistry');
  const delegationManager = m.contract('DelegationManager');
  const adherenceLogger = m.contract('AdherenceLogger');
  const healthProver = m.contract('HealthProver');
  const credentialLocker = m.contract('CredentialLocker');

  return { recordRegistry, delegationManager, adherenceLogger, healthProver, credentialLocker };
});
