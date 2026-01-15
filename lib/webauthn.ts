import crypto from 'crypto';
import Redis from 'ioredis';

// Define our own type since AuthenticatorDevice is not exported in v9.x
export type AuthenticatorDevice = {
  credentialID: number[]; // Store as array for JSON serialization
  credentialPublicKey: number[]; // Store as array for JSON serialization
  counter: number;
  transports?: AuthenticatorTransport[];
};

export type StoredUser = {
  id: string;
  username: string;
  devices: AuthenticatorDevice[];
  currentChallenge?: string;
};

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const KV_PREFIX = 'passkey:user:';

export function getRpID(host?: string) {
  if (process.env.RP_ID) return process.env.RP_ID;
  if (host) return host.split(':')[0]; // Remove port if present
  return 'localhost';
}

export function getOrigin(host?: string) {
  if (process.env.RP_ORIGIN) return process.env.RP_ORIGIN;
  if (host) {
    // Use https for production, http for localhost
    const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
    const protocol = isLocalhost ? 'http' : 'https';
    return `${protocol}://${host}`;
  }
  return 'http://localhost:3000';
}

export async function getUser(username: string): Promise<StoredUser | null> {
  try {
    const data = await redis.get(`${KV_PREFIX}${username}`);
    if (!data) return null;
    return JSON.parse(data) as StoredUser;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

export async function getOrCreateUser(username: string): Promise<StoredUser> {
  const existing = await getUser(username);
  if (existing) return existing;

  const user: StoredUser = {
    id: crypto.randomUUID(),
    username,
    devices: []
  };
  await redis.set(`${KV_PREFIX}${username}`, JSON.stringify(user));
  return user;
}

export async function setCurrentChallenge(username: string, challenge?: string) {
  const user = await getUser(username);
  if (!user) return;
  user.currentChallenge = challenge;
  await redis.set(`${KV_PREFIX}${username}`, JSON.stringify(user));
}

export async function addDevice(username: string, device: {
  credentialID: Uint8Array;
  credentialPublicKey: Uint8Array;
  counter: number;
  transports?: AuthenticatorTransport[];
}) {
  const user = await getUser(username);
  if (!user) return;

  // Convert Uint8Array to number array for JSON serialization
  user.devices.push({
    credentialID: Array.from(device.credentialID),
    credentialPublicKey: Array.from(device.credentialPublicKey),
    counter: device.counter,
    transports: device.transports
  });
  await redis.set(`${KV_PREFIX}${username}`, JSON.stringify(user));
}

export function findDeviceByID(user: StoredUser, credentialID: string) {
  return user.devices.find((device) => {
    const deviceID = Buffer.from(device.credentialID).toString('base64url');
    return deviceID === credentialID;
  });
}

// Helper to convert stored device to WebAuthn format
export function toAuthenticatorDevice(device: AuthenticatorDevice) {
  return {
    credentialID: new Uint8Array(device.credentialID),
    credentialPublicKey: new Uint8Array(device.credentialPublicKey),
    counter: device.counter,
    transports: device.transports
  };
}
