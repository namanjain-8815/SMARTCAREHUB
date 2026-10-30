import { openDB, IDBPDatabase } from 'idb';

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_STORE === 'true';

export interface MockRecord {
  owner: string;
  contentHash: string;
  encryptedCID: string;
  timestamp: number;
  revoked: boolean;
  metadata?: {
    title: string;
    category: string;
    encryptedData?: string; // Base64 ciphertext for dev display
  };
}

export interface MockDelegation {
  id?: number;
  grantor: string;
  delegate: string;
  role: number; // 1 = READ_ONLY, 2 = READ_WRITE
  expiresAt: number;
  revoked: boolean;
  encryptedKey: string;
}

export interface MockDosageEvent {
  eventHash: string;
  patient: string;
  medicationId: string;
  scheduledAt: number;
  confirmedAt: number;
}

export interface MockCredential {
  tokenId: number;
  holder: string;
  issuer: string;
  credentialType: string;
  issuedAt: number;
  expiresAt: number;
  dataHash: string;
  revoked: boolean;
}

export interface MockTriagePayload {
  owner: string;
  encryptedCID: string;
  guardians: string[];
  active: boolean;
}

export interface MockAuditEntry {
  id?: number;
  patient: string;
  accessedBy: string;
  reason: string;
  timestamp: number;
  txHash: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB is only accessible in the browser');
  }
  if (!dbPromise) {
    dbPromise = openDB('smartcarehub-dev', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('records')) {
          db.createObjectStore('records', { keyPath: 'contentHash' });
        }
        if (!db.objectStoreNames.contains('delegations')) {
          db.createObjectStore('delegations', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('adherence')) {
          db.createObjectStore('adherence', { keyPath: 'eventHash' });
        }
        if (!db.objectStoreNames.contains('credentials')) {
          db.createObjectStore('credentials', { keyPath: 'tokenId' });
        }
        if (!db.objectStoreNames.contains('triage')) {
          db.createObjectStore('triage', { keyPath: 'owner' });
        }
        if (!db.objectStoreNames.contains('auditLog')) {
          db.createObjectStore('auditLog', { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

// ─── Record Store Helpers ──────────────────────────────────────────────────
export async function mockSaveRecord(record: MockRecord): Promise<void> {
  const db = await getDB();
  await db.put('records', record);
}

export async function mockGetRecords(owner: string): Promise<MockRecord[]> {
  const db = await getDB();
  const all = (await db.getAll('records')) as MockRecord[];
  return all.filter((r) => r.owner.toLowerCase() === owner.toLowerCase());
}

export async function mockRevokeRecord(contentHash: string): Promise<void> {
  const db = await getDB();
  const record = (await db.get('records', contentHash)) as MockRecord | undefined;
  if (record) {
    record.revoked = true;
    await db.put('records', record);
  }
}

// ─── Delegation Helpers ────────────────────────────────────────────────────
export async function mockGrantDelegation(delegation: Omit<MockDelegation, 'id'>): Promise<number> {
  const db = await getDB();
  return (await db.add('delegations', delegation)) as number;
}

export async function mockGetDelegations(grantor: string): Promise<MockDelegation[]> {
  const db = await getDB();
  const all = (await db.getAll('delegations')) as MockDelegation[];
  return all.filter((d) => d.grantor.toLowerCase() === grantor.toLowerCase());
}

export async function mockRevokeDelegation(id: number): Promise<void> {
  const db = await getDB();
  const del = (await db.get('delegations', id)) as MockDelegation | undefined;
  if (del) {
    del.revoked = true;
    await db.put('delegations', del);
  }
}

// ─── Adherence Helpers ─────────────────────────────────────────────────────
export async function mockLogDosage(event: MockDosageEvent): Promise<void> {
  const db = await getDB();
  await db.put('adherence', event);
}

export async function mockGetDosageLogs(patient: string): Promise<MockDosageEvent[]> {
  const db = await getDB();
  const all = (await db.getAll('adherence')) as MockDosageEvent[];
  return all.filter((e) => e.patient.toLowerCase() === patient.toLowerCase());
}

// ─── Credentials Helpers ───────────────────────────────────────────────────
export async function mockIssueCredential(cred: MockCredential): Promise<void> {
  const db = await getDB();
  await db.put('credentials', cred);
}

export async function mockGetCredentials(holder: string): Promise<MockCredential[]> {
  const db = await getDB();
  const all = (await db.getAll('credentials')) as MockCredential[];
  return all.filter((c) => c.holder.toLowerCase() === holder.toLowerCase());
}

// ─── Triage & Break-Glass Helpers ──────────────────────────────────────────
export async function mockSetTriage(triage: MockTriagePayload): Promise<void> {
  const db = await getDB();
  await db.put('triage', triage);
}

export async function mockGetTriage(owner: string): Promise<MockTriagePayload | undefined> {
  const db = await getDB();
  return db.get('triage', owner);
}

export async function mockRecordAudit(audit: Omit<MockAuditEntry, 'id'>): Promise<number> {
  const db = await getDB();
  return (await db.add('auditLog', audit)) as number;
}

export async function mockGetAuditLogs(patient: string): Promise<MockAuditEntry[]> {
  const db = await getDB();
  const all = (await db.getAll('auditLog')) as MockAuditEntry[];
  return all.filter((a) => a.patient.toLowerCase() === patient.toLowerCase());
}

export async function mockGetAllAuditLogs(): Promise<MockAuditEntry[]> {
  const db = await getDB();
  return db.getAll('auditLog');
}
