import mysql from 'mysql2/promise';
import { DB_CONFIG } from '@/config/database';

// Database configuration
const dbConfig = {
  ...DB_CONFIG,
  waitForConnections: true,
  connectionLimit: 20, // Increased from 10
  queueLimit: 0,
  acquireTimeout: 60000, // 60 seconds
  timeout: 60000, // 60 seconds
  reconnect: true,
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

    // Create lead history table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS lead_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lead_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Lead history table created');

    // Create notifications table (id, type, title/message/meta, created_at)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        meta JSON NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Notifications table created');

    // Create lead_groups table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS lead_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        group_type ENUM('Age', 'Course', 'City', 'Admission Status') NOT NULL,
        criteria VARCHAR(255) NOT NULL,
        lead_ids JSON NOT NULL,
        lead_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Lead groups table created');

    // Drop messages table if exists
    await pool.execute(`DROP TABLE IF EXISTS messages`);
    console.log('✅ Messages table dropped');

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

export async function getLeadById(id: number) {
  const [rows] = await pool.execute('SELECT * FROM leads WHERE id = ?', [id]);
  return (rows as any[])[0] || null;
}

export async function getLeadsByGroup(groupId: number) {
  // First get the group to get the lead_ids
  const group = await getGroupById(groupId);
  if (!group || !group.lead_ids) {
    return [];
  }
  
  // Handle both JSON string and array formats
  let leadIds;
  if (typeof group.lead_ids === 'string') {
    try {
      leadIds = JSON.parse(group.lead_ids);
    } catch (error) {
      console.error('Error parsing lead_ids:', error);
      return [];
    }
  } else {
    leadIds = group.lead_ids;
  }
  
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return [];
  }
  
  // Get leads by IDs
  const placeholders = leadIds.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT * FROM leads WHERE id IN (${placeholders}) ORDER BY created_at DESC`,
    leadIds
  );
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

export async function getConvertedByLead(leadId: number) {
  const [rows] = await pool.execute('SELECT * FROM converted_leads WHERE lead_id = ? ORDER BY converted_at DESC', [leadId]);
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

// Lead history ops
export async function addLeadHistory(leadId: number, action: string, details?: string) {
  const [result] = await pool.execute('INSERT INTO lead_history (lead_id, action, details) VALUES (?, ?, ?)', [leadId, action, details || null]);
  return { id: (result as any).insertId };
}

export async function getLeadHistory(leadId: number) {
  const [rows] = await pool.execute('SELECT * FROM lead_history WHERE lead_id = ? ORDER BY created_at DESC', [leadId]);
  return rows as any[];
}

// ---------------- Notifications helpers ----------------
export type NotificationType = 'no_leads' | 'reminder_status' | 'reports' | 'group_creation';
export type NewNotification = {
  type: NotificationType;
  title: string;
  message?: string;
  meta?: any;
}

export async function createNotification(n: NewNotification) {
  const [result] = await pool.execute(
    'INSERT INTO notifications (type, title, message, meta) VALUES (?, ?, ?, ?)',
    [n.type, n.title, n.message || null, n.meta ? JSON.stringify(n.meta) : null]
  );
  return { id: (result as any).insertId };
}

export async function getNotifications(limit = 100, offset = 0) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 100));
  const safeOffset = Math.max(0, Number(offset) || 0);
  // Inline safe integers for LIMIT/OFFSET (some drivers don't bind LIMIT)
  const [rows] = await pool.execute(
    `SELECT * FROM notifications ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`
  );
  return rows as any[];
}

export async function markNotificationRead(id: number) {
  const [result] = await pool.execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
  return { affectedRows: (result as any).affectedRows };
}

export async function scanLeadThresholdNotifications() {
  const [rows] = await pool.execute('SELECT COUNT(*) AS cnt FROM leads');
  const total = (rows as any[])[0]?.cnt || 0;
  const thresholds = [5,10,20,50,100,150,200,250,300,350,400,450,500,600,700,800,900,1000];
  for (const t of thresholds) {
    if (total >= t) {
      await pool.execute(
        `INSERT INTO notifications (type, title, message, meta)
         SELECT 'no_leads', CONCAT('Leads reached ', ?), CONCAT('Total leads count reached ', ?), JSON_OBJECT('count', ?)
         FROM DUAL WHERE NOT EXISTS (
           SELECT 1 FROM notifications WHERE type='no_leads' AND JSON_EXTRACT(meta,'$.count') = ?
         )`,
        [t, t, t, t]
      );
    }
  }
}

export async function scanDueSoonReminderNotifications() {
  // 1 hour due soon
  const [withinHour] = await pool.execute(
    `SELECT r.* FROM reminders r
     WHERE r.status <> 'Completed' AND r.due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 HOUR)`
  );
  for (const r of withinHour as any[]) {
    await pool.execute(
      `INSERT INTO notifications (type, title, message, meta)
       SELECT 'reminder_status', ?, ?, ? FROM DUAL
       WHERE NOT EXISTS (
         SELECT 1 FROM notifications WHERE type='reminder_status' AND JSON_EXTRACT(meta,'$.reminderId') = ? AND JSON_EXTRACT(meta,'$.tag')='due_1h'
       )`,
      [
        `Reminder due soon (1h): ${r.lead_name}`,
        `${r.type} due at ${r.due_date}`,
        JSON.stringify({ reminderId: r.id, leadId: r.lead_id, tag: 'due_1h' }),
        r.id,
      ]
    );
  }
  // 1 day due soon
  const [withinDay] = await pool.execute(
    `SELECT r.* FROM reminders r
     WHERE r.status <> 'Completed' AND r.due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 DAY)`
  );
  for (const r of withinDay as any[]) {
    await pool.execute(
      `INSERT INTO notifications (type, title, message, meta)
       SELECT 'reminder_status', ?, ?, ? FROM DUAL
       WHERE NOT EXISTS (
         SELECT 1 FROM notifications WHERE type='reminder_status' AND JSON_EXTRACT(meta,'$.reminderId') = ? AND JSON_EXTRACT(meta,'$.tag')='due_1d'
       )`,
      [
        `Reminder due soon (1d): ${r.lead_name}`,
        `${r.type} due at ${r.due_date}`,
        JSON.stringify({ reminderId: r.id, leadId: r.lead_id, tag: 'due_1d' }),
        r.id,
      ]
    );
  }
}

export async function getReminderById(id: number) {
  const [rows] = await pool.execute('SELECT * FROM reminders WHERE id = ?', [id]);
  return (rows as any[])[0] || null;
}

// ---------------- Groups helpers ----------------
export type GroupType = 'Age' | 'Course' | 'City' | 'Admission Status';

export type NewGroup = {
  name: string;
  group_type: GroupType;
  criteria: string;
  lead_ids: number[];
};

export type Group = {
  id: number;
  name: string;
  group_type: GroupType;
  criteria: string;
  lead_ids: number[];
  lead_count: number;
  created_at: string;
  updated_at: string;
};

export async function createGroup(group: NewGroup) {
  const [result] = await pool.execute(
    'INSERT INTO lead_groups (name, group_type, criteria, lead_ids, lead_count) VALUES (?, ?, ?, ?, ?)',
    [group.name, group.group_type, group.criteria, JSON.stringify(group.lead_ids), group.lead_ids.length]
  );
  return { id: (result as any).insertId };
}

export async function getAllGroups() {
  const [rows] = await pool.execute('SELECT * FROM lead_groups ORDER BY created_at DESC');
  return rows as Group[];
}

export async function getGroupById(id: number) {
  const [rows] = await pool.execute('SELECT * FROM lead_groups WHERE id = ?', [id]);
  return (rows as any[])[0] || null;
}

export async function updateGroup(id: number, group: Partial<NewGroup>) {
  const updates = [];
  const values = [];
  
  if (group.name !== undefined) {
    updates.push('name = ?');
    values.push(group.name);
  }
  if (group.group_type !== undefined) {
    updates.push('group_type = ?');
    values.push(group.group_type);
  }
  if (group.criteria !== undefined) {
    updates.push('criteria = ?');
    values.push(group.criteria);
  }
  if (group.lead_ids !== undefined) {
    updates.push('lead_ids = ?');
    updates.push('lead_count = ?');
    values.push(JSON.stringify(group.lead_ids));
    values.push(group.lead_ids.length);
  }
  
  if (updates.length === 0) return { affectedRows: 0 };
  
  values.push(id);
  const [result] = await pool.execute(
    `UPDATE lead_groups SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  return { affectedRows: (result as any).affectedRows };
}

export async function deleteGroup(id: number) {
  const [result] = await pool.execute('DELETE FROM lead_groups WHERE id = ?', [id]);
  return { affectedRows: (result as any).affectedRows };
}

// Auto-create groups based on existing lead data
export async function autoCreateGroupsFromLeads() {
  const [leads] = await pool.execute('SELECT * FROM leads');
  const [existingGroups] = await pool.execute('SELECT * FROM lead_groups');
  
  const existingGroupKeys = new Set(
    (existingGroups as Group[]).map(g => `${g.group_type}:${g.criteria}`)
  );
  
  const newGroups: { group_type: GroupType; criteria: string; name: string }[] = [];
  
  // Predefined age ranges
  const ageRanges = [
    { range: '6-8', min: 6, max: 8 },
    { range: '9-12', min: 9, max: 12 },
    { range: '13-16', min: 13, max: 16 }
  ];
  
  // Create age groups based on predefined ranges
  for (const ageRange of ageRanges) {
    const ageKey = `Age:${ageRange.range}`;
    if (!existingGroupKeys.has(ageKey)) {
      // Check if any leads fall in this age range
      const hasLeadsInRange = (leads as any[]).some(lead => 
        lead.age && lead.age >= ageRange.min && lead.age <= ageRange.max
      );
      
      if (hasLeadsInRange) {
        newGroups.push({
          group_type: 'Age',
          criteria: ageRange.range,
          name: `Age ${ageRange.range}`
        });
        existingGroupKeys.add(ageKey);
      }
    }
  }
  
  for (const lead of leads as any[]) {
    // Create Course group
    if (lead.interested_course) {
      const courseKey = `Course:${lead.interested_course}`;
      if (!existingGroupKeys.has(courseKey)) {
        newGroups.push({
          group_type: 'Course',
          criteria: lead.interested_course,
          name: `${lead.interested_course} Course`
        });
        existingGroupKeys.add(courseKey);
      }
    }
    
    // Create City group
    if (lead.city) {
      const cityKey = `City:${lead.city}`;
      if (!existingGroupKeys.has(cityKey)) {
        newGroups.push({
          group_type: 'City',
          criteria: lead.city,
          name: `${lead.city} Leads`
        });
        existingGroupKeys.add(cityKey);
      }
    }
    
    // Create Admission Status group
    if (lead.lead_status) {
      const statusKey = `Admission Status:${lead.lead_status}`;
      if (!existingGroupKeys.has(statusKey)) {
        newGroups.push({
          group_type: 'Admission Status',
          criteria: lead.lead_status,
          name: `${lead.lead_status} Status`
        });
        existingGroupKeys.add(statusKey);
      }
    }
  }
  
  // Create new groups
  for (const groupData of newGroups) {
    await pool.execute(
      'INSERT INTO lead_groups (name, group_type, criteria, lead_ids, lead_count) VALUES (?, ?, ?, ?, ?)',
      [groupData.name, groupData.group_type, groupData.criteria, JSON.stringify([]), 0]
    );
  }
  
  return newGroups.length;
}

// Auto-assign leads to groups based on criteria
export async function autoAssignLeadsToGroups() {
  const [leads] = await pool.execute('SELECT * FROM leads');
  const [groups] = await pool.execute('SELECT * FROM lead_groups');
  
  for (const group of groups as Group[]) {
    const matchingLeadIds: number[] = [];
    
    for (const lead of leads as any[]) {
      let matches = false;
      
      switch (group.group_type) {
        case 'Age':
          if (lead.age && group.criteria) {
            // Handle age ranges like "6-8", "9-12", "13-16", etc.
            if (group.criteria.includes('-')) {
              const [minAge, maxAge] = group.criteria.split('-').map(Number);
              if (lead.age >= minAge && lead.age <= maxAge) {
                matches = true;
              }
            } else if (group.criteria.includes('+')) {
              // Handle "41+" range
              const minAge = parseInt(group.criteria.replace('+', ''));
              if (lead.age >= minAge) {
                matches = true;
              }
            } else {
              // Single age match (fallback)
              if (lead.age.toString() === group.criteria) {
                matches = true;
              }
            }
          }
          break;
        case 'Course':
          if (lead.interested_course && lead.interested_course === group.criteria) {
            matches = true;
          }
          break;
        case 'City':
          if (lead.city && lead.city === group.criteria) {
            matches = true;
          }
          break;
        case 'Admission Status':
          if (lead.lead_status && lead.lead_status === group.criteria) {
            matches = true;
          }
          break;
      }
      
      if (matches) {
        matchingLeadIds.push(lead.id);
      }
    }
    
    // Update group with matching lead IDs
    if (matchingLeadIds.length > 0) {
      await pool.execute(
        'UPDATE lead_groups SET lead_ids = ?, lead_count = ? WHERE id = ?',
        [JSON.stringify(matchingLeadIds), matchingLeadIds.length, group.id]
      );
    }
  }
}
