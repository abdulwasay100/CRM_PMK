import { useState } from "react";
import { Plus, Clock, CheckCircle, AlertCircle, User, Calendar, Bell, Phone, Mail, FileText, CheckSquare, Square, Filter, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
import { Lead } from "@/types";
import { toast } from "react-toastify";
import { useRef } from "react";

// Reminder type (sync with AddLead)
type ReminderType = 'Call back' | 'Send brochure' | 'Confirm registration';
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
  title?: string;
  description?: string;
  assignedTo?: string;
  priority?: 'Low' | 'Medium' | 'High';
}

async function fetchRemindersFromDB(): Promise<Reminder[]> {
  const res = await fetch('/api/reminders', { cache: 'no-store' });
  const data = await res.json();
  return (data.reminders || []).map((r: any) => ({
    id: String(r.id),
    leadId: String(r.lead_id),
    leadName: r.lead_name,
    type: (r.type as ReminderType) || 'Call back',
    dueDate: r.due_date,
    notes: r.notes || '',
    status: (r.status as any) || 'Pending',
    isCompleted: r.status === 'Completed',
    createdAt: r.created_at,
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Low',
  }));
}

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [counselorFilter, setCounselorFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("all-tasks");
  // Load reminders from DB
  const [reminders, setReminders] = useState<Reminder[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        setReminders(await fetchRemindersFromDB());
      } catch {}
    })();
  }, []);

  // No localStorage syncing

  // --- Reminder Creation State ---
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [reminderType, setReminderType] = useState<ReminderType>('Call back');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderNotes, setReminderNotes] = useState('');
  const [reminderError, setReminderError] = useState('');
  // --- Leads (from database) ---
  const [leads, setLeads] = useState<any[]>([]);
  
  async function fetchLeadsFromDB(): Promise<any[]> {
    try {
      const res = await fetch('/api/leads', { cache: 'no-store' });
      const data = await res.json();
      return data.leads || [];
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  }
  
  React.useEffect(() => {
    (async () => {
      try {
        setLeads(await fetchLeadsFromDB());
      } catch (error) {
        console.error('Error loading leads:', error);
      }
    })();
  }, []);

  const leadOptions = leads.map(l => ({ 
    value: l.id, 
    label: `${l.full_name || 'Unknown'} (${l.phone || 'No Phone'})`, 
    phone: l.phone || '',
    name: l.full_name || '',
    email: l.email || '',
    parentName: l.parent_name || '',
    city: l.city || ''
  }));
  
  const filteredLeadOptions = React.useMemo(() => {
    if (!phoneInput.trim()) return [];
    
    const searchTerm = phoneInput.toLowerCase().trim();
    const phoneOnly = phoneInput.replace(/\D/g, '');
    
    return leadOptions.filter(o => {
      // Search by phone number (digits only)
      if (phoneOnly.length > 0 && o.phone.replace(/\D/g, '').includes(phoneOnly)) {
        return true;
      }
      
      // Search by name
      if (o.name.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Search by email
      if (o.email.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Search by parent name
      if (o.parentName.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Search by city
      if (o.city.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      return false;
    });
  }, [phoneInput, leadOptions]);

  async function handleAddReminder() {
    if (!selectedLead || !reminderDate) {
      setReminderError('Please select a lead and date.');
      return;
    }
    
    const lead = leads.find(l => l.id === selectedLead);
    if (!lead) {
      setReminderError('Selected lead not found.');
      return;
    }
    
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: Number(lead.id),
          lead_name: lead.full_name || 'Unknown',
          phone: lead.phone || '',
          type: reminderType,
          due_date: reminderDate,
          notes: reminderNotes,
          status: 'Pending',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create reminder');
      }
      
      setReminders(await fetchRemindersFromDB());
      setSelectedLead(null);
      setPhoneInput('');
      setReminderType('Call back');
      setReminderDate('');
      setReminderNotes('');
      setReminderError('');
      toast.success('Reminder added successfully!');
    } catch (error) {
      console.error('Error adding reminder:', error);
      setReminderError('Failed to add reminder. Please try again.');
      toast.error('Failed to add reminder');
    }
  }

  async function handleMarkInProgress(reminderId: string) {
    try {
      const response = await fetch('/api/reminders/status', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id: Number(reminderId), status: 'In Progress' }) 
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      setReminders(await fetchRemindersFromDB());
      toast.success('Status updated to In Progress!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  }

  async function handleMarkComplete(reminderId: string) {
    try {
      const response = await fetch('/api/reminders/status', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id: Number(reminderId), status: 'Completed' }) 
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      setReminders(await fetchRemindersFromDB());
      toast.success('Task completed successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  }

  async function handleDeleteTask(reminderId: string) {
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete this reminder?\n\n` +
      `Lead: ${reminder.leadName}\n` +
      `Type: ${reminder.type}\n` +
      `Due Date: ${reminder.dueDate}\n` +
      `Status: ${reminder.status}`
    );
    
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, { method: 'DELETE' });
      
      if (!response.ok) {
        throw new Error('Failed to delete reminder');
      }
      
      setReminders(await fetchRemindersFromDB());
      toast.success('Reminder deleted successfully!');
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error('Failed to delete reminder');
    }
  }

  const filteredTasks = reminders.filter(task => {
    const matchesStatus = statusFilter === "All" || task.status === statusFilter;
    const matchesCounselor = counselorFilter === "All" || task.assignedTo === counselorFilter;
    
    return matchesStatus && matchesCounselor;
  });

  const getStatusIcon = (status: Reminder['status']) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4 text-warning" />;
      case 'In Progress': return <AlertCircle className="w-4 h-4 text-primary" />;
      case 'Completed': return <CheckCircle className="w-4 h-4 text-success" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: Reminder['status']) => {
    switch (status) {
      case 'Pending': return 'bg-warning-light text-warning';
      case 'In Progress': return 'bg-primary-light text-primary';
      case 'Completed': return 'bg-success-light text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: Reminder['type']) => {
    switch (type) {
      case 'Call back': return <Phone className="w-4 h-4" />;
      case 'Send brochure': return <FileText className="w-4 h-4" />;
      case 'Confirm registration': return <CheckSquare className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const counselors = Array.from(new Set(reminders.map(task => task.assignedTo))).filter(
    (c): c is string => !!c && String(c).trim() !== ''
  );

  // Helper functions for reminders
  const toggleReminder = (reminderId: string) => {
    setReminders(reminders.map(r => 
      r.id === reminderId ? { ...r, isCompleted: !r.isCompleted } : r
    ));
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'Call back': return <Phone className="w-4 h-4" />;
      case 'Send brochure': return <FileText className="w-4 h-4" />;
      case 'Confirm registration': return <CheckSquare className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTodayReminders = () => {
    const today = new Date().toDateString();
    return reminders.filter(r => new Date(r.dueDate).toDateString() === today);
  };

  const getWeekReminders = () => {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return reminders.filter(r => {
      const dueDate = new Date(r.dueDate);
      return dueDate >= today && dueDate <= weekFromNow;
    });
  };

  const getOverdueReminders = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return reminders.filter(r =>
      (r.status === 'Pending' || r.status === 'In Progress') &&
      new Date(r.dueDate) < today
    );
  };

  // Edit modal state
  const [editReminderId, setEditReminderId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{ type: Reminder['type']; status: Reminder['status']; dueDate: string; notes: string }>({ type: 'Call back', status: 'Pending', dueDate: '', notes: '' });
  const editModalRef = useRef<HTMLDialogElement>(null);

  function openEdit(reminder: Reminder) {
    setEditReminderId(reminder.id);
    setEditFields({
      type: reminder.type,
      status: reminder.status,
      dueDate: reminder.dueDate,
      notes: reminder.notes || ''
    });
    setTimeout(() => editModalRef.current?.showModal(), 0);
  }

  function closeEdit() {
    setEditReminderId(null);
    editModalRef.current?.close();
  }

  async function saveEdit() {
    if (!editReminderId) return;
    
    try {
      await fetch('/api/reminders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Number(editReminderId),
          type: editFields.type,
          status: editFields.status,
          due_date: editFields.dueDate,
          notes: editFields.notes,
        }),
      });
      
      // Refresh reminders from database
      setReminders(await fetchRemindersFromDB());
      closeEdit();
      toast.success('Reminder updated successfully!');
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast.error('Failed to update reminder');
    }
  }

  function duplicateReminder(reminder: Reminder) {
    const newReminder: Reminder = {
      ...reminder,
      id: Date.now().toString() + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      status: 'Pending',
      isCompleted: false,
    };
    setReminders([newReminder, ...reminders]);
    toast.success('Reminder duplicated!');
  }

  return (
    <div className="space-y-6">
      {/* Reminder Creation Section */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Add Reminder / To-Do</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 relative">
              <label className="block text-xs font-medium mb-1">Search Lead</label>
              <Input
                className="w-full"
                value={phoneInput}
                onChange={e => {
                  setPhoneInput(e.target.value);
                  setSelectedLead(null);
                }}
                placeholder="Search by name, phone, email, parent name, or city..."
                autoComplete="off"
              />
              {phoneInput.trim() && !selectedLead && (
                <div className="absolute z-10 bg-popover border border-border rounded w-full mt-1 max-h-60 overflow-auto shadow-lg">
                  {filteredLeadOptions.length > 0 ? (
                    filteredLeadOptions.map(o => (
                      <div
                        key={o.value}
                        className="px-3 py-3 hover:bg-accent cursor-pointer text-sm border-b border-border last:border-b-0"
                        onClick={() => {
                          setSelectedLead(o.value);
                          setPhoneInput(`${o.name} (${o.phone})`);
                        }}
                      >
                        <div className="font-medium text-foreground">{o.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <div>📞 {o.phone}</div>
                          {o.email && <div>📧 {o.email}</div>}
                          {o.parentName && <div>👨‍👩‍👧‍👦 {o.parentName}</div>}
                          {o.city && <div>📍 {o.city}</div>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                      No leads found matching "{phoneInput}"
                    </div>
                  )}
                </div>
              )}
              {selectedLead && (
                <div className="text-xs text-muted-foreground mt-1">
                  Selected: {leadOptions.find(o => o.value === selectedLead)?.label}
                </div>
              )}
            </div>
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
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">Notes</label>
              <Input
                className="w-full"
                value={reminderNotes}
                onChange={e => setReminderNotes(e.target.value)}
                placeholder="Add notes (optional)"
              />
            </div>
            <Button onClick={handleAddReminder} className="h-10">Add Reminder</Button>
          </div>
          {reminderError && <div className="text-destructive mt-2">{reminderError}</div>}
        </CardContent>
      </Card>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks Management</h1>
          <p className="text-muted-foreground">Track and manage all counselor tasks</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={counselorFilter} onValueChange={setCounselorFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by counselor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Counselors</SelectItem>
                {counselors.map(counselor => (
                  <SelectItem key={counselor} value={counselor}>{counselor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{reminders.filter(t => t.status === 'Pending').length}</div>
            <p className="text-sm text-muted-foreground">Pending Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{reminders.filter(t => t.status === 'In Progress').length}</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{reminders.filter(t => t.status === 'Completed').length}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="today">Today's To-Do</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Dashboard</TabsTrigger>
        </TabsList>

        {/* All Tasks Tab */}
        <TabsContent value="all-tasks" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Tasks ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col gap-3">
                  {/* Top row: Lead name and status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                      {getTypeIcon(task.type)}
                      <span>{task.leadName || 'Unknown Lead'}</span>
                      <span className="text-muted-foreground font-normal text-sm">— {task.type}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(task.status)}`}>
                      {getStatusIcon(task.status)}
                      {task.status}
                    </span>
                  </div>

                  {/* Notes (optional) */}
                  {task.notes && (
                    <div className="text-sm text-muted-foreground">
                      {task.notes}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Lead: {task.leadName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2">
                      {task.status === 'Pending' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleMarkInProgress(task.id)}>
                            In Progress
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleMarkComplete(task.id)}>
                            Mark Complete
                          </Button>
                        </>
                      )}
                      {task.status === 'In Progress' && (
                        <Button variant="outline" size="sm" onClick={() => handleMarkComplete(task.id)}>
                          Mark Complete
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => openEdit(task)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteTask(task.id)}>Remove</Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tasks found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Reminders Tab */}
        <TabsContent value="reminders" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Follow-up Reminders</CardTitle>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reminder
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => toggleReminder(reminder.id)}
                          className="flex items-center justify-center w-5 h-5 rounded border-2 border-primary hover:bg-primary/10 transition-colors"
                        >
                          {reminder.isCompleted ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div className="flex items-center gap-2">
                          {getReminderIcon(reminder.type)}
                          <div>
                            <h3 className={`font-semibold ${reminder.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {reminder.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Lead: {reminder.leadName} • Assigned to: {reminder.assignedTo}
                            </p>
                            {reminder.notes && <div className="text-xs text-muted-foreground italic">Notes: {reminder.notes}</div>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={reminder.priority === 'High' ? 'destructive' : reminder.priority === 'Medium' ? 'default' : 'secondary'}>
                          {reminder.priority}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          Due: {new Date(reminder.dueDate).toLocaleDateString()}
                        </div>
                        <Button variant="outline" size="sm">
                          <Bell className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Today's To-Do Tab */}
        <TabsContent value="today" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's To-Do Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {/* Today's Reminders */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Today's Reminders ({getTodayReminders().length})
                  </h3>
                  <div className="space-y-3">
                    {getTodayReminders().map((reminder) => (
                      <div key={reminder.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <button
                          onClick={() => toggleReminder(reminder.id)}
                          className="flex items-center justify-center w-5 h-5 rounded border-2 border-primary hover:bg-primary/10 transition-colors"
                        >
                          {reminder.isCompleted ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div className="flex items-center gap-2 flex-1">
                          {getReminderIcon(reminder.type)}
                          <span className={reminder.isCompleted ? 'line-through text-muted-foreground' : ''}>
                            {reminder.title}
                          </span>
                        </div>
                        <Badge variant={reminder.priority === 'High' ? 'destructive' : 'default'}>
                          {reminder.priority}
                        </Badge>
                      </div>
                    ))}
                    {getTodayReminders().length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No reminders for today!</p>
                    )}
                  </div>
                </div>

                {/* Overdue Items */}
                {getOverdueReminders().length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-5 h-5" />
                      Overdue ({getOverdueReminders().length})
                    </h3>
                    <div className="space-y-3">
                      {getOverdueReminders().map((reminder) => (
                        <div key={reminder.id} className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                          <button
                            onClick={() => toggleReminder(reminder.id)}
                            className="flex items-center justify-center w-5 h-5 rounded border-2 border-destructive hover:bg-destructive/10 transition-colors"
                          >
                            {reminder.isCompleted ? (
                              <CheckSquare className="w-4 h-4 text-destructive" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                          <div className="flex items-center gap-2 flex-1">
                            {getReminderIcon(reminder.type)}
                            <span className={reminder.isCompleted ? 'line-through text-muted-foreground' : ''}>
                              {reminder.title}
                            </span>
                          </div>
                          <Badge variant="destructive">Overdue</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly Dashboard Tab */}
        <TabsContent value="weekly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly To-Do Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {/* This Week's Reminders */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    This Week's Reminders ({getWeekReminders().length})
                  </h3>
                  <div className="space-y-3">
                    {getWeekReminders().map((reminder) => (
                      <div key={reminder.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <button
                          onClick={() => toggleReminder(reminder.id)}
                          className="flex items-center justify-center w-5 h-5 rounded border-2 border-primary hover:bg-primary/10 transition-colors"
                        >
                          {reminder.isCompleted ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div className="flex items-center gap-2 flex-1">
                          {getReminderIcon(reminder.type)}
                          <div>
                            <span className={reminder.isCompleted ? 'line-through text-muted-foreground' : ''}>
                              {reminder.title}
                            </span>
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(reminder.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={reminder.priority === 'High' ? 'destructive' : 'default'}>
                          {reminder.priority}
                        </Badge>
                      </div>
                    ))}
                    {getWeekReminders().length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No reminders for this week!</p>
                    )}
                  </div>
                </div>

                {/* Weekly Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-primary">{getWeekReminders().length}</div>
                      <p className="text-sm text-muted-foreground">Total This Week</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-success">{getWeekReminders().filter(r => r.isCompleted).length}</div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-warning">{getWeekReminders().filter(r => !r.isCompleted).length}</div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-destructive">{getOverdueReminders().length}</div>
                      <p className="text-sm text-muted-foreground">Overdue</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <dialog ref={editModalRef} className="rounded-lg p-0 w-full max-w-md">
        <form method="dialog" className="bg-card text-card-foreground p-6 rounded-lg shadow-lg border">
          <h2 className="text-xl font-bold mb-4">Edit Reminder</h2>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1">Type</label>
            <Select
              value={editFields.type}
              onValueChange={(value) => setEditFields(f => ({ ...f, type: value as Reminder['type'] }))}
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
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1">Status</label>
            <Select
              value={editFields.status}
              onValueChange={(value) => setEditFields(f => ({ ...f, status: value as Reminder['status'] }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1">Date</label>
            <Input
              type="date"
              className="w-full"
              value={editFields.dueDate}
              onChange={e => setEditFields(f => ({ ...f, dueDate: e.target.value }))}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1">Notes</label>
            <Input
              className="w-full"
              value={editFields.notes}
              onChange={e => setEditFields(f => ({ ...f, notes: e.target.value }))}
              placeholder="Add notes (optional)"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" className="bg-primary text-white px-4 py-2 rounded" onClick={saveEdit}>Save</button>
            <button type="button" className="bg-muted text-foreground px-4 py-2 rounded" onClick={closeEdit}>Cancel</button>
            <button type="button" className="bg-secondary text-foreground px-4 py-2 rounded ml-auto" onClick={() => duplicateReminder(reminders.find(r => r.id === editReminderId)!)}>Duplicate</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}