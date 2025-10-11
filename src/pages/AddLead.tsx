import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "react-toastify";
import { Lead } from "@/types";
import React, { useState } from "react";
import { matchesAllTermsInFields } from "@/lib/utils";
import { SearchContext } from "@/context/SearchContext";
import { Country, City } from 'country-state-city';

interface LeadFormData {
  fullName: string;
  phone: string;
  email: string;
  dob?: string; // New field for date of birth
  age?: number; // Optional, fallback if no DOB
  city: string;
  parentName: string;
  inquirySource: string;
  interestedCourse: string;
  notes: string;
  leadStatus: string;
}

type ReminderType = 'Call back' | 'Send brochure' | 'Confirm registration';

// Reminder type
interface Reminder {
  id: string;
  leadId: string;
  leadName: string;
  type: ReminderType;
  dueDate: string;
  notes: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  isCompleted: boolean;
  createdAt: string;
}

// DB helpers
async function createLeadInDB(payload: any) {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}
async function createReminderInDB(payload: any) {
  const res = await fetch('/api/reminders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// Helper to calculate age from DOB
function calculateAgeFromDOB(dob: string): number {
  if (!dob) return 0;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function AddLead() {
  const navigate = useRouter();
  const { search } = React.useContext(SearchContext);
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LeadFormData>({
    defaultValues: {
      leadStatus: "New"
    }
  });

  const watchedFullName = watch("fullName");
  const watchedPhone = watch("phone");
  const watchedEmail = watch("email");
  // Add DOB to form state
  const watchedDOB = watch("dob");
  const watchedAge = watch("age");

  // Local in-page suggestions only; not required for DB save
  const [leads, setLeads] = useState<Lead[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  
  // State for converted leads data
  const [convertedLeadsData, setConvertedLeadsData] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isLeadConverted, setIsLeadConverted] = useState<boolean>(false);
  
  // State for date picker
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Load leads from database for search functionality
  React.useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch('/api/leads', { cache: 'no-store' });
        const data = await res.json();
        const mappedLeads = (data.leads || []).map((l: any) => ({
          id: String(l.id),
          fullName: l.full_name,
          parentName: l.parent_name,
          dob: l.date_of_birth,
          age: l.age ?? 0,
          country: l.country,
          city: l.city,
          phone: l.phone,
          email: l.email,
          notes: l.notes,
          inquirySource: l.inquiry_source,
          interestedCourse: l.interested_course,
          leadStatus: l.lead_status,
          createdAt: l.created_at,
          updatedAt: l.updated_at,
          history: [],
        } as any));
        setLeads(mappedLeads);
      } catch (error) {
        console.error('Failed to fetch leads:', error);
      }
    };
    fetchLeads();
  }, []);

  // Multi-term, multi-field search for existing leads using global search
  const searchTerms = search
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);
  const matchingLeads = searchTerms.length > 0
    ? leads.filter(lead =>
        matchesAllTermsInFields(lead, searchTerms, [
          'fullName',
          'phone',
          'email',
          'parentName',
        ])
      )
    : [];


  // Auto-fill logic: map search bar values to form fields (always overwrite)
  React.useEffect(() => {
    const [name, phone, email, parent] = search.split(',').map(t => t.trim());
    setValue("fullName", name || "");
    setValue("phone", phone || "");
    setValue("email", email || "");
    setValue("parentName", parent || "");
  }, [search, setValue]);

  // Watch for lead status changes and load converted data if needed
  const watchedLeadStatus = watch("leadStatus");
  React.useEffect(() => {
    const isConverted = watchedLeadStatus === 'Converted';
    setIsLeadConverted(isConverted);
    
    if (isConverted && selectedLeadId) {
      loadConvertedLeadsData(selectedLeadId);
    } else if (!isConverted) {
      setConvertedLeadsData([]);
    }
  }, [watchedLeadStatus, selectedLeadId]);

  // Sync date picker with form value
  React.useEffect(() => {
    if (watchedDOB) {
      setSelectedDate(new Date(watchedDOB));
    } else {
      setSelectedDate(undefined);
    }
  }, [watchedDOB]);

  // Function to load converted leads data for a specific lead
  const loadConvertedLeadsData = async (leadId: string) => {
    try {
      const res = await fetch(`/api/converted-leads/by-lead?id=${leadId}`, { cache: 'no-store' });
      const data = await res.json();
      setConvertedLeadsData(data.converted || []);
    } catch (error) {
      console.error('Failed to fetch converted leads data:', error);
      setConvertedLeadsData([]);
    }
  };

  // Handler to fill form fields from a selected lead
  function fillFormFromLead(lead: Lead) {
    setValue("fullName", lead.fullName || "");
    setValue("parentName", lead.parentName || "");
    setValue("phone", lead.phone || "");
    setValue("dob", lead.dob || undefined);
    setValue("age", lead.age || undefined);
    setValue("city", lead.city || "");
    setValue("email", lead.email || "");
    setValue("interestedCourse", lead.interestedCourse || "");
    setValue("leadStatus", lead.leadStatus || "New");
    
    // Set date picker
    if (lead.dob) {
      setSelectedDate(new Date(lead.dob));
    } else {
      setSelectedDate(undefined);
    }
    
    // Set selected lead ID and load converted data if lead is converted
    setSelectedLeadId(lead.id);
    const isConverted = lead.leadStatus === 'Converted';
    setIsLeadConverted(isConverted);
    
    if (isConverted) {
      loadConvertedLeadsData(lead.id);
    } else {
      setConvertedLeadsData([]);
    }
  }

  // Reminder creation state for new lead
  const [reminderType, setReminderType] = React.useState<ReminderType>('Call back');
  const [reminderDate, setReminderDate] = React.useState('');
  const [reminderNotes, setReminderNotes] = React.useState('');

  // Country/City state
  const [selectedCountry, setSelectedCountry] = React.useState('');
  const [selectedCity, setSelectedCity] = React.useState('');
  const countries = Country.getAllCountries();
  const cities = selectedCountry ? City.getCitiesOfCountry(selectedCountry) : [];

  const onSubmit = async (data: LeadFormData) => {
    const now = new Date().toISOString();
    const validInquirySources = [
      'Website', 'Social Media', 'Referral', 'Advertisement', 'Walk-in', 'Phone Call'
    ];
    const validCourses = [
      'Math', 'Science', 'English', 'Programming', 'Art', 'Music'
    ];
    const inquirySource = (validInquirySources.includes(data.inquirySource)
      ? data.inquirySource
      : 'Website') as Lead['inquirySource'];
    const interestedCourse = (validCourses.includes(data.interestedCourse)
      ? data.interestedCourse
      : 'Math') as Lead['interestedCourse'];
    const validStatuses = ['New', 'Contacted', 'Not Interested', 'Converted'];
    const leadStatus = (validStatuses.includes(data.leadStatus)
      ? data.leadStatus
      : 'New') as Lead['leadStatus'];
    let age = 0;
    if (data.dob) {
      age = calculateAgeFromDOB(data.dob);
      if (age < 6 || age > 16) {
        toast.error("Age must be between 6 and 16 years");
        return;
      }
    } else if (data.age) {
      age = data.age;
      if (age < 6 || age > 16) {
        toast.error("Age must be between 6 and 16 years");
        return;
      }
    } else {
      toast.error("Please provide either age or date of birth");
      return;
    }
    // Save lead in DB
    const leadPayload = {
      full_name: data.fullName,
      parent_name: data.parentName,
      date_of_birth: data.dob || null,
      age,
      country: selectedCountry ? (countries.find(c => c.isoCode === selectedCountry)?.name || '') : null,
      city: selectedCity,
      phone: data.phone,
      email: data.email,
      notes: data.notes,
      inquiry_source: inquirySource,
      interested_course: interestedCourse,
      lead_status: leadStatus,
    };
    const leadRes = await createLeadInDB(leadPayload);
    const newLeadId = leadRes?.id;

    // --- Save reminder if filled ---
    if (reminderDate && newLeadId) {
      await createReminderInDB({
        lead_id: Number(newLeadId),
        lead_name: data.fullName,
        phone: data.phone,
        type: reminderType,
        due_date: reminderDate,
        notes: reminderNotes,
        status: 'Pending',
      });
    }

    // --- Auto-assign to groups (client-only, optional) ---
    let updatedGroups: any[] = [];
    const groupTypes = [];
    // Age groups (non-overlapping)
    let ageGroup = null;
    if (age >= 4 && age <= 7) {
      ageGroup = { name: 'Age 4-7', type: 'Age', criteria: 'Age 4-7', match: (l: Lead) => l.age >= 4 && l.age <= 7 };
    } else if (age >= 8 && age <= 12) {
      ageGroup = { name: 'Age 8-12', type: 'Age', criteria: 'Age 8-12', match: (l: Lead) => l.age >= 8 && l.age <= 12 };
    } else if (age >= 13 && age <= 16) {
      ageGroup = { name: 'Age 13-16', type: 'Age', criteria: 'Age 13-16', match: (l: Lead) => l.age >= 13 && l.age <= 16 };
    }
    if (ageGroup) groupTypes.push(ageGroup);
    // Course group
    groupTypes.push({ name: `${interestedCourse} Group`, type: 'Course', criteria: interestedCourse, match: (l: Lead) => l.interestedCourse === interestedCourse });
    // City group disabled per requirement: do not create city-based groups
    // Admission status group
    groupTypes.push({ name: `${leadStatus} Leads`, type: 'Admission Status', criteria: leadStatus, match: (l: Lead) => l.leadStatus === leadStatus });

    groupTypes.forEach((g) => {
      // Prevent duplicate group for same type/criteria
      let group = updatedGroups.find(
        (grp) => grp.type === g.type && grp.criteria === g.criteria
      );
      if (!group) {
        group = {
          id: Date.now().toString() + Math.floor(Math.random() * 1000),
          name: g.name,
          type: g.type,
          criteria: g.criteria,
          leadIds: [],
          createdAt: now,
        };
        updatedGroups.push(group);
      }
      // Add lead id if available
      if (newLeadId && !group.leadIds.includes(String(newLeadId))) {
        group.leadIds.push(String(newLeadId));
      }
    });
    // Remove all old age groups except the new three
    const allowedAgeCriteria = ['Age 4-7', 'Age 8-12', 'Age 13-16'];
    const dedupedGroups = updatedGroups.filter((g, idx, arr) => {
      if (g.type === 'Age' && !allowedAgeCriteria.includes(g.criteria)) return false;
      return arr.findIndex(x => x.type === g.type && x.criteria === g.criteria) === idx;
    });
    setGroups(dedupedGroups);
    toast.success("Lead added successfully!");
    navigate.push("/leads");
  };

  // --- Offer & Message Generator State ---
  const [selectedCourse, setSelectedCourse] = React.useState("");
  const [selectedMode, setSelectedMode] = React.useState("");
  const [fees, setFees] = React.useState(0);
  const [selectedDiscount, setSelectedDiscount] = React.useState("0");
  const [duration, setDuration] = React.useState("");
  const [selectedSchedule, setSelectedSchedule] = React.useState("");
  const [schedules, setSchedules] = React.useState<string[]>([]);
  const [selectedBTC, setSelectedBTC] = React.useState("");
  const [message, setMessage] = React.useState("");
  // Attachment state
  const [attachments, setAttachments] = React.useState<File[]>([]);

  // Sample data for fees, duration, schedules
  const courseData: Record<string, {
    fees: { [mode: string]: number },
    duration: string,
    schedules: string[],
  }> = {
    Math: {
      fees: { "One on One": 5000, Group: 3000 },
      duration: "3 months",
      schedules: ["Mon/Wed 4-5pm", "Tue/Thu 5-6pm"],
    },
    Science: {
      fees: { "One on One": 6000, Group: 3500 },
      duration: "4 months",
      schedules: ["Mon/Wed 5-6pm", "Fri 4-6pm"],
    },
    English: {
      fees: { "One on One": 4500, Group: 2500 },
      duration: "2 months",
      schedules: ["Sat/Sun 10-11am", "Mon/Wed 6-7pm"],
    },
    Programming: {
      fees: { "One on One": 8000, Group: 5000 },
      duration: "6 months",
      schedules: ["Sat 2-4pm", "Sun 2-4pm"],
    },
    Art: {
      fees: { "One on One": 4000, Group: 2000 },
      duration: "2 months",
      schedules: ["Fri 3-5pm", "Sat 11am-1pm"],
    },
    Music: {
      fees: { "One on One": 7000, Group: 4000 },
      duration: "3 months",
      schedules: ["Sun 5-7pm", "Wed 7-9pm"],
    },
  };

  // Auto-update fees, duration, schedules when course/mode changes
  React.useEffect(() => {
    if (selectedCourse && selectedMode && courseData[selectedCourse]) {
      setFees(courseData[selectedCourse].fees[selectedMode] || 0);
      setDuration(courseData[selectedCourse].duration);
      setSchedules(courseData[selectedCourse].schedules);
      setSelectedSchedule(courseData[selectedCourse].schedules[0] || "");
    }
  }, [selectedCourse, selectedMode]);

  // Auto-update fees when discount changes
  React.useEffect(() => {
    if (selectedCourse && selectedMode && courseData[selectedCourse]) {
      const baseFee = courseData[selectedCourse].fees[selectedMode] || 0;
      const discount = Number(selectedDiscount);
      const discountedFee = Math.round(baseFee * (1 - discount / 100));
      setFees(discountedFee);
    }
  }, [selectedDiscount]);

  // Auto-generate message
  React.useEffect(() => {
    const childName = watch("fullName") || "Student";
    let msg = `Dear ${childName},\nThank you for your interest in our ${selectedCourse || "[Course]"} program.\nYour class is scheduled as ${selectedSchedule || "[Schedule]"}.\nThe total fee is Rs. ${fees} for a duration of ${duration}.`;
    msg += `\n\nIf you have any questions, feel free to ask.\nThank you for contacting us.\nLooking forward to seeing you in class!`;
    if (selectedBTC) msg += `\nAlso, check out our ${selectedBTC}!`;
    setMessage(msg);
  }, [selectedCourse, selectedSchedule, fees, duration, selectedBTC, watch("fullName")]);

  // Handler for file input
  function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  }
  function handleRemoveAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }

  // Dummy send handlers
  function sendWhatsApp() {
    alert("WhatsApp message sent!\n\n" + message);
  }
  function sendEmail() {
    alert("Email sent!\n\n" + message);
  }

  // Find existing lead by phone or email
  const matchedLead = leads.find(
    (lead) =>
      (watchedPhone && lead.phone.replace(/\D/g, "") === watchedPhone.replace(/\D/g, "")) ||
      (watchedEmail && lead.email.toLowerCase() === watchedEmail.trim().toLowerCase())
  );

  // State for selected similar lead box
  const [selectedSimilarLeadId, setSelectedSimilarLeadId] = React.useState<string | null>(null);

  const lead = selectedSimilarLeadId ? matchingLeads.find((l: Lead) => l.id === selectedSimilarLeadId) : undefined;

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const phone = e.target.value;
    const allLeads: Lead[] = []; // Placeholder for leads
    const found = allLeads.find((l: Lead) => l.phone === phone);
    if (found) {
      setDuplicateLead(found);
    } else {
      setDuplicateLead(null);
    }
  }

  function handleMerge() {
    // Implement manual merge logic here, e.g., update the existing lead with new info or combine histories
    setMergeMode(false);
  }

  return (
    <div className="space-y-6">
      {/* Show similar leads as clickable boxes if 5 or fewer */}
      {matchingLeads.length > 0 && matchingLeads.length <= 5 && (
        <div className="mb-4 flex flex-wrap gap-3">
          {(selectedSimilarLeadId
            ? matchingLeads.filter(lead => lead.id === selectedSimilarLeadId)
            : matchingLeads
          ).map(lead => (
            <div
              key={lead.id}
              className="border border-primary rounded-lg p-3 w-[300px] min-w-[300px] max-w-[300px] cursor-pointer hover:bg-primary/10 transition overflow-hidden"
              onClick={() => {
                fillFormFromLead(lead);
                setSelectedSimilarLeadId(lead.id);
              }}
            >
              <table className="text-sm w-full leading-normal">
                <tbody>
                  <tr>
                    <td className="font-semibold pr-2 align-top whitespace-nowrap">Name:</td>
                    <td className="truncate max-w-[200px]">{lead.fullName}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold pr-2 align-top whitespace-nowrap">Parent:</td>
                    <td className="truncate max-w-[200px]">{lead.parentName}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold pr-2 align-top whitespace-nowrap">Phone:</td>
                    <td className="truncate max-w-[200px]">{lead.phone}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold pr-2 align-top whitespace-nowrap">Age:</td>
                    <td className="truncate max-w-[200px]">{lead.age}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold pr-2 align-top whitespace-nowrap">City:</td>
                    <td className="truncate max-w-[200px]">{lead.city}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      {duplicateLead && !mergeMode && (
        <div className="bg-warning-light text-warning p-2 rounded mt-2">
          <p>Duplicate lead detected for this phone number.</p>
          <p>Lead History: No history available (history functionality removed)</p>
          <button className="bg-primary text-white px-2 py-1 rounded mt-2" onClick={() => setMergeMode(true)}>Merge with this lead</button>
        </div>
      )}
      {mergeMode && duplicateLead && (
        <div className="bg-muted p-2 rounded mt-2">
          <p>Manual Merge Mode: Update the existing lead with new info or combine histories as needed.</p>
          <button className="bg-success text-white px-2 py-1 rounded mt-2" onClick={handleMerge}>Confirm Merge</button>
          <button className="bg-destructive text-white px-2 py-1 rounded mt-2 ml-2" onClick={() => setMergeMode(false)}>Cancel</button>
        </div>
      )}
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate.push("/leads")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Lead</h1>
          <p className="text-muted-foreground">Enter the details of the new lead</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 gap-x-8">
          <div className="flex flex-col gap-6">
            {/* Basic Information */}
            <Card className="w-[470px]">
              <CardHeader>
                <CardTitle className="text-2xl !important">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-lg !important">
                <div>
                  <Input
                    id="fullName"
                    {...register("fullName", { required: "Full name is required" })}
                    placeholder="Enter student's full name"
                    className="w-[85%] text-lg"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
                  )}
                </div>
                <div>
                  <label>Date of Birth (optional)</label>
                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                      setValue("dob", date ? date.toISOString().split('T')[0] : undefined);
                    }}
                    placeholder="Select date of birth"
                    className="w-[85%] text-lg"
                  />
                  {watchedDOB && (calculateAgeFromDOB(watchedDOB) < 6 || calculateAgeFromDOB(watchedDOB) > 16) && (
                    <p className="text-sm text-destructive mt-1">Age must be between 6 and 16 years</p>
                  )}
                  {watchedDOB ? (
                    <div className="mt-2">
                      <label>Calculated Age</label>
                      <Input value={calculateAgeFromDOB(watchedDOB)} readOnly className="w-[85%] text-lg bg-muted" />
                    </div>
                  ) : (
                    <div className="mt-2">
                      <label>Age</label>
                      <Input
                        id="age"
                        type="number"
                        {...register("age", { 
                          required: "Age is required if DOB is not provided",
                          min: { value: 6, message: "Age must be at least 6" },
                          max: { value: 16, message: "Age must be at most 16" }
                        })}
                        placeholder="Enter age"
                        className="w-[85%] text-lg"
                      />
                      {errors.age && (
                        <p className="text-sm text-destructive mt-1">{errors.age.message}</p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Input
                    id="parentName"
                    {...register("parentName", { required: "Parent name is required" })}
                    placeholder="Enter parent/guardian name"
                    className="w-[85%] text-lg"
                  />
                  {errors.parentName && (
                    <p className="text-sm text-destructive mt-1">{errors.parentName.message}</p>
                  )}
                </div>
                <div>
                  <label>Country</label>
                  <Select
                    value={selectedCountry}
                    onValueChange={(value) => {
                      setSelectedCountry(value);
                      setSelectedCity('');
                      setValue('city', '');
                    }}
                  >
                    <SelectTrigger className="w-[85%] text-lg">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(c => (
                        <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label>City</label>
                  <Select
                    value={selectedCity}
                    onValueChange={(value) => {
                      setSelectedCity(value);
                      setValue('city', value);
                    }}
                    disabled={!selectedCountry}
                  >
                    <SelectTrigger className="w-[85%] text-lg">
                      <SelectValue placeholder={selectedCountry ? "Select city" : "Select country first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities?.map(city => (
                        <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    id="phone"
                    {...register("phone", { 
                      required: "Phone number is required",
                      pattern: {
                        value: /^[\+]?[1-9][\d]{0,15}$/,
                        message: "Invalid phone number format"
                      }
                    })}
                    placeholder="Enter phone number"
                    className="w-[85%] text-lg"
                    onChange={handlePhoneChange}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    id="email"
                    type="email"
                    {...register("email", { 
                      required: "Email is required",
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: "Invalid email format"
                      }
                    })}
                    placeholder="Enter email"
                    className="w-[85%] text-lg"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Additional Information */}
            <Card className="max-w-[900px] w-[470px]">
              <CardHeader>
                <CardTitle className="text-2xl !important">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-lg !important">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Select onValueChange={(value) => setValue("leadStatus", value)} defaultValue="New">
                      <SelectTrigger className="w-[85%] text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Contacted">Contacted</SelectItem>
                        <SelectItem value="Not Interested">Not Interested</SelectItem>
                        <SelectItem value="Converted">Converted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    placeholder="Add any additional notes about the lead..."
                    rows={4}
                    className="w-[85%] text-lg"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Right column: Lead Preferences + Offer & Message Generator side by side, then Registered Customer Detail and Lead History stacked below */}
          <div className="flex flex-col gap-0 mr-[100px] ml-10">
            <div className="flex flex-row gap-x-10 flex-nowrap overflow-x-auto">
              {/* Lead Preferences */}
              <Card className="w-[350px] h-fit min-h-0 flex-shrink-0">
                <CardHeader className="py-3">
                  <CardTitle>Lead Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 py-3">
                  <Select onValueChange={(value) => setValue("inquirySource", value)}>
                    <SelectTrigger className="w-[85%] text-base">
                      <SelectValue placeholder="Select inquiry source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Advertisement">Advertisement</SelectItem>
                      <SelectItem value="Walk-in">Walk-in</SelectItem>
                      <SelectItem value="Phone Call">Phone Call</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select onValueChange={(value) => setValue("interestedCourse", value)}>
                    <SelectTrigger className="w-[85%] text-base m-0 mt-2">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Math">Math</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Programming">Programming</SelectItem>
                      <SelectItem value="Art">Art</SelectItem>
                      <SelectItem value="Music">Music</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              {/* Offer & Message Generator */}
              <Card className="w-[470px] min-h-[220px] mt-0 ml-[630px] flex-shrink-0">
                <CardHeader className="py-3">
                  <CardTitle>Offer & Message Generator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-lg !important">
                  {/* Beyond the Classroom Dropdown (moved to top) */}
                  <Select value={selectedBTC} onValueChange={setSelectedBTC}>
                    <SelectTrigger className="w-full text-base">
                      <SelectValue placeholder="Beyond the Classroom" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Polymath Summercamp">Polymath Summercamp</SelectItem>
                      <SelectItem value="Winter Camp">Winter Camp</SelectItem>
                      <SelectItem value="Internships">Internships</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Course & Mode Row */}
                  <div className="flex gap-3">
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger className="w-1/2 text-base">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Math">Math</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Programming">Programming</SelectItem>
                        <SelectItem value="Art">Art</SelectItem>
                        <SelectItem value="Music">Music</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedMode} onValueChange={setSelectedMode}>
                      <SelectTrigger className="w-1/2 text-base">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="One on One">One on One</SelectItem>
                        <SelectItem value="Group">Group</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Fees & Discount Row */}
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      value={fees || ""}
                      onChange={e => setFees(Number(e.target.value))}
                      placeholder="Fees"
                      className="w-1/2 text-base"
                    />
                    <Select value={selectedDiscount} onValueChange={setSelectedDiscount}>
                      <SelectTrigger className="w-1/2 text-base">
                        <SelectValue placeholder="Select discount" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No discount</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                        <SelectItem value="30">30%</SelectItem>
                        <SelectItem value="40">40%</SelectItem>
                        <SelectItem value="50">50%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Duration & Schedule Row */}
                  <div className="flex gap-3">
                    <Input
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      placeholder="Duration (e.g. 3 months)"
                      className="w-1/2 text-base"
                    />
                    <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                      <SelectTrigger className="w-1/2 text-base">
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        {schedules.map((s, i) => (
                          <SelectItem key={i} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Auto-generated message */}
                  <Textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={7}
                    className="w-full text-base"
                  />
                  {/* Create an Attachment */}
                  <div>
                    <label className="block text-xs font-medium mb-1">Create an Attachment</label>
                    <input
                      type="file"
                      multiple
                      onChange={handleAttachmentChange}
                      className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                    />
                    {attachments.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm">
                        {attachments.map((file, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span>{file.name}</span>
                            <Button size="sm" variant="outline" type="button" onClick={() => handleRemoveAttachment(idx)}>
                              Remove
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/* Send section */}
                  <div className="mb-2">
                    <label className="block text-xs font-medium mb-1">Send from Phone Number</label>
                    <Select defaultValue="923119876543">
                      <SelectTrigger className="w-full max-w-xs" style={{maxWidth:'220px'}}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="923119876543">923119876543</SelectItem>
                        <SelectItem value="923112345678">923112345678</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-4 justify-center mt-2">
                    <Button style={{background:'#25D366', color:'#fff'}} className="hover:opacity-90" variant="default" onClick={sendWhatsApp}>Send WhatsApp</Button>
                    <Button variant="outline" onClick={sendEmail}>Send Email</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Registered Customer Detail below */}
            <Card className="w-[950px] min-h-[220px] min-w-0 border-primary border-2 bg-warning-light/10 overflow-x-auto flex-shrink-0 mt-[-302px]">
              <CardHeader className="py-2">
                <CardTitle>Registered Customer Detail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 py-2 text-base">
                <table className="w-full text-base border mb-2">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1">Name</th>
                      <th className="border px-2 py-1">Course</th>
                      <th className="border px-2 py-1">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {convertedLeadsData.length > 0 ? (
                      convertedLeadsData.map((converted, index) => (
                        <tr key={index}>
                          <td className="border px-2 py-1">{converted.full_name}</td>
                          <td className="border px-2 py-1">{converted.course}</td>
                          <td className="border px-2 py-1">
                            {converted.converted_at ? new Date(converted.converted_at).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="border px-2 py-1 text-gray-400">No converted data</td>
                        <td className="border px-2 py-1 text-gray-400">No converted data</td>
                        <td className="border px-2 py-1 text-gray-400">No converted data</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            {/* Lead History below Registered Customer Detail */}
            <Card className="w-[950px] min-h-[220px] min-w-0 border-primary border-2 flex-shrink-0 mt-8">
              <CardHeader className="py-2">
                <CardTitle>Lead History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 py-2 text-base">
                <table className="w-full text-base border mb-2">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1">Name</th>
                      <th className="border px-2 py-1">Parent Name</th>
                      <th className="border px-2 py-1">Course</th>
                      <th className="border px-2 py-1">Age</th>
                      <th className="border px-2 py-1">City</th>
                      <th className="border px-2 py-1">Phone Number</th>
                      <th className="border px-2 py-1">Email</th>
                      <th className="border px-2 py-1">Lead Registered Date</th>
                      <th className="border px-2 py-1">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border px-2 py-1">
                        {isLeadConverted ? (
                          <span className="text-gray-400">Lead converted - no history</span>
                        ) : (
                          lead?.fullName || ''
                        )}
                      </td>
                      <td className="border px-2 py-1">
                        {isLeadConverted ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          lead?.parentName || ''
                        )}
                      </td>
                      <td className="border px-2 py-1">
                        {isLeadConverted ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          lead?.interestedCourse || ''
                        )}
                      </td>
                      <td className="border px-2 py-1">
                        {isLeadConverted ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          lead?.age || ''
                        )}
                      </td>
                      <td className="border px-2 py-1">
                        {isLeadConverted ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          lead?.city || ''
                        )}
                      </td>
                      <td className="border px-2 py-1">
                        {isLeadConverted ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          lead?.phone || ''
                        )}
                      </td>
                      <td className="border px-2 py-1">
                        {isLeadConverted ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          lead?.email || ''
                        )}
                      </td>
                      <td className="border px-2 py-1">
                        {isLeadConverted ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          lead?.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ''
                        )}
                      </td>
                      <td className="border px-2 py-1">
                        {isLeadConverted ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          lead?.notes || ''
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-start gap-4 mt-6">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigate.push("/leads")}
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-gradient-primary hover:opacity-90">
            <Save className="w-4 h-4 mr-2" />
            Save Lead
          </Button>
        </div>
      </form>
      {/* Reminder Section */}
      <Card className="w-[470px]">
        <CardHeader>
          <CardTitle>Add Reminder for this Lead (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-lg !important">
          <div>
            <label className="block text-xs font-medium mb-1">Type</label>
            <Select
              value={reminderType}
              onValueChange={(value) => setReminderType(value as ReminderType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Call back">Call back</SelectItem>
                <SelectItem value="Send brochure">Send brochure</SelectItem>
                <SelectItem value="Confirm registration">Confirm registration</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Date</label>
            <Input
              type="date"
              className="w-full"
              value={reminderDate}
              onChange={e => setReminderDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Notes</label>
            <Input
              className="w-full"
              value={reminderNotes}
              onChange={e => setReminderNotes(e.target.value)}
              placeholder="Add notes (optional)"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}