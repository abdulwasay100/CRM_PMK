# Polymath Kid Hub - Implementation Guide

## How to Use the Database Structure

### 1. **LEAD MANAGEMENT** - Complete Example

#### Adding a New Lead:
```sql
-- Step 1: Insert main lead record
INSERT INTO leads (
    id, full_name, dob, age, country, city, parent_name, 
    lead_status, inquiry_source, course_preference, additional_notes
) VALUES (
    'lead_001', 'Ahmed Khan', '2010-05-15', 13, 'Pakistan', 'Karachi', 'Muhammad Khan',
    'NEW', 'SOCIAL_MEDIA', 'MATHS', 'Interested in advanced mathematics'
);

-- Step 2: Add phone numbers
INSERT INTO lead_phones (id, lead_id, phone_number, is_primary) VALUES
('phone_001', 'lead_001', '+92-300-1234567', TRUE),
('phone_002', 'lead_001', '+92-301-9876543', FALSE);

-- Step 3: Add email addresses
INSERT INTO lead_emails (id, lead_id, email, is_primary) VALUES
('email_001', 'lead_001', 'ahmed.khan@email.com', TRUE),
('email_002', 'lead_001', 'ahmed.parent@email.com', FALSE);

-- Step 4: Add to history
INSERT INTO lead_history (id, lead_id, action, details, counselor_id) VALUES
('hist_001', 'lead_001', 'Lead Created', 'New lead registered via social media', 'user_001');
```

#### Viewing Lead Information:
```sql
-- Get complete lead information
SELECT 
    l.*,
    GROUP_CONCAT(DISTINCT lp.phone_number) as phones,
    GROUP_CONCAT(DISTINCT le.email) as emails,
    COUNT(lh.id) as history_count
FROM leads l
LEFT JOIN lead_phones lp ON l.id = lp.lead_id
LEFT JOIN lead_emails le ON l.id = le.lead_id
LEFT JOIN lead_history lh ON l.id = lh.lead_id
WHERE l.id = 'lead_001'
GROUP BY l.id;
```

### 2. **REMINDERS/TASKS** - Unified System

#### Creating a Lead-Specific Reminder:
```sql
INSERT INTO reminders_tasks (
    id, lead_id, lead_name, lead_phone, type, due_date, notes, status, assigned_to
) VALUES (
    'reminder_001', 'lead_001', 'Ahmed Khan', '+92-300-1234567',
    'CALL_BACK', '2024-01-15', 'Follow up on math course inquiry', 'PENDING', 'user_001'
);
```

#### Creating a General Task:
```sql
INSERT INTO reminders_tasks (
    id, type, due_date, notes, status, assigned_to
) VALUES (
    'task_001', 'SEND_BROCHURE', '2024-01-20', 'Send winter camp brochures to all leads', 'PENDING', 'user_002'
);
```

#### Viewing Tasks by Lead:
```sql
SELECT * FROM reminders_tasks 
WHERE lead_id = 'lead_001' 
ORDER BY due_date ASC;
```

### 3. **OFFER SYSTEM** - Complete Workflow

#### Creating Offer Types:
```sql
INSERT INTO offer_types (id, name, description) VALUES
('type_001', 'STEM Courses', 'Science, Technology, Engineering, Mathematics'),
('type_002', 'Winter Camp', 'Special winter break programs'),
('type_003', 'Summer Camp', 'Summer vacation learning programs');
```

#### Creating Offers:
```sql
INSERT INTO offers (
    id, offer_type_id, course_name, mode, original_fees, 
    discount_percentage, discount_amount, final_fees, discount_type,
    duration, schedule, status, template_message
) VALUES (
    'offer_001', 'type_001', 'Advanced Mathematics', 'ONE_ON_ONE',
    5000.00, 20.00, 1000.00, 4000.00, 'EARLY_BIRD',
    '3 months', 'Mon/Wed 4-5pm', 'ACTIVE',
    'Special offer: 20% off on Advanced Mathematics course! Duration: 3 months, Schedule: Mon/Wed 4-5pm. Final price: Rs. 4000'
);
```

#### Applying Discount to Lead:
```sql
INSERT INTO discounts (
    id, lead_id, lead_name, discount_type, amount, percentage, reason
) VALUES (
    'discount_001', 'lead_001', 'Ahmed Khan', 'EARLY_BIRD', 1000.00, 20.00,
    'Early bird discount for Advanced Mathematics course'
);
```

### 4. **MESSAGE SYSTEM** - Templates and Tracking

#### Creating Message Templates:
```sql
INSERT INTO message_templates (
    id, name, category, content, variables
) VALUES (
    'template_001', 'Course Offer', 'OFFER',
    'Hello {{name}}, we have a special offer for {{course}}! Price: Rs. {{fees}}. Duration: {{duration}}. Call us at {{phone}}.',
    '["name", "course", "fees", "duration", "phone"]'
);
```

#### Sending Messages:
```sql
INSERT INTO sent_messages (
    id, template_id, lead_id, message_type, content, recipient, status
) VALUES (
    'msg_001', 'template_001', 'lead_001', 'WHATSAPP',
    'Hello Ahmed Khan, we have a special offer for Advanced Mathematics! Price: Rs. 4000. Duration: 3 months. Call us at +92-300-1234567.',
    '+92-300-1234567', 'SENT'
);
```

### 5. **FRAUD DETECTION** - Real-time Monitoring

#### Detecting Suspicious Lead:
```sql
INSERT INTO fraud_leads (
    id, name, phone, email, provided_city, provided_country,
    ip_location, device_info, status, detection_reason
) VALUES (
    'fraud_001', 'John Doe', '+1-555-1234567', 'john@fake.com',
    'Karachi', 'Pakistan', 'New York, USA', 'Chrome on Windows',
    'SUSPICIOUS', 'IP location mismatch with provided country'
);
```

#### Checking for Fraud:
```sql
-- Check if lead exists in fraud table
SELECT * FROM fraud_leads 
WHERE phone = '+92-300-1234567' OR email = 'ahmed.khan@email.com';
```

### 6. **CAMPAIGN MANAGEMENT** - Group Targeting

#### Creating Groups:
```sql
INSERT INTO groups (
    id, name, type, criteria, lead_ids
) VALUES (
    'group_001', 'Math Students', 'COURSE',
    '{"courses": ["MATHS"]}',
    '["lead_001", "lead_002", "lead_003"]'
);
```

#### Creating Campaigns:
```sql
INSERT INTO campaigns (
    id, name, type, group_type, status, target_leads, message_content
) VALUES (
    'campaign_001', 'Math Course Promotion', 'WHATSAPP',
    'Math Students', 'ACTIVE',
    '["lead_001", "lead_002", "lead_003"]',
    'Special discount on all mathematics courses! Limited time offer.'
);
```

### 7. **PRACTICAL FRONTEND INTEGRATION**

#### Lead Form Component:
```typescript
interface LeadFormData {
  fullName: string;
  dob?: string;
  age?: number;
  country: string;
  city: string;
  parentName: string;
  phones: string[];
  emails: string[];
  inquirySource: string;
  coursePreference: string;
  notes: string;
}

const handleSubmit = async (data: LeadFormData) => {
  // 1. Create lead
  const lead = await createLead({
    fullName: data.fullName,
    dob: data.dob,
    age: data.dob ? calculateAge(data.dob) : data.age,
    country: data.country,
    city: data.city,
    parentName: data.parentName,
    inquirySource: data.inquirySource,
    coursePreference: data.coursePreference,
    notes: data.notes
  });

  // 2. Add phones
  for (const phone of data.phones) {
    await addLeadPhone(lead.id, phone);
  }

  // 3. Add emails
  for (const email of data.emails) {
    await addLeadEmail(lead.id, email);
  }

  // 4. Check for fraud
  const fraudCheck = await checkFraud(lead);
  if (fraudCheck.suspicious) {
    await addToFraudLeads(lead, fraudCheck);
  }
};
```

#### Task Management:
```typescript
const createReminder = async (leadId: string, type: string, dueDate: string, notes: string) => {
  const lead = await getLead(leadId);
  
  return await createTask({
    leadId,
    leadName: lead.fullName,
    leadPhone: lead.phones[0], // Primary phone
    type,
    dueDate,
    notes,
    status: 'PENDING'
  });
};
```

#### Offer Generation:
```typescript
const generateOffer = async (offerTypeId: string, courseName: string, mode: string) => {
  const offerType = await getOfferType(offerTypeId);
  const baseFees = getCourseFees(courseName, mode);
  
  // Apply discounts
  const discount = calculateDiscount(offerType, baseFees);
  const finalFees = baseFees - discount.amount;
  
  return await createOffer({
    offerTypeId,
    courseName,
    mode,
    originalFees: baseFees,
    discountPercentage: discount.percentage,
    discountAmount: discount.amount,
    finalFees,
    discountType: discount.type,
    duration: getCourseDuration(courseName),
    schedule: getCourseSchedule(courseName)
  });
};
```

### 8. **KEY BUSINESS LOGIC**

#### Age Calculation:
```typescript
const calculateAge = (dob: string): number => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};
```

#### Fraud Detection:
```typescript
const checkFraud = async (lead: Lead): Promise<FraudCheck> => {
  const ipLocation = await getIPLocation();
  const deviceInfo = getDeviceInfo();
  
  // Check for mismatches
  if (lead.country !== ipLocation.country) {
    return { suspicious: true, reason: 'Location mismatch' };
  }
  
  // Check for fake patterns
  if (/^(000|123|999)/.test(lead.phones[0])) {
    return { suspicious: true, reason: 'Fake phone pattern' };
  }
  
  return { suspicious: false };
};
```

#### Discount Calculation:
```typescript
const calculateDiscount = (offerType: OfferType, baseFees: number): Discount => {
  switch (offerType.name) {
    case 'STEM Courses':
      return { percentage: 20, amount: baseFees * 0.2, type: 'EARLY_BIRD' };
    case 'Winter Camp':
      return { percentage: 15, amount: baseFees * 0.15, type: 'SPECIAL_OFFER' };
    default:
      return { percentage: 0, amount: 0, type: 'NONE' };
  }
};
```

This implementation guide shows how all the database tables work together to create a comprehensive lead management system for your Polymath Kid Hub application. 