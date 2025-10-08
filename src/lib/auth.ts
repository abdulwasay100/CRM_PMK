// Simple database for users
// This will store user credentials

export interface User {
  id: string;
  username: string;
  password: string; // In real app, this should be hashed
  createdAt: string;
  lastLogin?: string;
}

// Helper functions for localStorage database
export function getUsersFromStorage(): User[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('users');
  if (data) {
    try { 
      return JSON.parse(data); 
    } catch { 
      return []; 
    }
  }
  return [];
}

export function saveUsersToStorage(users: User[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('users', JSON.stringify(users));
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
  const users = getUsersFromStorage();
  return users.find(user => user.username === username) || null;
}

export function validateUser(username: string, password: string): User | null {
  const user = findUserByUsername(username);
  if (user && user.password === password) {
    return user;
  }
  return null;
}
