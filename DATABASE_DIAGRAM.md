# Polymath Kid Hub - Database Relationship Diagram

## Main Tables and Their Relationships

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      LEADS      │    │   LEAD_PHONES   │    │   LEAD_EMAILS   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │◄───┤ lead_id (FK)    │    │ lead_id (FK)    │
│ full_name       │    │ phone_number    │    │ email           │
│ dob             │    │ is_primary      │    │ is_primary      │
│ age             │    └─────────────────┘    └─────────────────┘
│ country         │
│ city            │    ┌─────────────────┐
│ parent_name     │    │  LEAD_HISTORY   │
│ lead_status     │    ├─────────────────┤
│ inquiry_source  │◄───┤ lead_id (FK)    │
│ course_pref     │    │ action          │
│ notes           │    │ details         │
└─────────────────┘    │ counselor_id    │
                       └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ REMINDERS_TASKS │    │    OFFERS       │    │  OFFER_TYPES    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ lead_id (FK)    │◄───┤ offer_type_id  │◄───┤ name            │
│ lead_name       │    │ course_name     │    │ description     │
│ lead_phone      │    │ mode            │    │ is_active       │
│ type            │    │ original_fees   │    └─────────────────┘
│ due_date        │    │ discount_%      │
│ notes           │    │ discount_amount │    ┌─────────────────┐
│ status          │    │ final_fees      │    │ MESSAGE_TEMPL   │
│ assigned_to     │    │ discount_type   │    ├─────────────────┤
│ priority        │    │ duration        │    │ id (PK)         │
└─────────────────┘    │ schedule        │    │ name            │
                       │ status          │    │ category        │
                       │ template_msg    │    │ content         │
                       └─────────────────┘    │ variables       │
                                              └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRAUD_LEADS   │    │   CAMPAIGNS     │    │     GROUPS      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ name            │    │ name            │    │ name            │
│ phone           │    │ type            │    │ type            │
│ email           │    │ group_type      │    │ criteria        │
│ provided_city   │    │ status          │    │ lead_ids        │
│ provided_country│    │ target_leads    │    └─────────────────┘
│ ip_location     │    │ message_content │
│ device_info     │    │ scheduled_at    │    ┌─────────────────┐
│ status          │    │ sent_count      │    │    DISCOUNTS    │
│ action_taken    │    │ open_rate       │    ├─────────────────┤
│ detection_reason│    │ click_rate      │    │ id (PK)         │
└─────────────────┘    └─────────────────┘    │ lead_id (FK)    │◄───┐
                                              │ lead_name       │    │
┌─────────────────┐    ┌─────────────────┐    │ discount_type   │    │
│ SENT_MESSAGES   │    │     USERS       │    │ amount          │    │
├─────────────────┤    ├─────────────────┤    │ percentage      │    │
│ id (PK)         │    │ id (PK)         │    │ reason          │    │
│ template_id (FK)│    │ username        │    │ is_active       │    │
│ lead_id (FK)    │◄───┤ email           │    │ expires_at      │    │
│ message_type    │    │ full_name       │    └─────────────────┘    │
│ content         │    │ role            │                           │
│ recipient       │    │ is_active       │                           │
│ status          │    └─────────────────┘                           │
│ sent_at         │                                                  │
│ read_at         │                                                  │
│ reply_received  │                                                  │
└─────────────────┘                                                  │
                                                                     │
                                                                     │
                    ┌───────────────────────────────────────────────┘
                    │
                    ▼
              ┌─────────────────┐
              │      LEADS      │
              │   (Main Table)  │
              └─────────────────┘
```

## Key Relationships Explained:

### 1. **LEADS** (Central Table)
- **One-to-Many** with `LEAD_PHONES` (one lead can have multiple phones)
- **One-to-Many** with `LEAD_EMAILS` (one lead can have multiple emails)
- **One-to-Many** with `LEAD_HISTORY` (one lead can have multiple history entries)
- **One-to-Many** with `REMINDERS_TASKS` (one lead can have multiple reminders)
- **One-to-Many** with `DISCOUNTS` (one lead can have multiple discounts)
- **One-to-Many** with `SENT_MESSAGES` (one lead can receive multiple messages)

### 2. **OFFER_TYPES** → **OFFERS**
- **One-to-Many** relationship
- Each offer type (STEM, Winter Camp, etc.) can have multiple offers

### 3. **MESSAGE_TEMPLATES** → **SENT_MESSAGES**
- **One-to-Many** relationship
- Each template can be used for multiple sent messages

### 4. **GROUPS** → **CAMPAIGNS**
- Groups define target criteria for campaigns
- Campaigns can target multiple groups

### 5. **USERS** → **REMINDERS_TASKS**
- Users can be assigned to multiple tasks
- Tasks track who is responsible

## Data Flow Examples:

### 1. **New Lead Registration:**
```
LEADS → LEAD_PHONES → LEAD_EMAILS → LEAD_HISTORY
```

### 2. **Creating an Offer:**
```
OFFER_TYPES → OFFERS → MESSAGE_TEMPLATES → SENT_MESSAGES
```

### 3. **Campaign Execution:**
```
GROUPS → CAMPAIGNS → SENT_MESSAGES → LEADS
```

### 4. **Task Management:**
```
LEADS → REMINDERS_TASKS ← USERS
```

### 5. **Fraud Detection:**
```
LEADS → FRAUD_LEADS (when suspicious activity detected)
```

## Important Notes:

1. **Unified Reminders/Tasks**: The `REMINDERS_TASKS` table serves both purposes - lead-specific reminders and general tasks
2. **Multiple Contacts**: Each lead can have multiple phone numbers and emails
3. **History Tracking**: All changes to leads are tracked in `LEAD_HISTORY`
4. **Message Tracking**: All sent messages are stored with delivery status
5. **Fraud Detection**: Separate table for suspicious leads with IP/device tracking
6. **Campaign Targeting**: Groups allow flexible targeting for campaigns
7. **Discount Management**: Discounts are linked to specific leads
8. **User Management**: Users can be assigned to tasks and track their actions

This structure ensures data integrity, scalability, and comprehensive tracking of all lead interactions and business processes. 