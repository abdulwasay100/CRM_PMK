import { useState } from "react";
import { Plus, Users, Tag, MapPin, GraduationCap, Calendar, Paperclip, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lead, Group } from "@/types";
import React from "react";
import { Dialog } from "@/components/ui/dialog";

// Helper functions for localStorage
function getLeadsFromStorage() {
  const data = localStorage.getItem('leads');
  if (data) {
    try { return JSON.parse(data); } catch { return []; }
  }
  return [];
}
function getGroupsFromStorage() {
  const data = localStorage.getItem('groups');
  if (data) {
    try { return JSON.parse(data); } catch { return []; }
  }
  return [];
}
function saveGroupsToStorage(groups) {
  localStorage.setItem('groups', JSON.stringify(groups));
}
function saveLeadsToStorage(leads) {
  localStorage.setItem('leads', JSON.stringify(leads));
}

export default function Groups() {
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [criteriaFilter, setCriteriaFilter] = useState<string>("All");
  const [groups, setGroups] = React.useState<Group[]>(getGroupsFromStorage());
  const [leads, setLeads] = React.useState<Lead[]>(getLeadsFromStorage());
  const [showCreate, setShowCreate] = useState<false | 'create' | 'edit'>(false);
  const [newGroup, setNewGroup] = useState<{ id?: string; name: string; type: string; criteria: string; leadIds: string[] }>({ name: '', type: 'Age', criteria: '', leadIds: [] });
  const [messageModal, setMessageModal] = useState({ open: false, group: null, type: '' });
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; group: Group | null }>({ open: false, group: null });
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]); // Track expanded group IDs
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null); // Track selected lead for popup
  const [leadsModalGroup, setLeadsModalGroup] = useState<Group | null>(null); // Track which group's leads modal is open
  const [leadsModalSearch, setLeadsModalSearch] = useState(''); // Search term in modal
  const [leadsModalSelectedLead, setLeadsModalSelectedLead] = useState<Lead | null>(null); // Selected lead in modal
  const [leadSearch, setLeadSearch] = useState('');
  const [editingLead, setEditingLead] = useState<Lead | null>(null); // Lead being edited/added
  const [tempLead, setTempLead] = useState<Partial<Lead>>({}); // For new lead info
  // Add attachment state for message modal
  const [attachments, setAttachments] = useState<File[]>([]);
  // Handler for file input
  function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files)]);
    }
  }
  function handleRemoveAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }
  // Remove messageType, bulkType, attachment, message, attachmentError state and modal logic

  React.useEffect(() => {
    setGroups(getGroupsFromStorage());
    setLeads(getLeadsFromStorage());
  }, []);

  // Get all unique criteria for the selected type
  const criteriaOptions = React.useMemo(() => {
    if (typeFilter === 'All') return [];
    const set = new Set(groups.filter(g => g.type === typeFilter).map(g => g.criteria));
    return Array.from(set);
  }, [groups, typeFilter]);

  const filteredGroups = groups.filter(group => {
    const matchesType = typeFilter === "All" || group.type === typeFilter;
    const matchesCriteria = typeFilter === "All" || criteriaFilter === "All" || group.criteria === criteriaFilter;
    return matchesType && matchesCriteria;
  });

  const getTypeIcon = (type: Group['type']) => {
    switch (type) {
      case 'Age': return <Calendar className="w-4 h-4 text-primary" />;
      case 'Course': return <GraduationCap className="w-4 h-4 text-success" />;
      case 'City': return <MapPin className="w-4 h-4 text-warning" />;
      case 'Admission Status': return <Tag className="w-4 h-4 text-destructive" />;
      default: return <Users className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeColor = (type: Group['type']) => {
    switch (type) {
      case 'Age': return 'bg-primary-light text-primary';
      case 'Course': return 'bg-success-light text-success';
      case 'City': return 'bg-warning-light text-warning';
      case 'Admission Status': return 'bg-destructive-light text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const totalLeads = groups.reduce((sum, group) => sum + group.leadIds.length, 0);

  // Only leads with both phone and email
  const selectableLeads = leads.filter(l => l.phone && l.email);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Groups Management</h1>
          <p className="text-muted-foreground">Organize leads into targeted groups for campaigns</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90" onClick={() => setShowCreate('create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Group
        </Button>
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
            <div className="text-2xl font-bold text-primary">{groups.filter(g => g.type === 'Age').length}</div>
            <p className="text-sm text-muted-foreground">Age Groups</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{groups.filter(g => g.type === 'Course').length}</div>
            <p className="text-sm text-muted-foreground">Course Groups</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{groups.filter(g => g.type === 'City').length}</div>
            <p className="text-sm text-muted-foreground">City Groups</p>
          </CardContent>
        </Card>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => {
          const groupLeads = leads.filter(l => group.leadIds.includes(l.id));
          return (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(group.type)}
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(group.type)}`}>
                    {group.type}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Criteria:</p>
                  <p className="text-sm font-medium">{group.criteria}</p>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-lg font-bold text-primary">{groupLeads.length}</span>
                  <span className="text-sm text-muted-foreground">leads</span>
                </div>
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
                  <Button style={{background:'#25D366', color:'#fff'}} variant="default" size="sm" className="flex-1 flex items-center justify-center gap-2" onClick={() => setMessageModal({ open: true, group, type: 'whatsapp' })}>
                    WhatsApp
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 flex items-center justify-center gap-2" onClick={() => setMessageModal({ open: true, group, type: 'email' })}>
                    Email
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                    setShowCreate('edit');
                    setNewGroup({ ...group });
                  }}>
                    Edit Group
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => setConfirmDelete({ open: true, group })}>
                    Delete Group
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
              <Button className="mt-4 bg-gradient-primary hover:opacity-90">
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
              <Select value={newGroup.type} onValueChange={value => setNewGroup(g => ({ ...g, type: value }))}>
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
                    l.fullName?.toLowerCase().includes(leadSearch.toLowerCase()) ||
                    l.phone?.toLowerCase().includes(leadSearch.toLowerCase()) ||
                    l.email?.toLowerCase().includes(leadSearch.toLowerCase())
                  ).map(l => (
                    <div key={l.id} className="p-2 cursor-pointer hover:bg-accent" onClick={() => { setEditingLead(l); setTempLead(l); }}>
                      <div className="font-medium">{l.fullName || l.phone}</div>
                      <div className="text-xs text-muted-foreground">{l.phone} | {l.email}</div>
                    </div>
                  ))}
                  {/* Option to add new lead if not found */}
                  {leads.filter(l =>
                    l.fullName?.toLowerCase().includes(leadSearch.toLowerCase()) ||
                    l.phone?.toLowerCase().includes(leadSearch.toLowerCase()) ||
                    l.email?.toLowerCase().includes(leadSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="p-2 cursor-pointer hover:bg-accent" onClick={() => { setEditingLead({} as Lead); setTempLead({ fullName: leadSearch }); }}>
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
                    <Input className="w-full" value={tempLead.fullName || ''} onChange={e => setTempLead(t => ({ ...t, fullName: e.target.value }))} />
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
                        // New lead
                        leadId = Date.now().toString() + Math.floor(Math.random() * 1000);
                        const newLead = { ...tempLead, id: leadId } as Lead;
                        updatedLeads = [...leads, newLead];
                        setLeads(updatedLeads);
                        saveLeadsToStorage(updatedLeads);
                      } else {
                        // Update existing lead
                        updatedLeads = leads.map(l => l.id === leadId ? { ...l, ...tempLead } as Lead : l);
                        setLeads(updatedLeads);
                        saveLeadsToStorage(updatedLeads);
                      }
                      // Add to group if not already
                      if (!newGroup.leadIds.includes(leadId)) {
                        setNewGroup(g => ({ ...g, leadIds: [...g.leadIds, leadId!] }));
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
                  {newGroup.leadIds.map(id => {
                    const l = leads.find(x => x.id === id);
                    if (!l) return null;
                    return (
                      <div key={id} className="flex items-center justify-between p-1 text-xs">
                        <span>{l.fullName || l.phone} <span className="text-muted-foreground">({l.phone})</span></span>
                        <Button size="sm" variant="destructive" onClick={() => setNewGroup(g => ({ ...g, leadIds: g.leadIds.filter(x => x !== id) }))}>Remove</Button>
                      </div>
                    );
                  })}
              {newGroup.leadIds.length === 0 && <div className="text-xs text-destructive mt-1">At least one lead is required.</div>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => { setShowCreate(false); setNewGroup({ name: '', type: 'Age', criteria: '', leadIds: [] }); setLeadSearch(''); setEditingLead(null); setTempLead({}); }} variant="outline">Cancel</Button>
              <Button onClick={() => {
                if (showCreate === 'edit' && newGroup.id) {
                  // Edit existing group
                  const updated = groups.map(g => g.id === newGroup.id ? { ...g, ...newGroup } : g);
                  setGroups(updated);
                  saveGroupsToStorage(updated);
                } else {
                  // Create new group
                  const group = {
                    id: Date.now().toString() + Math.floor(Math.random() * 1000),
                    name: newGroup.name,
                    type: newGroup.type,
                    criteria: newGroup.criteria,
                    leadIds: newGroup.leadIds,
                    createdAt: new Date().toISOString(),
                  };
                  const updated = [...groups, group];
                  setGroups(updated);
                  saveGroupsToStorage(updated);
                }
                setShowCreate(false);
                setNewGroup({ name: '', type: 'Age', criteria: '', leadIds: [] });
                setLeadSearch('');
                setEditingLead(null);
                setTempLead({});
              }}>{showCreate === 'edit' ? 'Save Changes' : 'Create'}</Button>
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
              <Button variant="destructive" onClick={() => {
                const updatedGroups = groups.filter(g => g.id !== confirmDelete.group!.id);
                setGroups(updatedGroups);
                saveGroupsToStorage(updatedGroups);
                setConfirmDelete({ open: false, group: null });
              }}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Group Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="p-4 h-auto flex flex-col items-center space-y-2">
              <Calendar className="w-6 h-6 text-primary" />
              <span className="text-sm">Age-based Groups</span>
            </Button>
            <Button variant="outline" className="p-4 h-auto flex flex-col items-center space-y-2">
              <GraduationCap className="w-6 h-6 text-success" />
              <span className="text-sm">Course Interest</span>
            </Button>
            <Button variant="outline" className="p-4 h-auto flex flex-col items-center space-y-2">
              <MapPin className="w-6 h-6 text-warning" />
              <span className="text-sm">Location-based</span>
            </Button>
            <Button variant="outline" className="p-4 h-auto flex flex-col items-center space-y-2">
              <Tag className="w-6 h-6 text-destructive" />
              <span className="text-sm">Status Groups</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message Modal */}
      {messageModal.open && (
        <Dialog open={messageModal.open} onOpenChange={open => setMessageModal(d => ({ ...d, open }))}>
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
                  setAttachmentError('');
                }} variant="outline">Cancel</Button>
                <Button onClick={() => {
                  if (!message.trim()) return;
                  if (attachments.length === 0) {
                    setAttachmentError('At least one attachment is required.');
                    return;
                  }
                  // Send logic here
                  setMessageModal({ open: false, group: null, type: '' });
                  setAttachments([]);
                  setMessage('');
                  setAttachmentError('');
                }}>Send</Button>
              </div>
            </div>
          </div>
        </Dialog>
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
                    .filter(l => leadsModalGroup.leadIds.includes(l.id))
                    .filter(l => {
                      const q = leadsModalSearch.toLowerCase();
                      return (
                        l.fullName?.toLowerCase().includes(q) ||
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
                        <div className="font-medium">{lead.fullName || lead.phone}</div>
                        <div className="text-xs text-muted-foreground">{lead.phone} | {lead.email}</div>
                      </div>
                    ))}
                  {leads.filter(l => leadsModalGroup.leadIds.includes(l.id)).length === 0 && (
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
                  {leadsModalSelectedLead.fullName && <div><span className="font-semibold">Name:</span> {leadsModalSelectedLead.fullName}</div>}
                  {leadsModalSelectedLead.parentName && <div><span className="font-semibold">Parent:</span> {leadsModalSelectedLead.parentName}</div>}
                  {leadsModalSelectedLead.age && <div><span className="font-semibold">Age:</span> {leadsModalSelectedLead.age}</div>}
                  {leadsModalSelectedLead.city && <div><span className="font-semibold">City:</span> {leadsModalSelectedLead.city}</div>}
                  {leadsModalSelectedLead.interestedCourse && <div><span className="font-semibold">Course:</span> {leadsModalSelectedLead.interestedCourse}</div>}
                  {leadsModalSelectedLead.inquirySource && <div><span className="font-semibold">Source:</span> {leadsModalSelectedLead.inquirySource}</div>}
                  {leadsModalSelectedLead.notes && <div><span className="font-semibold">Notes:</span> {leadsModalSelectedLead.notes}</div>}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lead Info Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card text-card-foreground p-6 rounded shadow-lg w-full max-w-sm relative border">
            <button className="absolute top-2 right-2 text-xl" onClick={() => setSelectedLead(null)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Lead Information</h2>
            <div className="space-y-2">
              <div><span className="font-semibold">Phone:</span> {selectedLead.phone}</div>
              <div><span className="font-semibold">Email:</span> {selectedLead.email}</div>
              {selectedLead.fullName && <div><span className="font-semibold">Name:</span> {selectedLead.fullName}</div>}
              {selectedLead.parentName && <div><span className="font-semibold">Parent:</span> {selectedLead.parentName}</div>}
              {selectedLead.age && <div><span className="font-semibold">Age:</span> {selectedLead.age}</div>}
              {selectedLead.city && <div><span className="font-semibold">City:</span> {selectedLead.city}</div>}
              {selectedLead.interestedCourse && <div><span className="font-semibold">Course:</span> {selectedLead.interestedCourse}</div>}
              {selectedLead.inquirySource && <div><span className="font-semibold">Source:</span> {selectedLead.inquirySource}</div>}
              {selectedLead.notes && <div><span className="font-semibold">Notes:</span> {selectedLead.notes}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}