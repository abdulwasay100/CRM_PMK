# Polymath Kid Hub - Database Structure



## 1. LEADS Table (Main Lead Management)

### Table: `leads`
```sql
CREATE TABLE leads (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    dob DATE, -- Date of Birth (optional)
    age INTEGER, -- Calculated from DOB or manually entered
    country VARCHAR(100) NOT NULL, -- Dropdown selection
    city VARCHAR(100) NOT NULL, -- Dropdown selection
    parent_name VARCHAR(255) NOT NULL,
    lead_status ENUM('NEW', 'CONTACTED', 'NOT_INTERESTED', 'CONVERTED') DEFAULT 'NEW',
    inquiry_source ENUM('WEBSITE', 'SOCIAL_MEDIA', 'REFERRAL', 'ADVERTISEMENT', 'WALK_IN', 'PHONE_CALL'),
    interested_course ENUM('MATH', 'SCIENCE', 'ENGLISH', 'PROGRAMMING', 'ART', 'MUSIC'),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Table: `lead_history`
```sql
CREATE TABLE lead_history (
    id VARCHAR(36) PRIMARY KEY,
    lead_id VARCHAR(36) NOT NULL,
    lead_name VARCHAR(255) NOT NULL,
    parent_name VARCHAR(255) NOT NULL,
    interested_course ENUM('MATH', 'SCIENCE', 'ENGLISH', 'PROGRAMMING', 'ART', 'MUSIC'),
    age INTEGER,
    city VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    lead_registered_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
```

## 2. REMINDERS/TASKS Table (For Lead-specific Reminders)

### Table: `reminders`
```sql
CREATE TABLE reminders (
    id VARCHAR(36) PRIMARY KEY,
    lead_id VARCHAR(36) NOT NULL,
    lead_name VARCHAR(255) NOT NULL,
    lead_phone VARCHAR(20) NOT NULL, -- Lead's phone number for quick reference
    type ENUM('CALL_BACK', 'SEND_BROCHURE', 'CONFIRM_REGISTRATION'),
    due_date DATE NOT NULL,
    notes TEXT,
    status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'PENDING',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
```

## 3. OFFER & MESSAGE GENERATOR

### Table: `course_data`
```sql
CREATE TABLE course_data (
    id VARCHAR(36) PRIMARY KEY,
    course_name ENUM('MATH', 'SCIENCE', 'ENGLISH', 'PROGRAMMING', 'ART', 'MUSIC') NOT NULL,
    mode ENUM('ONE_ON_ONE', 'GROUP') NOT NULL,
    fees DECIMAL(10,2) NOT NULL,
    duration VARCHAR(100) NOT NULL, -- e.g., '3 months'
    schedules JSON, -- Array of available schedules
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `sent_messages`
```sql
CREATE TABLE sent_messages (
    id VARCHAR(36) PRIMARY KEY,
    lead_id VARCHAR(36) NOT NULL,
    lead_name VARCHAR(255) NOT NULL,
    message_type ENUM('WHATSAPP', 'EMAIL') NOT NULL,
    content TEXT NOT NULL,
    attachments JSON, -- Array of attachment file paths
    sent_from_phone VARCHAR(20), -- Which phone number was used
    status ENUM('SENT', 'DELIVERED', 'FAILED') DEFAULT 'SENT',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
```

## 4. PHONE NUMBERS (For Message Sending)

### Table: `phone_numbers`
```sql
CREATE TABLE phone_numbers (
    id VARCHAR(36) PRIMARY KEY,
    number VARCHAR(20) NOT NULL,
    label VARCHAR(100) NOT NULL, -- e.g., 'Main Office', 'Support'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 5. GROUPS (For Campaign Targeting)

### Table: `groups`
```sql
CREATE TABLE groups (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('AGE', 'COURSE', 'CITY', 'ADMISSION_STATUS') NOT NULL,
    criteria VARCHAR(255) NOT NULL, -- e.g., 'Age 4-7', 'Math', 'Karachi', 'New'
    lead_ids JSON, -- Array of lead IDs in this group
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 6. CAMPAIGN MANAGEMENT

### Table: `campaigns`
```sql
CREATE TABLE campaigns (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('FLYERS', 'ANNOUNCEMENTS', 'REMINDERS', 'TARGETED') NOT NULL,
    group_ids JSON, -- Array of selected group IDs
    message TEXT,
    status ENUM('ACTIVE', 'NON_ACTIVE') DEFAULT 'ACTIVE',
    sent_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_at TIMESTAMP NULL
);
```

### Table: `campaign_messages`
```sql
CREATE TABLE campaign_messages (
    id VARCHAR(36) PRIMARY KEY,
    campaign_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    lead_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    attachments JSON, -- Array of attachment file paths
    sent_from_phone VARCHAR(20) NOT NULL,
    sent_via ENUM('WHATSAPP', 'EMAIL') NOT NULL,
    status ENUM('SENT', 'DELIVERED', 'FAILED') DEFAULT 'SENT',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
```

## 7. DISCOUNTS

### Table: `discounts`
```sql
CREATE TABLE discounts (
    id VARCHAR(36) PRIMARY KEY,
    lead_id VARCHAR(36) NOT NULL,
    lead_name VARCHAR(255) NOT NULL,
    discount_type ENUM('EARLY_BIRD', 'SIBLING', 'REFERRAL', 'SPECIAL_OFFER') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
```

## 8. USERS (For System Management)

### Table: `users`
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'COUNSELOR', 'MANAGER') DEFAULT 'COUNSELOR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Key Relationships and Features:

### 1. Lead Management:
- Lead details include phone, email, name, age, city, parent name
- Lead history tracks all changes and actions
- Age is calculated from DOB or manually entered
- Country and city are dropdown selections

### 2. Lead History Display:
- All lead information is stored and can be displayed in lead history
- History tracks actions like 'Lead Created', status changes, etc.

### 3. Reminders/Tasks:
- Lead-specific reminders for call backs, brochures, registration confirmations
- Tracks status and completion

### 4. Offer & Message Generator:
- Course selection with mode (One on One/Group)
- Dynamic fee calculation with discounts
- Duration and schedule selection
- Attachment support
- Phone number selection for sending

### 5. Message Templates:
- Predefined templates for different categories
- Variable support for personalization
- Active/inactive status

### 6. Campaign System:
- Campaign creation with group selection
- Message composition and attachment support
- Phone number tracking for sent messages
- Campaign message history

### 7. Groups:
- Age-wise, course-wise, location-wise, admission status-wise grouping
- Automatic lead assignment to relevant groups
- Campaign targeting based on groups

### 8. Phone Number Management:
- Multiple phone numbers for sending messages
- Tracking which number was used for each message

## Frontend Integration Notes:

1. **Lead Form**: Includes all required fields (name, phone, email, age, city, parent name)
2. **Lead History**: Shows complete lead information in history section
3. **Offer Generator**: Course selection → Mode selection → Fee calculation → Discount application → Duration/Schedule → Attachment → Phone selection → Send
4. **Campaign Creation**: Select groups → Create campaign → Compose message → Add attachments → Select phone number → Send
5. **Message Tracking**: Store which phone number was used for each message
6. **Group Management**: Automatic grouping based on lead criteria

## API Endpoints Needed:

- `/api/leads` - CRUD operations for leads
- `/api/leads/{id}/history` - Lead history
- `/api/reminders` - CRUD for reminders
- `/api/course-data` - Course information and pricing
- `/api/message-templates` - Template management
- `/api/sent-messages` - Message tracking
- `/api/phone-numbers` - Phone number management
- `/api/groups` - Group management
- `/api/campaigns` - Campaign management
- `/api/campaign-messages` - Campaign message tracking
- `/api/discounts` - Discount management 