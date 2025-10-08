import { useState } from "react";
import { Plus, MessageSquare, Send, Eye, Reply, Users, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppTemplate } from "@/types";
import React from 'react';

export default function WhatsApp() {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  // Stats state
  const [sentCount, setSentCount] = useState(0);
  const [seenCount, setSeenCount] = useState(0);
  const [replyCount, setReplyCount] = useState(0);

  const filteredTemplates = []; // No mock data, so no filtering

  const getCategoryColor = (category: WhatsAppTemplate['category']) => {
    switch (category) {
      case 'Course Info': return 'bg-primary-light text-primary';
      case 'Fees': return 'bg-success-light text-success';
      case 'Schedule': return 'bg-warning-light text-warning';
      case 'Welcome': return 'bg-destructive-light text-destructive';
      case 'Follow Up': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: WhatsAppTemplate['category']) => {
    switch (category) {
      case 'Course Info': return '📚';
      case 'Fees': return '💰';
      case 'Schedule': return '📅';
      case 'Welcome': return '👋';
      case 'Follow Up': return '🔄';
      default: return '💬';
    }
  };

  // Real data
  const groups = []; // No mock data
  const leads = []; // No mock data
  const allCourses = [];
  const allLocations = [];
  const allInterests = [];

  // State for selections
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedInterest, setSelectedInterest] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  // Quick Message state
  const [quickSearch, setQuickSearch] = useState('');
  const [quickSelectedLeads, setQuickSelectedLeads] = useState<string[]>([]);
  const [quickMessage, setQuickMessage] = useState('');
  // Filter leads by search
  const quickLeadOptions = [];
  function toggleQuickLead(id: string) {
    setQuickSelectedLeads(prev => prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]);
  }
  function sendQuickWhatsApp() {
    if (quickSelectedLeads.length === 0) {
      alert('Please select at least one recipient.');
      return;
    }
    alert('WhatsApp message sent to: ' + quickSelectedLeads.map(id => {
      const l = leads.find(l => l.id === id);
      return l ? l.fullName : id;
    }).join(', ') + '\n\n' + quickMessage);
  }

  // Course data (from AddLead)
  const courseData = {
    Math: { fees: { 'One on One': 5000, Group: 3000 }, duration: '3 months', schedules: ['Mon/Wed 4-5pm', 'Tue/Thu 5-6pm'] },
    Science: { fees: { 'One on One': 6000, Group: 3500 }, duration: '4 months', schedules: ['Mon/Wed 5-6pm', 'Fri 4-6pm'] },
    English: { fees: { 'One on One': 4500, Group: 2500 }, duration: '2 months', schedules: ['Sat/Sun 10-11am', 'Mon/Wed 6-7pm'] },
    Programming: { fees: { 'One on One': 8000, Group: 5000 }, duration: '6 months', schedules: ['Sat 2-4pm', 'Sun 2-4pm'] },
    Art: { fees: { 'One on One': 4000, Group: 2000 }, duration: '2 months', schedules: ['Fri 3-5pm', 'Sat 11am-1pm'] },
    Music: { fees: { 'One on One': 7000, Group: 4000 }, duration: '3 months', schedules: ['Sun 5-7pm', 'Wed 7-9pm'] },
  };

  // Template definitions
  const templateDefs = [
    {
      key: 'Course Details',
      label: 'Course Details',
      get: () => `Course: ${selectedCourse || '[Course]'}\nDuration: ${courseData[selectedCourse]?.duration || '[Duration]'}\nSchedule: ${courseData[selectedCourse]?.schedules[0] || '[Schedule]'}\n`,
    },
    {
      key: 'Fees',
      label: 'Fees',
      get: () => `Fee for ${selectedCourse || '[Course]'}: Rs. ${courseData[selectedCourse]?.fees['Group'] || '[Fee]'}\n`,
    },
    {
      key: 'Schedule',
      label: 'Schedule',
      get: () => `Schedule: ${courseData[selectedCourse]?.schedules[0] || '[Schedule]'}\n`,
    },
    {
      key: 'Discount Offers',
      label: 'Discount Offers',
      get: () => `Special discount available! Contact us for details.\n`,
    },
  ];

  // Auto-generate message
  React.useEffect(() => {
    let msg = '';
    let addedSchedule = false;
    selectedTemplates.forEach(t => {
      const def = templateDefs.find(td => td.key === t);
      if (!def) return;
      if (t === 'Course Details' && selectedTemplates.includes('Schedule')) {
        // Remove schedule line from Course Details if Schedule is also selected
        let courseDetails = def.get().split('\n').filter(line => !line.toLowerCase().startsWith('schedule:')).join('\n');
        msg += courseDetails + (courseDetails && !courseDetails.endsWith('\n') ? '\n' : '');
      } else if (t === 'Schedule') {
        if (!addedSchedule) {
          msg += def.get();
          addedSchedule = true;
        }
      } else {
        msg += def.get();
      }
    });
    setMessage(msg);
  }, [selectedTemplates, selectedCourse]);

  // Group multi-select logic
  function toggleGroup(id: string) {
    setSelectedGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  }

  // Template checkbox logic
  function toggleTemplate(key: string) {
    setSelectedTemplates(prev => prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]);
  }

  function sendWhatsApp() {
    setSentCount(c => c + 1);
    alert('WhatsApp message sent!\n\n' + message);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">WhatsApp & Email Management</h1>
          <p className="text-muted-foreground">Semi-automated WhatsApp & Email messaging templates</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{sentCount}</div>
            <p className="text-sm text-muted-foreground">Messages Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{seenCount}</div>
            <p className="text-sm text-muted-foreground">Messages Seen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{replyCount}</div>
            <p className="text-sm text-muted-foreground">Replies Received</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{sentCount > 0 ? Math.round((replyCount / sentCount) * 100) : 0}%</div>
            <p className="text-sm text-muted-foreground">Response Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Message Generator & Quick Message side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* WhatsApp Message Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.151-.174.2-.298.3-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.007-.372-.009-.571-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.2 5.077 4.363.711.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0l-7.5-4.615A2.25 2.25 0 012.25 6.993V6.75" /></svg>
              WhatsApp & Email Message Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Group Multi-select */}
            <div>
              <label className="block text-xs font-medium mb-1">Select Groups</label>
              <div className="relative">
                <Button variant="outline" size="sm" onClick={() => setShowGroupDropdown(v => !v)}>
                  {selectedGroups.length === 0 ? 'Select groups...' : `${selectedGroups.length} group(s) selected`}
                </Button>
                {showGroupDropdown && (
                  <div className="absolute z-10 bg-popover border border-border rounded shadow-lg mt-1 max-h-48 overflow-auto w-64">
                    {groups.map(g => (
                      <div key={g.id} className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center gap-2" onClick={() => toggleGroup(g.id)}>
                        <input type="checkbox" checked={selectedGroups.includes(g.id)} readOnly className="accent-primary" />
                        <span>{g.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Template checkboxes */}
            <div>
              <label className="block text-xs font-medium mb-1">Templates</label>
              <div className="flex flex-wrap gap-3">
                {templateDefs.map(t => (
                  <label key={t.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedTemplates.includes(t.key)} onChange={() => toggleTemplate(t.key)} className="accent-primary" />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
            {/* Message area */}
            <div>
              <label className="block text-xs font-medium mb-1">Message</label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={7} className="w-full text-base" />
            </div>
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
            <Button style={{background:'#25D366', color:'#fff'}} className="hover:opacity-90 w-full mb-2 flex items-center justify-center gap-2" variant="default" onClick={sendWhatsApp}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.151-.174.2-.298.3-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.007-.372-.009-.571-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.2 5.077 4.363.711.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              Send to WhatsApp
            </Button>
            <Button style={{background:'#0072C6', color:'#fff'}} className="hover:opacity-90 w-full flex items-center justify-center gap-2" variant="default" onClick={() => alert('Email sent!\n\n' + message)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0l-7.5-4.615A2.25 2.25 0 012.25 6.993V6.75" /></svg>
              Send to Email
            </Button>
          </CardContent>
        </Card>
        {/* Quick Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Quick Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lead search/select */}
            <div>
              <label className="block text-xs font-medium mb-1">Search & select lead(s)</label>
              <Input
                className="w-full mb-2"
                placeholder="Search by name, phone, or email..."
                value={quickSearch}
                onChange={e => setQuickSearch(e.target.value)}
              />
              <div className="max-h-32 overflow-auto border border-border rounded bg-popover">
                {quickLeadOptions.length === 0 && (
                  <div className="p-2 text-muted-foreground text-sm">No leads found</div>
                )}
                {quickLeadOptions.map(l => (
                  <div key={l.id} className="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer" onClick={() => toggleQuickLead(l.id)}>
                    <input type="checkbox" checked={quickSelectedLeads.includes(l.id)} readOnly className="accent-primary" />
                    <span>{l.fullName} ({l.phone}{l.email ? `, ${l.email}` : ''})</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Message box */}
            <div>
              <label className="block text-xs font-medium mb-1">Message</label>
              <Textarea value={quickMessage} onChange={e => setQuickMessage(e.target.value)} rows={5} className="w-full text-base" placeholder="Type your message here..." />
            </div>
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
            <Button style={{background:'#25D366', color:'#fff'}} className="hover:opacity-90 w-full" variant="default" onClick={sendQuickWhatsApp}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 inline-block mr-2"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.151-.174.2-.298.3-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.007-.372-.009-.571-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.2 5.077 4.363.711.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              Send WhatsApp
            </Button>
            <Button style={{background:'#0072C6', color:'#fff'}} className="hover:opacity-90 w-full mt-2" variant="default" onClick={() => {
              if (quickSelectedLeads.length === 0) {
                alert('Please select at least one recipient.');
                return;
              }
              alert('Email sent to: ' + quickSelectedLeads.map(id => {
                const l = leads.find(l => l.id === id);
                return l ? l.fullName : id;
              }).join(', ') + '\n\n' + quickMessage);
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline-block mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0l-7.5-4.615A2.25 2.25 0 012.25 6.993V6.75" /></svg>
              Send to Email
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Template Preview below */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{getCategoryIcon(selectedTemplate.category)}</span>
              Template Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">{selectedTemplate.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">Category: {selectedTemplate.category}</p>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{selectedTemplate.content}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Variables:</p>
              <div className="flex flex-wrap gap-1">
                {selectedTemplate.variables.map((variable, index) => (
                  <span key={index} className="px-2 py-1 bg-primary-light text-primary rounded text-xs">
                    {variable}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium">{selectedTemplate.sentCount}</div>
                <div className="text-muted-foreground">Sent</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{selectedTemplate.seenCount}</div>
                <div className="text-muted-foreground">Seen</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{selectedTemplate.replyCount}</div>
                <div className="text-muted-foreground">Replies</div>
              </div>
            </div>

            <Button className="w-full bg-gradient-primary hover:opacity-90">
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}