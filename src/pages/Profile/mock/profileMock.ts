const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// ── User Profile ──

export interface MockUserProfile {
  displayName: string;
  email: string;
  accountId: string;
  avatarUrl: string;
  phone: string;
  givenName: string;
  familyName: string;
  createdAt: string;
  lastLoginAt: string;
}

let userProfile: MockUserProfile = {
  displayName: 'John Doe',
  email: 'john.doe@example.com',
  accountId: 'acc-001-abc-xyz',
  avatarUrl: '',
  phone: '+1 555-0123',
  givenName: 'John',
  familyName: 'Doe',
  createdAt: '2024-06-15T10:30:00Z',
  lastLoginAt: '2026-03-10T08:15:00Z',
};

export async function fetchProfile(): Promise<MockUserProfile> {
  await delay();
  return { ...userProfile };
}

export async function updateProfile(patch: Partial<MockUserProfile>): Promise<MockUserProfile> {
  await delay();
  userProfile = { ...userProfile, ...patch };
  return { ...userProfile };
}

export async function uploadAvatar(_file: File): Promise<{ avatarUrl: string }> {
  await delay(500);
  const url = URL.createObjectURL(_file);
  userProfile.avatarUrl = url;
  return { avatarUrl: url };
}

export async function resetPassword(): Promise<void> {
  await delay(400);
}

// ── API Keys ──

export interface MockApiKey {
  id: string;
  name: string;
  key: string;
  keyMasked: string;
  expiresAt: string;
  expired: boolean;
  createdAt: string;
}

let nextKeyId = 500;
let apiKeys: MockApiKey[] = [
  { id: 'k1', name: 'Dev Key', key: '', keyMasked: 'sk-****...ab12', expiresAt: '2027-01-01T00:00:00Z', expired: false, createdAt: '2026-01-10T08:00:00Z' },
  { id: 'k2', name: 'CI/CD Pipeline', key: '', keyMasked: 'sk-****...cd34', expiresAt: '', expired: false, createdAt: '2026-02-20T14:00:00Z' },
  { id: 'k3', name: 'Old Key', key: '', keyMasked: 'sk-****...ef56', expiresAt: '2025-06-01T00:00:00Z', expired: true, createdAt: '2025-01-05T10:00:00Z' },
];

export async function listGlobalApiKeys(): Promise<MockApiKey[]> {
  await delay(200);
  return apiKeys.map((k) => ({ ...k }));
}

export async function createGlobalApiKey(body: { name?: string; expiresAt?: string }): Promise<MockApiKey> {
  await delay();
  const id = `k${nextKeyId++}`;
  const rawKey = `sk-global-${id}-${Math.random().toString(36).slice(2, 14)}`;
  const key: MockApiKey = {
    id, name: body.name || 'Unnamed Key', key: rawKey,
    keyMasked: `sk-****...${rawKey.slice(-4)}`,
    expiresAt: body.expiresAt || '', expired: false,
    createdAt: new Date().toISOString(),
  };
  apiKeys.push(key);
  return { ...key };
}

export async function deleteGlobalApiKey(id: string | null): Promise<void> {
  await delay();
  if (id) apiKeys = apiKeys.filter((k) => k.id !== id);
}
