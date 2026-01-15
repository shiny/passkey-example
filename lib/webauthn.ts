import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Define our own type since AuthenticatorDevice is not exported in v9.x
export type AuthenticatorDevice = {
  credentialID: Uint8Array;
  credentialPublicKey: Uint8Array;
  counter: number;
  transports?: AuthenticatorTransport[];
};

export type StoredUser = {
  id: string;
  username: string;
  devices: AuthenticatorDevice[];
  currentChallenge?: string;
};

// File-based storage to persist data across server restarts
const DATA_FILE = path.join(process.cwd(), 'users.json');

function loadUsers(): Map<string, StoredUser> {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      // Convert devices arrays - restore Uint8Array from stored arrays
      for (const user of Object.values(data) as StoredUser[]) {
        user.devices = user.devices.map((device: any) => ({
          ...device,
          credentialID: new Uint8Array(Object.values(device.credentialID)),
          credentialPublicKey: new Uint8Array(Object.values(device.credentialPublicKey))
        }));
      }
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error('Failed to load users:', error);
  }
  return new Map();
}

function saveUsers(users: Map<string, StoredUser>) {
  try {
    const data: Record<string, StoredUser> = {};
    for (const [key, user] of users) {
      data[key] = {
        ...user,
        devices: user.devices.map((device) => ({
          ...device,
          // Convert Uint8Array to plain object for JSON serialization
          credentialID: Object.fromEntries([...device.credentialID].map((v, i) => [i, v])),
          credentialPublicKey: Object.fromEntries([...device.credentialPublicKey].map((v, i) => [i, v]))
        })) as any
      };
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save users:', error);
  }
}

let users = loadUsers();

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

export function getUser(username: string) {
  users = loadUsers(); // Reload to get latest data
  return users.get(username);
}

export function getOrCreateUser(username: string) {
  users = loadUsers(); // Reload to get latest data
  const existing = users.get(username);
  if (existing) return existing;

  const user: StoredUser = {
    id: crypto.randomUUID(),
    username,
    devices: []
  };
  users.set(username, user);
  saveUsers(users);
  return user;
}

export function setCurrentChallenge(username: string, challenge?: string) {
  const user = users.get(username);
  if (!user) return;
  user.currentChallenge = challenge;
  saveUsers(users);
}

export function addDevice(username: string, device: AuthenticatorDevice) {
  const user = users.get(username);
  if (!user) return;
  user.devices.push(device);
  saveUsers(users);
}

export function updateDeviceCounter(username: string, credentialID: Uint8Array, newCounter: number) {
  const user = users.get(username);
  if (!user) return;
  const device = user.devices.find((d) => {
    const deviceID = Buffer.from(d.credentialID).toString('base64url');
    const targetID = Buffer.from(credentialID).toString('base64url');
    return deviceID === targetID;
  });
  if (device) {
    device.counter = newCounter;
    saveUsers(users);
  }
}

export function findDeviceByID(user: StoredUser, credentialID: string) {
  return user.devices.find((device) => {
    const deviceID = Buffer.from(device.credentialID).toString('base64url');
    return deviceID === credentialID;
  });
}
