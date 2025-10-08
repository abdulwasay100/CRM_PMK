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

    // Create leads table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        parent_name VARCHAR(100),
        date_of_birth DATE NULL,
        age INT NULL,
        country VARCHAR(100),
        city VARCHAR(100),
        phone VARCHAR(30),
        email VARCHAR(150),
        notes TEXT,
        inquiry_source VARCHAR(100),
        interested_course VARCHAR(100),
        lead_status ENUM('New','Contacted','Converted','Not Interested') DEFAULT 'New',
        reminder_type VARCHAR(100),
        reminder_due DATETIME NULL,
        reminder_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Leads table created');

    // Create converted_leads table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS converted_leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lead_id INT NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        course VARCHAR(100) NOT NULL,
        converted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Converted leads table created');

    // Create reminders table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lead_id INT NOT NULL,
        lead_name VARCHAR(100) NOT NULL,
        phone VARCHAR(30),
        type VARCHAR(100) NOT NULL,
        due_date DATETIME NOT NULL,
        notes TEXT,
        status ENUM('Pending','In Progress','Completed','Not Started') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Reminders table created');

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

// Leads operations
export type NewLead = {
  full_name: string;
  parent_name?: string;
  date_of_birth?: string | null; // YYYY-MM-DD
  age?: number | null;
  country?: string;
  city?: string;
  phone?: string;
  email?: string;
  notes?: string;
  inquiry_source?: string;
  interested_course?: string;
  lead_status?: 'New' | 'Contacted' | 'Converted' | 'Not Interested';
  reminder_type?: string;
  reminder_due?: string | null; // ISO datetime
  reminder_notes?: string;
}

export async function createLead(lead: NewLead) {
  const sql = `
    INSERT INTO leads (
      full_name, parent_name, date_of_birth, age, country, city, phone, email,
      notes, inquiry_source, interested_course, lead_status, reminder_type,
      reminder_due, reminder_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    lead.full_name,
    lead.parent_name || null,
    lead.date_of_birth || null,
    lead.age ?? null,
    lead.country || null,
    lead.city || null,
    lead.phone || null,
    lead.email || null,
    lead.notes || null,
    lead.inquiry_source || null,
    lead.interested_course || null,
    lead.lead_status || 'New',
    lead.reminder_type || null,
    lead.reminder_due || null,
    lead.reminder_notes || null,
  ];
  const [result] = await pool.execute(sql, params);
  return { id: (result as any).insertId };
}

export async function getLeads() {
  const [rows] = await pool.execute('SELECT * FROM leads ORDER BY created_at DESC');
  return rows as any[];
}

export async function updateLead(id: number, fields: Partial<NewLead>) {
  const keys = Object.keys(fields) as (keyof NewLead)[]
  if (keys.length === 0) return { affectedRows: 0 }
  const setClause = keys.map(k => `${
    k === 'full_name' ? 'full_name' :
    k === 'parent_name' ? 'parent_name' :
    k === 'date_of_birth' ? 'date_of_birth' :
    k as string
  } = ?`).join(', ')
  const params = keys.map(k => (fields as any)[k])
  const [result] = await pool.execute(`UPDATE leads SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...params, id])
  return { affectedRows: (result as any).affectedRows }
}

export async function deleteLead(id: number) {
  const [result] = await pool.execute('DELETE FROM leads WHERE id = ?', [id])
  return { affectedRows: (result as any).affectedRows }
}

export async function convertLead(leadId: number) {
  // fetch lead info
  const [rows] = await pool.execute('SELECT id, full_name, interested_course FROM leads WHERE id = ?', [leadId]);
  const lead = (rows as any[])[0];
  if (!lead) return { success: false, error: 'Lead not found' };
  await pool.execute('UPDATE leads SET lead_status = "Converted" WHERE id = ?', [leadId]);
  await pool.execute(
    'INSERT INTO converted_leads (lead_id, full_name, course) VALUES (?, ?, ?)',
    [lead.id, lead.full_name, lead.interested_course || '']
  );
  return { success: true };
}

export async function getConvertedLeads() {
  const [rows] = await pool.execute('SELECT * FROM converted_leads ORDER BY converted_at DESC');
  return rows as any[];
}

// Reminders operations
export type NewReminder = {
  lead_id: number;
  lead_name: string;
  phone?: string;
  type: string;
  due_date: string; // ISO datetime or YYYY-MM-DD
  notes?: string;
  status?: 'Pending' | 'In Progress' | 'Completed' | 'Not Started';
}

export async function createReminder(reminder: NewReminder) {
  const sql = `INSERT INTO reminders (lead_id, lead_name, phone, type, due_date, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    reminder.lead_id,
    reminder.lead_name,
    reminder.phone || null,
    reminder.type,
    reminder.due_date,
    reminder.notes || null,
    reminder.status || 'Pending',
  ];
  const [result] = await pool.execute(sql, params);
  return { id: (result as any).insertId };
}

export async function getReminders() {
  const [rows] = await pool.execute('SELECT * FROM reminders ORDER BY due_date ASC');
  return rows as any[];
}

export async function getRemindersByLead(leadId: number) {
  const [rows] = await pool.execute('SELECT * FROM reminders WHERE lead_id = ? ORDER BY due_date ASC', [leadId]);
  return rows as any[];
}

export async function updateReminderStatus(id: number, status: 'Pending' | 'In Progress' | 'Completed' | 'Not Started') {
  const [result] = await pool.execute('UPDATE reminders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
  return { affectedRows: (result as any).affectedRows };
}

export async function deleteReminder(id: number) {
  const [result] = await pool.execute('DELETE FROM reminders WHERE id = ?', [id]);
  return { affectedRows: (result as any).affectedRows };
}

export async function updateLeadReminder(
  leadId: number,
  reminderType: string,
  reminderDue: string,
  reminderNotes?: string | null,
) {
  const [result] = await pool.execute(
    'UPDATE leads SET reminder_type = ?, reminder_due = ?, reminder_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [reminderType, reminderDue, reminderNotes || null, leadId]
  );
  return { affectedRows: (result as any).affectedRows };
}
