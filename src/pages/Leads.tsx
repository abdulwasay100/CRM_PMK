import { useState } from "react";
import { Search, Filter, UserPlus, Phone, Mail, MapPin, Eye, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lead } from "@/types";
import { useRouter } from "next/navigation";
import React from "react";
import { matchesAllTermsInFields } from "@/lib/utils";
import { SearchContext } from "@/context/SearchContext";

async function fetchLeadsFromDB() {
  const res = await fetch('/api/leads', { cache: 'no-store' });
  const data = await res.json();
  // map DB rows to UI shape
  return (data.leads || []).map((l: any) => ({
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
}

// Helper to calculate age from DOB
function calculateAgeFromDOB(dob?: string): number {
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

// Helper to get reminders from localStorage
function getRemindersFromStorage() {
  const data = localStorage.getItem('reminders');
  if (data) {
    try { return JSON.parse(data); } catch { return []; }
  }
  return [];
}

export default function Leads() {
  const navigate = useRouter();
  const { search } = React.useContext(SearchContext);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [leads, setLeads] = useState<any[]>([]);
  const [modal, setModal] = useState<{ open: boolean; lead: any | null; mode: 'view' | 'edit' }>({ open: false, lead: null, mode: 'view' });
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; lead: any | null }>({ open: false, lead: null });
  const [reminders, setReminders] = useState<any[]>([]);

  // Load leads from DB
  React.useEffect(() => {
    (async () => {
      try {
        setLeads(await fetchLeadsFromDB());
      } catch {}
    })();
  }, []);

  // Load reminders from DB
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/reminders', { cache: 'no-store' });
        const data = await res.json();
        setReminders((data.reminders || []).map((r: any) => ({ id: String(r.id), leadId: String(r.lead_id), leadName: r.lead_name, type: r.type, dueDate: r.due_date, notes: r.notes, status: r.status })));
      } catch {}
    })();
  }, []);

  const filteredLeads = leads.filter(lead => {
    // Split search by comma, trim, and lowercase each term
    const terms = search
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);
    if (terms.length === 0) return true;
    // Match all terms in any of the fields
    return matchesAllTermsInFields(lead, terms, [
      'fullName',
      'phone',
      'email',
      'parentName',
    ]);
  });

  const getStatusColor = (status: Lead['leadStatus']) => {
    switch (status) {
      case 'New': return 'bg-primary-light text-primary';
      case 'Contacted': return 'bg-warning-light text-warning';
      case 'Converted': return 'bg-success-light text-success';
      case 'Not Interested': return 'bg-destructive-light text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityIcon = (lead: Lead) => {
    if (lead.leadStatus === 'New') return '🔥';
    if (lead.leadStatus === 'Contacted') return '⏰';
    if (lead.leadStatus === 'Converted') return '✅';
    return '❌';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lead Generation & Management</h1>
          <p className="text-muted-foreground">Manage and track all your leads. Prevent duplicate entries by phone number. View lead history and merge duplicates if needed.</p>
        </div>
        <Button 
          onClick={() => navigate.push("/leads/add")}
          className="bg-gradient-primary hover:opacity-90"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add New Lead
        </Button>
      </div>

      {/* Filters */}
      {/* Remove the Card containing the search bar below the page header */}
      {/*
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, phone, email, parent (comma separated)..."
                value={search}
                onChange={(e) => {
                  // This onChange is for the global search input, not the local searchTerm state
                  // The global search state is managed by SearchContext
                }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Converted">Converted</SelectItem>
                <SelectItem value="Not Interested">Not Interested</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Sources</SelectItem>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="Social Media">Social Media</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Advertisement">Advertisement</SelectItem>
                <SelectItem value="Walk-in">Walk-in</SelectItem>
                <SelectItem value="Phone Call">Phone Call</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      */}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{leads.filter(l => l.leadStatus === 'New').length}</div>
            <p className="text-sm text-muted-foreground">New Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{leads.filter(l => l.leadStatus === 'Contacted').length}</div>
            <p className="text-sm text-muted-foreground">Contacted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{leads.filter(l => l.leadStatus === 'Converted').length}</div>
            <p className="text-sm text-muted-foreground">Converted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{leads.filter(l => l.leadStatus === 'Not Interested').length}</div>
            <p className="text-sm text-muted-foreground">Not Interested</p>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getPriorityIcon(lead)}</span>
                      <div>
                        <h3 className="font-semibold text-foreground">{lead.fullName}</h3>
                        <p className="text-sm text-muted-foreground">Parent: {lead.parentName} • Age: {lead.dob ? calculateAgeFromDOB(lead.dob) : lead.age}</p>
                      </div>
                    </div>
                    {/* Reminders for this lead */}
                    {reminders.filter(r => r.leadId === lead.id).length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold mb-1 text-primary">Reminders:</p>
                        <ul className="text-xs space-y-1">
                          {reminders.filter(r => r.leadId === lead.id).map(r => (
                            <li key={r.id} className="flex items-center gap-2">
                              <span className="font-medium">{r.type}</span>
                              <span className="text-muted-foreground">on {new Date(r.dueDate).toLocaleDateString()}</span>
                              <span className="rounded px-2 py-0.5 text-white text-xs" style={{background:r.status==='Completed'?'#22c55e':r.status==='In Progress'?'#f59e42':'#f43f5e'}}>{r.status}</span>
                              {r.notes && <span className="italic text-muted-foreground">({r.notes})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {lead.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {lead.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {lead.city}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                        {lead.interestedCourse}
                      </span>
                      <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                        {lead.inquirySource}
                      </span>
                    </div>

                    {lead.notes && (
                      <p className="text-sm text-muted-foreground italic">"{lead.notes}"</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.leadStatus)}`}>
                      {lead.leadStatus}
                    </span>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setModal({ open: true, lead, mode: 'view' })}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setModal({ open: true, lead, mode: 'edit' })}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      {lead.leadStatus !== 'Converted' && (
                        <Button variant="outline" size="sm" onClick={async () => {
                          await fetch('/api/leads/convert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: lead.id }) })
                          setLeads(await fetchLeadsFromDB())
                        }}>Mark Converted</Button>
                      )}
                      <Button variant="outline" size="sm" color="destructive" onClick={() => setConfirmDelete({ open: true, lead })}>
                        Remove
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(lead.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Lead History Preview */}
                {lead.history.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm font-medium mb-2">Recent Activity:</p>
                    <div className="text-sm text-muted-foreground">
                      {lead.history.slice(-2).map((history) => (
                        <div key={history.id} className="flex justify-between">
                          <span>{history.action}: {history.details}</span>
                          <span>{new Date(history.timestamp).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredLeads.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No leads found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View/Edit Lead Modal */}
      {modal.open && modal.lead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{modal.mode === 'edit' ? 'Edit Lead' : 'View Lead'}</h2>
            <form onSubmit={async e => {
              e.preventDefault();
              if (modal.mode === 'edit') {
                // Save changes
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const updatedLead: Lead = {
                  ...modal.lead!,
                  fullName: formData.get('fullName') as string,
                  phone: formData.get('phone') as string,
                  email: formData.get('email') as string,
                  age: Number(formData.get('age')),
                  city: formData.get('city') as string,
                  parentName: formData.get('parentName') as string,
                  inquirySource: formData.get('inquirySource') as Lead['inquirySource'],
                  interestedCourse: formData.get('interestedCourse') as Lead['interestedCourse'],
                  notes: formData.get('notes') as string,
                  leadStatus: formData.get('leadStatus') as Lead['leadStatus'],
                  updatedAt: new Date().toISOString(),
                };
                await fetch(`/api/leads/${updatedLead.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    full_name: updatedLead.fullName,
                    parent_name: updatedLead.parentName,
                    date_of_birth: updatedLead.dob || null,
                    age: updatedLead.age,
                    country: (updatedLead as any).country,
                    city: updatedLead.city,
                    phone: updatedLead.phone,
                    email: updatedLead.email,
                    notes: updatedLead.notes,
                    inquiry_source: updatedLead.inquirySource,
                    interested_course: updatedLead.interestedCourse,
                    lead_status: updatedLead.leadStatus,
                  })
                });
                setLeads(await fetchLeadsFromDB());
                setModal({ open: false, lead: null, mode: 'view' });
              }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Full Name</label>
                  <input name="fullName" className="border p-2 w-full" defaultValue={modal.lead.fullName} disabled={modal.mode === 'view'} required />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Phone</label>
                  <input name="phone" className="border p-2 w-full" defaultValue={modal.lead.phone} disabled={modal.mode === 'view'} required />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Email</label>
                  <input name="email" className="border p-2 w-full" defaultValue={modal.lead.email} disabled={modal.mode === 'view'} required />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Age</label>
                  <input name="age" type="number" className="border p-2 w-full" defaultValue={modal.lead.age} disabled={modal.mode === 'view'} required min={3} max={18} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Parent Name</label>
                  <input name="parentName" className="border p-2 w-full" defaultValue={modal.lead.parentName} disabled={modal.mode === 'view'} required />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">City</label>
                  <input name="city" className="border p-2 w-full" defaultValue={modal.lead.city} disabled={modal.mode === 'view'} required />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Inquiry Source</label>
                  <select name="inquirySource" className="border p-2 w-full" defaultValue={modal.lead.inquirySource} disabled={modal.mode === 'view'} required>
                    <option value="Website">Website</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Referral">Referral</option>
                    <option value="Advertisement">Advertisement</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Phone Call">Phone Call</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Interested Course</label>
                  <select name="interestedCourse" className="border p-2 w-full" defaultValue={modal.lead.interestedCourse} disabled={modal.mode === 'view'} required>
                    <option value="Math">Math</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="Programming">Programming</option>
                    <option value="Art">Art</option>
                    <option value="Music">Music</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Lead Status</label>
                  <select name="leadStatus" className="border p-2 w-full" defaultValue={modal.lead.leadStatus} disabled={modal.mode === 'view'} required>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Converted">Converted</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-1">Notes</label>
                  <textarea name="notes" className="border p-2 w-full" defaultValue={modal.lead.notes} disabled={modal.mode === 'view'} rows={3} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setModal({ open: false, lead: null, mode: 'view' })}>Close</Button>
                {modal.mode === 'edit' && <Button type="submit">Save</Button>}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Lead Confirmation Dialog */}
      {confirmDelete.open && confirmDelete.lead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Remove Lead</h2>
            <p className="mb-4">Do you want to remove <b>{confirmDelete.lead.fullName}</b>?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete({ open: false, lead: null })}>Cancel</Button>
              <Button variant="destructive" onClick={async () => {
                await fetch(`/api/leads/${confirmDelete.lead!.id}`, { method: 'DELETE' })
                setLeads(await fetchLeadsFromDB());
                setConfirmDelete({ open: false, lead: null });
              }}>Remove</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}