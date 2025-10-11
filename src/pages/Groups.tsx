import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Users, Tag, MapPin, GraduationCap, Calendar, Paperclip, Eye, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import React from "react";

// Types
type GroupType = 'Age' | 'Course' | 'City' | 'Admission Status';

type Group = {
  id: number;
  name: string;
  group_type: GroupType;
  criteria: string;
  lead_ids: number[];
  lead_count: number;
  created_at: string;
  updated_at: string;
};

type Lead = {
  id: number;
  full_name: string;
  parent_name: string;
  age: number;
  city: string;
  phone: string;
  email: string;
  interested_course: string;
  lead_status: string;
  created_at: string;
};

export default function Groups() {
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [criteriaFilter, setCriteriaFilter] = useState<string>("All");
  const [groups, setGroups] = useState<Group[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showCreate, setShowCreate] = useState<false | 'create' | 'edit'>(false);
  const [newGroup, setNewGroup] = useState<{ id?: number; name: string; group_type: GroupType; criteria: string; lead_ids: number[] }>({ 
    name: '', 
    group_type: 'Age', 
    criteria: '', 
    lead_ids: [] 
  });
  const [messageModal, setMessageModal] = useState<{ open: boolean; group: Group | null; type: string }>({ open: false, group: null, type: '' });
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; group: Group | null }>({ open: false, group: null });
  const [leadsModalGroup, setLeadsModalGroup] = useState<Group | null>(null);
  const [leadsModalSearch, setLeadsModalSearch] = useState('');
  const [leadsModalSelectedLead, setLeadsModalSelectedLead] = useState<Lead | null>(null);
  const [leadSearch, setLeadSearch] = useState('');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [tempLead, setTempLead] = useState<Partial<Lead>>({});
  const [loading, setLoading] = useState(false);

  // Fetch data from database
  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to fetch groups');
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchLeads();
  }, [fetchGroups, fetchLeads]);

  // Get all unique criteria for the selected type
  const criteriaOptions = React.useMemo(() => {
    if (typeFilter === 'All') return [];
    const set = new Set(groups.filter(g => g.group_type === typeFilter).map(g => g.criteria));
    return Array.from(set);
  }, [groups, typeFilter]);

  const filteredGroups = groups.filter(group => {
    const matchesType = typeFilter === "All" || group.group_type === typeFilter;
    const matchesCriteria = typeFilter === "All" || criteriaFilter === "All" || group.criteria === criteriaFilter;
    return matchesType && matchesCriteria;
  });

  const getTypeIcon = (type: GroupType) => {
    switch (type) {
      case 'Age': return <Calendar className="w-4 h-4 text-primary" />;
      case 'Course': return <GraduationCap className="w-4 h-4 text-success" />;
      case 'City': return <MapPin className="w-4 h-4 text-warning" />;
      case 'Admission Status': return <Tag className="w-4 h-4 text-destructive" />;
      default: return <Users className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeColor = (type: GroupType) => {
    switch (type) {
      case 'Age': return 'bg-primary-light text-primary';
      case 'Course': return 'bg-success-light text-success';
      case 'City': return 'bg-warning-light text-warning';
      case 'Admission Status': return 'bg-destructive-light text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const totalLeads = groups.reduce((sum, group) => sum + group.lead_count, 0);

  // Handler for file input
  function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  function handleRemoveAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }

  // Create/Update group
  const handleSaveGroup = async () => {
    if (!newGroup.name || !newGroup.group_type || !newGroup.criteria) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (showCreate === 'edit' && newGroup.id) {
        // Update existing group
        const res = await fetch('/api/groups', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newGroup)
        });
        
        if (!res.ok) {
          throw new Error('Failed to update group');
        }
        
        toast.success('Group updated successfully');
      } else {
        // Create new group
        const res = await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newGroup)
        });
        
        if (!res.ok) {
          throw new Error('Failed to create group');
        }
        
        toast.success('Group created successfully');
      }

      // Refresh groups and auto-assign leads
      await fetchGroups();
      await fetch('/api/groups', { method: 'PATCH' }); // Trigger auto-assignment
      
      setShowCreate(false);
      setNewGroup({ name: '', group_type: 'Age', criteria: '', lead_ids: [] });
      setLeadSearch('');
      setEditingLead(null);
      setTempLead({});
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error('Failed to save group');
    } finally {
      setLoading(false);
    }
  };

  // Delete group
  const handleDeleteGroup = async () => {
    if (!confirmDelete.group) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/groups?id=${confirmDelete.group.id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete group');
      }
      
      toast.success('Group deleted successfully');
      await fetchGroups();
      setConfirmDelete({ open: false, group: null });
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    } finally {
      setLoading(false);
    }
  };

  // Auto-assign leads to groups
  const handleAutoAssign = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/groups', { method: 'PATCH' });
      
      if (!res.ok) {
        throw new Error('Failed to auto-assign leads');
      }
      
      toast.success('Leads auto-assigned to groups successfully');
      await fetchGroups();
    } catch (error) {
      console.error('Error auto-assigning leads:', error);
      toast.error('Failed to auto-assign leads');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Groups Management</h1>
          <p className="text-muted-foreground">Organize leads into targeted groups for campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAutoAssign} disabled={loading}>
            Auto-Create & Assign Groups
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90" onClick={() => setShowCreate('create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Group
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <Select value={typeFilter} onValueChange={val => { setTypeFilter(val); setCriteriaFilter('All'); }}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Age">Age Groups</SelectItem>
                <SelectItem value="Course">Course Interest</SelectItem>
                <SelectItem value="City">Location</SelectItem>
                <SelectItem value="Admission Status">Admission Status</SelectItem>
              </SelectContent>
            </Select>
            {/* Second-level filter: criteria */}
            {typeFilter !== 'All' && criteriaOptions.length > 0 && (
              <Select value={criteriaFilter} onValueChange={setCriteriaFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder={`Select ${typeFilter.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All {typeFilter}s</SelectItem>
                  {criteriaOptions.map(opt => (
                    <SelectItem key={String(opt)} value={String(opt)}>{String(opt)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{groups.filter(g => g.group_type === 'Age').length}</div>
            <p className="text-sm text-muted-foreground">Age Groups</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{groups.filter(g => g.group_type === 'Course').length}</div>
            <p className="text-sm text-muted-foreground">Course Groups</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{groups.filter(g => g.group_type === 'City').length}</div>
            <p className="text-sm text-muted-foreground">City Groups</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{groups.filter(g => g.group_type === 'Admission Status').length}</div>
            <p className="text-sm text-muted-foreground">Status Groups</p>
          </CardContent>
        </Card>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => {
          const groupLeads = leads.filter(l => group.lead_ids.includes(l.id));
          return (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(group.group_type)}
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(group.group_type)}`}>
                    {group.group_type}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Criteria:</p>
                  <p className="text-sm font-medium">{group.criteria}</p>
                </div>
                
                {/* Creation Date */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Created: {new Date(group.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-lg font-bold text-primary">{group.lead_count}</span>
                  <span className="text-sm text-muted-foreground">leads</span>
                </div>
                
                {/* Lead Details */}
                {group.lead_ids.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Leads in this group:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {groupLeads.map(lead => (
                        <div key={lead.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <div>
                            <span className="font-medium">#{lead.id}</span> - {lead.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {lead.phone}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Show all Leads button opens modal */}
                <div className="mb-2">
                  <Button size="sm" variant="outline" onClick={() => { setLeadsModalGroup(group); setLeadsModalSearch(''); setLeadsModalSelectedLead(null); }}>
                    Show all Leads
                  </Button>
                </div>
                <div className="flex gap-2 mt-2">
                  <div className="mb-2 w-full">
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
                  <Button style={{background:'#25D366', color:'#fff'}} variant="default" size="sm" className="flex-1 flex items-center justify-center gap-2" onClick={() => setMessageModal({ open: true, group: group, type: 'whatsapp' })}>
                    WhatsApp
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 flex items-center justify-center gap-2" onClick={() => setMessageModal({ open: true, group: group, type: 'email' })}>
                    Email
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                    setShowCreate('edit');
                    setNewGroup({ ...group });
                  }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => setConfirmDelete({ open: true, group })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No groups found matching your criteria.</p>
              <Button className="mt-4 bg-gradient-primary hover:opacity-90" onClick={() => setShowCreate('create')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Group
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Group Modal */}
      {(showCreate === 'create' || showCreate === 'edit') && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card text-card-foreground p-6 rounded shadow-lg w-full max-w-md border">
            <h2 className="text-xl font-bold mb-4">{showCreate === 'edit' ? 'Edit Group' : 'Create New Group'}</h2>
            <div className="mb-2">
              <label className="block mb-1">Name</label>
              <Input className="w-full" value={newGroup.name} onChange={e => setNewGroup(g => ({ ...g, name: e.target.value }))} />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Type</label>
              <Select value={newGroup.group_type} onValueChange={value => setNewGroup(g => ({ ...g, group_type: value as GroupType }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Age">Age</SelectItem>
                  <SelectItem value="Course">Course</SelectItem>
                  <SelectItem value="City">City</SelectItem>
                  <SelectItem value="Admission Status">Admission Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mb-2">
              <label className="block mb-1">Criteria</label>
              <Input className="w-full" value={newGroup.criteria} onChange={e => setNewGroup(g => ({ ...g, criteria: e.target.value }))} />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Add/Search Leads <span className="text-destructive">*</span></label>
              <Input
                className="w-full mb-2"
                placeholder="Search by name, phone, or email..."
                value={leadSearch}
                onChange={e => { setLeadSearch(e.target.value); setEditingLead(null); setTempLead({}); }}
              />
              {/* Show search results or add new option */}
              {leadSearch && !editingLead && (
                <div className="max-h-32 overflow-y-auto border border-border rounded mb-2 bg-popover divide-y">
                  {leads.filter(l =>
                    l.full_name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
                    l.phone?.toLowerCase().includes(leadSearch.toLowerCase()) ||
                    l.email?.toLowerCase().includes(leadSearch.toLowerCase())
                  ).map(l => (
                    <div key={l.id} className="p-2 cursor-pointer hover:bg-accent" onClick={() => { setEditingLead(l); setTempLead(l); }}>
                      <div className="font-medium">{l.full_name || l.phone}</div>
                      <div className="text-xs text-muted-foreground">{l.phone} | {l.email}</div>
                    </div>
                  ))}
                  {/* Option to add new lead if not found */}
                  {leads.filter(l =>
                    l.full_name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
                    l.phone?.toLowerCase().includes(leadSearch.toLowerCase()) ||
                    l.email?.toLowerCase().includes(leadSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="p-2 cursor-pointer hover:bg-accent" onClick={() => { setEditingLead({} as Lead); setTempLead({ full_name: leadSearch }); }}>
                      + Add new lead: <b>{leadSearch}</b>
                    </div>
                  )}
                </div>
              )}
              {/* Lead edit/add form */}
              {editingLead && (
                <div className="border border-border rounded p-3 mb-2 bg-muted">
                  <div className="mb-2">
                    <label className="block text-xs mb-1">Name</label>
                    <Input className="w-full" value={tempLead.full_name || ''} onChange={e => setTempLead(t => ({ ...t, full_name: e.target.value }))} />
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs mb-1">Phone</label>
                    <Input className="w-full" value={tempLead.phone || ''} onChange={e => setTempLead(t => ({ ...t, phone: e.target.value }))} />
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs mb-1">Email</label>
                    <Input className="w-full" value={tempLead.email || ''} onChange={e => setTempLead(t => ({ ...t, email: e.target.value }))} />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditingLead(null); setTempLead({}); }}>Cancel</Button>
                    <Button size="sm" onClick={() => {
                      // Save or update lead
                      let updatedLeads = leads;
                      let leadId = editingLead.id;
                      if (!leadId) {
                        // New lead - would need to create via API
                        toast.info('New lead creation via API not implemented yet');
                        return;
                      } else {
                        // Update existing lead - would need to update via API
                        toast.info('Lead update via API not implemented yet');
                        return;
                      }
                      // Add to group if not already
                      if (!newGroup.lead_ids.includes(leadId)) {
                        setNewGroup(g => ({ ...g, lead_ids: [...g.lead_ids, leadId!] }));
                      }
                      setEditingLead(null);
                      setTempLead({});
                      setLeadSearch('');
                    }}>Save</Button>
                  </div>
                </div>
              )}
              {/* List of leads in group */}
              <div className="mt-2">
                <div className="font-semibold text-xs mb-1">Leads in this group:</div>
                <div className="max-h-24 overflow-y-auto divide-y">
                  {newGroup.lead_ids.map(id => {
                    const l = leads.find(x => x.id === id);
                    if (!l) return null;
                    return (
                      <div key={id} className="flex items-center justify-between p-1 text-xs">
                        <span>{l.full_name || l.phone} <span className="text-muted-foreground">({l.phone})</span></span>
                        <Button size="sm" variant="destructive" onClick={() => setNewGroup(g => ({ ...g, lead_ids: g.lead_ids.filter(x => x !== id) }))}>Remove</Button>
                      </div>
                    );
                  })}
                  {newGroup.lead_ids.length === 0 && <div className="text-xs text-destructive mt-1">At least one lead is required.</div>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => { setShowCreate(false); setNewGroup({ name: '', group_type: 'Age', criteria: '', lead_ids: [] }); setLeadSearch(''); setEditingLead(null); setTempLead({}); }} variant="outline">Cancel</Button>
              <Button onClick={handleSaveGroup} disabled={loading}>
                {loading ? 'Saving...' : (showCreate === 'edit' ? 'Save Changes' : 'Create')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Dialog */}
      {confirmDelete.open && confirmDelete.group && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card text-card-foreground p-6 rounded shadow-lg w-full max-w-sm border">
            <h2 className="text-xl font-bold mb-4">Delete Group</h2>
            <p className="mb-4">Do you really want to delete <b>{confirmDelete.group.name}</b>?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete({ open: false, group: null })}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteGroup} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card text-card-foreground p-6 rounded shadow-lg w-full max-w-md border">
            <h2 className="text-xl font-bold mb-4">Send {messageModal.type === 'whatsapp' ? 'WhatsApp' : 'Email'} to Group</h2>
            <div className="mb-2">
              <label className="block mb-1">Message</label>
              <Textarea className="w-full h-24 mb-2" placeholder="Type your message here..." value={message} onChange={e => setMessage(e.target.value)} />
              <label className="block mb-1">Attachment <span className="text-destructive">*</span></label>
              <input type="file" multiple onChange={handleAttachmentChange} className="file:bg-background file:text-foreground file:border file:border-border file:rounded file:px-3 file:py-1 file:mr-3 file:text-sm border border-border rounded w-full p-2 bg-background text-foreground" />
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
            <div className="flex gap-2 mt-4">
              <Button onClick={() => {
                setMessageModal({ open: false, group: null, type: '' });
                setAttachments([]);
                setMessage('');
              }} variant="outline">Cancel</Button>
              <Button onClick={() => {
                if (!message.trim()) return;
                if (attachments.length === 0) {
                  toast.error('At least one attachment is required.');
                  return;
                }
                // Send logic here
                toast.success('Message sent successfully!');
                setMessageModal({ open: false, group: null, type: '' });
                setAttachments([]);
                setMessage('');
              }}>Send</Button>
            </div>
          </div>
        </div>
      )}

      {/* Leads Modal for Group */}
      {leadsModalGroup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card text-card-foreground p-6 rounded shadow-lg w-full max-w-lg relative border">
            <button className="absolute top-2 right-2 text-xl" onClick={() => { setLeadsModalGroup(null); setLeadsModalSelectedLead(null); }}>&times;</button>
            {!leadsModalSelectedLead ? (
              <>
                <h2 className="text-xl font-bold mb-4">Leads in {leadsModalGroup.name}</h2>
                <Input
                  className="w-full mb-3"
                  placeholder="Search leads by name, phone, or email..."
                  value={leadsModalSearch}
                  onChange={e => setLeadsModalSearch(e.target.value)}
                  autoFocus
                />
                <div className="max-h-72 overflow-y-auto divide-y">
                  {leads
                    .filter(l => leadsModalGroup.lead_ids.includes(l.id))
                    .filter(l => {
                      const q = leadsModalSearch.toLowerCase();
                      return (
                        l.full_name?.toLowerCase().includes(q) ||
                        l.phone?.toLowerCase().includes(q) ||
                        l.email?.toLowerCase().includes(q)
                      );
                    })
                    .map(lead => (
                      <div
                        key={lead.id}
                        className="p-2 cursor-pointer hover:bg-muted/50"
                        onClick={() => setLeadsModalSelectedLead(lead)}
                      >
                        <div className="font-medium">{lead.full_name || lead.phone}</div>
                        <div className="text-xs text-muted-foreground">{lead.phone} | {lead.email}</div>
                      </div>
                    ))}
                  {leads.filter(l => leadsModalGroup.lead_ids.includes(l.id)).length === 0 && (
                    <div className="text-center text-muted-foreground py-8">No leads in this group.</div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button className="mb-2 text-sm text-primary underline" onClick={() => setLeadsModalSelectedLead(null)}>&larr; Back to list</button>
                <h2 className="text-xl font-bold mb-4">Lead Information</h2>
                <div className="space-y-2">
                  <div><span className="font-semibold">Phone:</span> {leadsModalSelectedLead.phone}</div>
                  <div><span className="font-semibold">Email:</span> {leadsModalSelectedLead.email}</div>
                  {leadsModalSelectedLead.full_name && <div><span className="font-semibold">Name:</span> {leadsModalSelectedLead.full_name}</div>}
                  {leadsModalSelectedLead.parent_name && <div><span className="font-semibold">Parent:</span> {leadsModalSelectedLead.parent_name}</div>}
                  {leadsModalSelectedLead.age && <div><span className="font-semibold">Age:</span> {leadsModalSelectedLead.age}</div>}
                  {leadsModalSelectedLead.city && <div><span className="font-semibold">City:</span> {leadsModalSelectedLead.city}</div>}
                  {leadsModalSelectedLead.interested_course && <div><span className="font-semibold">Course:</span> {leadsModalSelectedLead.interested_course}</div>}
                  {leadsModalSelectedLead.lead_status && <div><span className="font-semibold">Status:</span> {leadsModalSelectedLead.lead_status}</div>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}