import React, { useState } from "react";
import { Plus, Mail, MessageSquare, Smartphone, FileText, Play, Pause, BarChart, Paperclip, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Campaign } from "@/types";
import { Dialog } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const initialStats = {
  Flyers: 0,
  Announcements: 0,
  Reminders: 0,
  Targeted: 0,
  Email: 0,
  WhatsApp: 0,
};

const initialCampaign = {
  id: '',
  name: '',
  type: 'Flyers',
  groupIds: [],
  message: '',
  status: 'Active',
};

export default function Campaigns() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [messageModal, setMessageModal] = useState({ open: false, group: null, type: '' });
  const [messageType, setMessageType] = useState('bulk');
  const [bulkType, setBulkType] = useState('Flyers');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [attachmentError, setAttachmentError] = useState('');
  const [stats, setStats] = useState(initialStats);
  const [campaigns, setCampaigns] = useState(() => {
    const stored = localStorage.getItem('campaigns');
    return stored ? JSON.parse(stored) : [];
  });
  const [showCreate, setShowCreate] = useState(false);
  const [newCampaign, setNewCampaign] = useState(initialCampaign);
  const [editId, setEditId] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, campaignId: '' });
  const groups = [];
  const leads = [];
  const [groupType, setGroupType] = useState('');
  // Add per-campaign message and attachment state
  const [campaignMessages, setCampaignMessages] = useState({});
  const [campaignAttachments, setCampaignAttachments] = useState({});
  const [attachmentErrors, setAttachmentErrors] = useState({});

  // LocalStorage persistence
  React.useEffect(() => {
    localStorage.setItem('campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  const filteredCampaigns = [];

  const filteredGroups = typeFilter === "All" ? groups : groups.filter(g => g.type === typeFilter);

  const getTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'Email': return <Mail className="w-4 h-4 text-primary" />;
      case 'SMS': return <Smartphone className="w-4 h-4 text-success" />;
      case 'WhatsApp': return <MessageSquare className="w-4 h-4 text-warning" />;
      case 'Flyer': return <FileText className="w-4 h-4 text-destructive" />;
      default: return <Mail className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'Draft': return 'bg-muted text-muted-foreground';
      case 'Active': return 'bg-success-light text-success';
      case 'Completed': return 'bg-primary-light text-primary';
      case 'Paused': return 'bg-warning-light text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  function handleStatusChange(id: string, status: string) {
    setCampaigns(campaigns.map(c => c.id === id ? { ...c, status } : c));
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Campaign Management</h1>
        <p className="text-muted-foreground">Send bulk or targeted campaigns to groups via WhatsApp or Email with attachments.</p>
      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-primary">{stats.Flyers}</div>
            <p className="text-sm text-muted-foreground">Flyers Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-success">{stats.Announcements}</div>
            <p className="text-sm text-muted-foreground">Announcements Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-warning">{stats.Reminders}</div>
            <p className="text-sm text-muted-foreground">Reminders Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-destructive">{stats.Targeted}</div>
            <p className="text-sm text-muted-foreground">Targeted Campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-primary">{stats.Email}</div>
            <p className="text-sm text-muted-foreground">Email Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-success">{stats.WhatsApp}</div>
            <p className="text-sm text-muted-foreground">WhatsApp Sent</p>
          </CardContent>
        </Card>
      </div>
      {/* Create Campaign Section */}
      <Card>
        <CardHeader>
          <CardTitle>{editId ? 'Edit Campaign' : 'Create Campaign'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={e => {
            e.preventDefault();
            if (!newCampaign.name || !newCampaign.groupIds.length) return;
            if (editId) {
              setCampaigns(cs => cs.map(c => c.id === editId ? { ...newCampaign, id: editId } : c));
              setEditId('');
            } else {
              setCampaigns(cs => [...cs, { ...newCampaign, id: Date.now().toString() }]);
            }
            setNewCampaign(initialCampaign);
            setShowCreate(false);
          }} className="space-y-4">
            <div>
              <label className="block mb-1">Campaign Name</label>
              <input className="border p-2 w-full" value={newCampaign.name} onChange={e => setNewCampaign(c => ({ ...c, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block mb-1">Type</label>
              <select className="border p-2 w-full" value={newCampaign.type} onChange={e => setNewCampaign(c => ({ ...c, type: e.target.value }))}>
                <option value="Flyers">Flyers</option>
                <option value="Announcements">Announcements</option>
                <option value="Reminders">Reminders</option>
                <option value="Targeted">Targeted</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Groups</label>
              <div className="flex gap-2 mb-2">
                <select className="border p-2" value={groupType} onChange={e => {
                  setGroupType(e.target.value);
                  setNewCampaign(c => ({ ...c, groupIds: [] }));
                }} required>
                  <option value="">Select Group Type</option>
                  <option value="Age">Age wise</option>
                  <option value="Course">Course wise</option>
                  <option value="City">City wise</option>
                  <option value="Admission Status">Admission Status wise</option>
                </select>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" disabled={!groupType}>
                    {newCampaign.groupIds.length > 0
                      ? newCampaign.groupIds.map(id => groups.find(g => g.id === id)?.name).filter(Boolean).join(", ")
                      : groupType ? "Select Groups" : "Select Group Type First"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="max-h-60 overflow-y-auto">
                    {groups.filter(g => g.type === groupType).map(g => (
                      <div key={g.id} className="flex items-center gap-2 py-1">
                        <Checkbox
                          checked={newCampaign.groupIds.includes(g.id)}
                          onCheckedChange={checked => {
                            setNewCampaign(c =>
                              checked
                                ? { ...c, groupIds: [...c.groupIds, g.id] }
                                : { ...c, groupIds: c.groupIds.filter(id => id !== g.id) }
                            );
                          }}
                          id={`group-${g.id}`}
                        />
                        <label htmlFor={`group-${g.id}`} className="text-sm cursor-pointer">
                          {g.name}
                        </label>
                      </div>
                    ))}
                    {groups.filter(g => g.type === groupType).length === 0 && (
                      <div className="text-xs text-muted-foreground py-2">No groups found for this type.</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <div className="text-xs text-muted-foreground mt-1">Select a group type, then select one or more groups.</div>
            </div>
            <div>
              <label className="block mb-1">Message</label>
              <textarea className="border p-2 w-full" value={newCampaign.message} onChange={e => setNewCampaign(c => ({ ...c, message: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Status</label>
              <select
                className="border p-2 rounded w-full"
                value={newCampaign.status}
                onChange={e => setNewCampaign({ ...newCampaign, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Non Active">Non Active</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editId ? 'Save Changes' : 'Create Campaign'}</Button>
              {editId && <Button type="button" variant="outline" onClick={() => { setEditId(''); setNewCampaign(initialCampaign); }}>Cancel</Button>}
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Type Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by group type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Age">Age</SelectItem>
                <SelectItem value="Course">Course</SelectItem>
                <SelectItem value="City">City</SelectItem>
                <SelectItem value="Admission Status">Admission Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      {/* Campaigns List Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((c) => {
          return (
            <Card key={c.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{c.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === 'Active' ? 'default' : 'secondary'}>
                      {c.status === 'Active' ? 'Active' : 'Non Active'}
                    </Badge>
                    <select
                      className="border p-1 rounded text-xs ml-2"
                      value={c.status}
                      onChange={e => handleStatusChange(c.id, e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Non Active">Non Active</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Group:</p>
                  <p className="text-sm font-medium">{c.groupIds.map(id => groups.find(g => g.id === id)?.name).filter(Boolean).join(', ') || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Message:</p>
                  <p className="text-sm font-medium">{c.message}</p>
                </div>
                {/* Per-campaign message and attachment */}
                <div>
                  <label className="block mb-1 text-xs">Send Message</label>
                  <textarea
                    className="border p-2 w-full text-xs"
                    placeholder="Type message to send..."
                    value={campaignMessages[c.id] || ''}
                    onChange={e => setCampaignMessages(m => ({ ...m, [c.id]: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs">Attachment (PDF/Image)</label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="border p-2 w-full text-xs"
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setCampaignAttachments(a => ({ ...a, [c.id]: file }));
                      setAttachmentErrors(e => ({ ...e, [c.id]: '' }));
                    }}
                  />
                  {attachmentErrors[c.id] && <div className="text-xs text-destructive mt-1">{attachmentErrors[c.id]}</div>}
                </div>
                <div className="flex gap-2 mt-2">
                  <div className="mb-2 w-full">
                    <label className="block text-xs font-medium mb-1">Send from Phone Number</label>
                    <select className="border p-2 rounded w-full max-w-xs" style={{maxWidth:'220px'}}>
                      <option value="923119876543">923119876543</option>
                      <option value="923112345678">923112345678</option>
                    </select>
                  </div>
                  <Button style={{background:'#25D366', color:'#fff'}} variant="default" size="sm" className="flex-1 flex items-center justify-center gap-2 text-xs py-1" onClick={() => {
                    if (!campaignAttachments[c.id]) {
                      setAttachmentErrors(e => ({ ...e, [c.id]: 'Attachment is required.' }));
                      return;
                    }
                    // WhatsApp send logic here using campaignMessages[c.id] and campaignAttachments[c.id]
                    setCampaignMessages(m => ({ ...m, [c.id]: '' }));
                    setCampaignAttachments(a => ({ ...a, [c.id]: null }));
                    setAttachmentErrors(e => ({ ...e, [c.id]: '' }));
                  }}>
                    WhatsApp
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 flex items-center justify-center gap-2 text-xs py-1" onClick={() => {
                    if (!campaignAttachments[c.id]) {
                      setAttachmentErrors(e => ({ ...e, [c.id]: 'Attachment is required.' }));
                      return;
                    }
                    // Email send logic here using campaignMessages[c.id] and campaignAttachments[c.id]
                    setCampaignMessages(m => ({ ...m, [c.id]: '' }));
                    setCampaignAttachments(a => ({ ...a, [c.id]: null }));
                    setAttachmentErrors(e => ({ ...e, [c.id]: '' }));
                  }}>
                    Email
                  </Button>
                  <Button variant="default" size="sm" className="flex-1 flex items-center justify-center gap-2 font-bold bg-primary text-white hover:bg-primary-dark text-xs py-1" onClick={() => { setEditId(c.id); setNewCampaign(c); setShowCreate(true); }}>
                    <Edit className="w-4 h-4 text-white" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1 flex items-center justify-center gap-2 font-bold text-xs py-1" onClick={() => setDeleteDialog({ open: true, campaignId: c.id })}>
                    <Trash2 className="w-4 h-4 text-white" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Delete Campaign Confirmation Dialog */}
      {deleteDialog.open && (
        <Dialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog(d => ({ ...d, open }))}>
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4">Delete Campaign</h2>
              <p className="mb-4">Are you sure you want to delete this campaign?</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteDialog({ open: false, campaignId: '' })}>Cancel</Button>
                <Button variant="destructive" onClick={() => {
                  setCampaigns(cs => cs.filter(x => x.id !== deleteDialog.campaignId));
                  setDeleteDialog({ open: false, campaignId: '' });
                }}>Delete</Button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
      {/* Remove Groups Messaging UI from Campaigns page: do not render filteredGroups.map or any group cards here */}
    </div>
  );
}