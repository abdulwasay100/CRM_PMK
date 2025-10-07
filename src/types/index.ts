export interface Lead {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  dob?: string; // Date of birth, optional
  age: number;
  city: string;
  parentName: string;
  inquirySource: 'Website' | 'Social Media' | 'Referral' | 'Advertisement' | 'Walk-in' | 'Phone Call';
  interestedCourse: 'Math' | 'Science' | 'English' | 'Programming' | 'Art' | 'Music';
  notes: string;
  leadStatus: 'New' | 'Contacted' | 'Not Interested' | 'Converted';
  createdAt: string;
  updatedAt: string;
  history: LeadHistory[];
}

export interface LeadHistory {
  id: string;
  leadId: string;
  action: string;
  details: string;
  timestamp: string;
  counselor: string;
}

export interface Group {
  id: string;
  name: string;
  type: 'Age' | 'Course' | 'City' | 'Admission Status';
  criteria: string;
  leadIds: string[];
  createdAt: string;
}

// Removed Campaign interface

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'Callback' | 'Send Brochure' | 'Confirm Registration' | 'Follow Up';
  leadId: string;
  leadName: string;
  assignedTo: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate: string;
  createdAt: string;
}

export interface Discount {
  id: string;
  leadId: string;
  leadName: string;
  discountType: 'Early Bird' | 'Sibling' | 'Referral' | 'Special Offer';
  amount: number;
  percentage: number;
  reason: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'Course Info' | 'Fees' | 'Schedule' | 'Welcome' | 'Follow Up';
  content: string;
  variables: string[];
  sentCount: number;
  seenCount: number;
  replyCount: number;
}

export interface DashboardStats {
  totalLeads: number;
  totalTasks: number;
  conversionRate: number;
  newLeadsToday: number;
  tasksCompleted: number;
  revenue: number;
}