// Simple file-based database for users
import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  username: string;
  password: string;
  createdAt: string;
  lastLogin?: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'users.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Helper functions for file-based database
export function getUsersFromFile(): User[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

export function saveUsersToFile(users: User[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
  }
}

export function createUser(username: string, password: string): User {
  return {
    id: Date.now().toString() + Math.floor(Math.random() * 1000),
    username,
    password, // In production, hash this password
    createdAt: new Date().toISOString(),
  };
}

export function findUserByUsername(username: string): User | null {
  const users = getUsersFromFile();
  return users.find(user => user.username === username) || null;
}

export function validateUser(username: string, password: string): User | null {
  const user = findUserByUsername(username);
  if (user && user.password === password) {
    return user;
  }
  return null;
}

// Initialize with default admin user if no users exist
export function initializeDefaultUser() {
  const users = getUsersFromFile();
  if (users.length === 0) {
    const adminUser = createUser('admin', 'admin123');
    users.push(adminUser);
    saveUsersToFile(users);
    console.log('Default admin user created: admin/admin123');
  }
}
