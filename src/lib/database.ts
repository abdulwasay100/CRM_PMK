import mysql from 'mysql2/promise';
import { DB_CONFIG } from '@/config/database';

// Database configuration
const dbConfig = {
  ...DB_CONFIG,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Initialize database and create tables
export async function initializeDatabase() {
  try {
    // Create database if it doesn't exist
    await pool.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    console.log(`✅ Database '${dbConfig.database}' ready`);

    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Insert default admin user if not exists
    const [existingAdmin] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    );

    if ((existingAdmin as any[]).length === 0) {
      await pool.execute(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        ['admin', 'admin123']
      );
      console.log('✅ Default admin user created (admin/admin123)');
    }

    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

// User operations
export async function createUser(username: string, password: string) {
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password]
    );
    return { success: true, userId: (result as any).insertId };
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, error: 'Username already exists' };
    }
    return { success: false, error: 'Database error' };
  }
}

export async function findUserByUsername(username: string) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return (rows as any[])[0] || null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

export async function findUserById(id: number) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return (rows as any[])[0] || null;
  } catch (error) {
    console.error('Error finding user by id:', error);
    return null;
  }
}

export async function validateUser(username: string, password: string) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    return (rows as any[])[0] || null;
  } catch (error) {
    console.error('Error validating user:', error);
    return null;
  }
}

export async function updateUserPassword(username: string, newPassword: string) {
  try {
    const [result] = await pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?',
      [newPassword, username]
    );
    return { success: true, affectedRows: (result as any).affectedRows };
  } catch (error) {
    console.error('Error updating password:', error);
    return { success: false, error: 'Database error' };
  }
}

export async function getAllUsers() {
  try {
    const [rows] = await pool.execute('SELECT id, username, created_at FROM users');
    return rows as any[];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
}

export { pool };
