# MySQL Database Setup for CRM PMK

## Prerequisites
- MySQL Server installed and running
- MySQL root access

## Step 1: Create Database
```sql
CREATE DATABASE crm_pmk;
```

## Step 2: Update Database Configuration
Edit `src/config/database.ts` and update the password if needed:
```typescript
export const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'YOUR_MYSQL_PASSWORD', // Update this
  database: 'crm_pmk',
  port: 3306,
};
```

## Step 3: Run the Application
The application will automatically:
- Create the `users` table
- Insert default admin user (admin/admin123)

## Step 4: Test Database Connection
The application will show connection status in console:
- ✅ Database connected successfully
- ✅ Database 'crm_pmk' ready
- ✅ Users table created
- ✅ Default admin user created (admin/admin123)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Default Credentials
- **Username:** admin
- **Password:** admin123

## Troubleshooting

### Connection Issues
1. Check if MySQL is running: `brew services start mysql` (macOS)
2. Verify password in `src/config/database.ts`
3. Check MySQL port (default: 3306)

### Permission Issues
```sql
GRANT ALL PRIVILEGES ON crm_pmk.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

## API Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/change-password` - Password change
- `POST /api/auth/logout` - User logout
