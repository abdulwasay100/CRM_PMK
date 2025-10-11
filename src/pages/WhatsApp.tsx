import { useState, useEffect, useCallback } from "react";
import { Plus, MessageSquare, Send, Eye, Reply, Users, Edit, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { showNotification, playNotificationSound } from "@/components/ui/notification-sound";
import React from 'react';

export default function WhatsApp() {
  const [categoryFilter, setCategoryFilter] = useState("All");
  // Stats state
  const [sentCount, setSentCount] = useState(0);
  const [seenCount, setSeenCount] = useState(0);
  const [replyCount, setReplyCount] = useState(0);

  const filteredTemplates = []; // No mock data, so no filtering


  // Real data
  const [groups, setGroups] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const allCourses = [];
  const allLocations = [];
  const allInterests = [];

  // State for selections
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedInterest, setSelectedInterest] = useState('');
  const [message, setMessage] = useState('');

  // Quick Message state
  const [quickSearch, setQuickSearch] = useState('');
  const [quickSelectedLeads, setQuickSelectedLeads] = useState<string[]>([]);
  const [quickMessage, setQuickMessage] = useState('');
  const [quickAttachments, setQuickAttachments] = useState<File[]>([]);
  // Filter leads by search
  const quickLeadOptions = leads.filter(lead => {
    if (!quickSearch.trim()) return false;
    const searchTerm = quickSearch.toLowerCase();
    return (
      lead.full_name?.toLowerCase().includes(searchTerm) ||
      lead.phone?.toLowerCase().includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm)
    );
  });
  function toggleQuickLead(id: number) {
    const idStr = id.toString();
    setQuickSelectedLeads(prev => prev.includes(idStr) ? prev.filter(lid => lid !== idStr) : [...prev, idStr]);
  }
  function sendQuickWhatsApp() {
    if (quickSelectedLeads.length === 0) {
      alert('Please select at least one recipient.');
      return;
    }
    alert('WhatsApp message sent to: ' + quickSelectedLeads.map(id => {
      const l = leads.find(l => l.id === id);
      return l ? l.full_name : id;
    }).join(', ') + '\n\n' + quickMessage);
  }

  // Course data (from AddLead)
  const courseData: Record<string, any> = {
    Math: { fees: { 'One on One': 5000, Group: 3000 }, duration: '3 months', schedules: ['Mon/Wed 4-5pm', 'Tue/Thu 5-6pm'] },
    Science: { fees: { 'One on One': 6000, Group: 3500 }, duration: '4 months', schedules: ['Mon/Wed 5-6pm', 'Fri 4-6pm'] },
    English: { fees: { 'One on One': 4500, Group: 2500 }, duration: '2 months', schedules: ['Sat/Sun 10-11am', 'Mon/Wed 6-7pm'] },
    Programming: { fees: { 'One on One': 8000, Group: 5000 }, duration: '6 months', schedules: ['Sat 2-4pm', 'Sun 2-4pm'] },
    Art: { fees: { 'One on One': 4000, Group: 2000 }, duration: '2 months', schedules: ['Fri 3-5pm', 'Sat 11am-1pm'] },
    Music: { fees: { 'One on One': 7000, Group: 4000 }, duration: '3 months', schedules: ['Sun 5-7pm', 'Wed 7-9pm'] },
  };


  // Group multi-select logic
  function toggleGroup(id: string) {
    setSelectedGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  }


  // Fetch groups and leads
  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups', { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads', { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchLeads();
  }, [fetchGroups, fetchLeads]);

  // Handler for file input
  function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  function handleRemoveAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }

  // Quick Message attachment handlers
  function handleQuickAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setQuickAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  function handleRemoveQuickAttachment(index: number) {
    setQuickAttachments(prev => prev.filter((_, i) => i !== index));
  }

  // Send email to selected groups
  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !message.trim()) {
      toast.error('Please fill in subject and message');
      return;
    }

    if (selectedGroups.length === 0) {
      toast.error('Please select at least one group');
      return;
    }

    setEmailLoading(true);
    try {
      // Convert attachments to base64 for API
      const attachmentData = await Promise.all(
        attachments.map(async (file) => ({
          filename: file.name,
          content: Buffer.from(await file.arrayBuffer()).toString('base64'),
          contentType: file.type
        }))
      );

      // Send to all selected groups
      const emailPromises = selectedGroups.map(async (groupId) => {
        const emailData = {
          type: 'bulk',
          groupId: parseInt(groupId),
          subject: emailSubject,
          message: message,
          attachments: attachmentData
        };

        const res = await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData)
        });

        return res.json();
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      if (successCount > 0) {
        toast.success(`Email sent successfully to ${successCount}/${totalCount} groups`);
        playNotificationSound('success');
        setSentCount(c => c + successCount);
        setEmailSubject('');
        setMessage('');
        setAttachments([]);
        setSelectedGroups([]);
      } else {
        toast.error('Failed to send emails to any groups');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setEmailLoading(false);
    }
  };

  // Send email to quick selected leads
  const handleSendQuickEmail = async () => {
    if (quickSelectedLeads.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    if (!quickMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setEmailLoading(true);
    try {
      // Convert attachments to base64 for API
      const attachmentData = await Promise.all(
        quickAttachments.map(async (file) => ({
          filename: file.name,
          content: Buffer.from(await file.arrayBuffer()).toString('base64'),
          contentType: file.type
        }))
      );

      const recipients = quickSelectedLeads.map(leadId => {
        const lead = leads.find(l => l.id.toString() === leadId);
        return {
          email: lead?.email || '',
          name: lead?.full_name || lead?.phone || ''
        };
      }).filter(r => r.email && r.email.trim() !== '');

      if (recipients.length === 0) {
        toast.error('No valid email addresses found for selected leads');
        setEmailLoading(false);
        return;
      }

      const emailData = {
        type: 'bulk',
        recipients,
        subject: emailSubject || 'Message from Polymath Kids',
        html: quickMessage,
        attachments: attachmentData
      };

      console.log('Sending email data:', emailData);
      
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      const result = await res.json();
      console.log('Email API response:', result);
      
      if (result.success) {
        toast.success(result.message);
        playNotificationSound('success');
        setSentCount(c => c + result.details?.success || 0);
        setQuickMessage('');
        setQuickSelectedLeads([]);
        setEmailSubject('');
        setQuickAttachments([]);
      } else {
        toast.error(result.message);
        console.error('Email API error:', result);
      }
    } catch (error) {
      console.error('Error sending quick email:', error);
      toast.error('Failed to send email');
    } finally {
      setEmailLoading(false);
    }
  };

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
            {/* Email Subject */}
            <div>
              <label className="block text-xs font-medium mb-1">Email Subject</label>
              <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Enter email subject..." className="w-full" />
            </div>
            {/* Message area */}
            <div>
              <label className="block text-xs font-medium mb-1">Message</label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={7} className="w-full text-base" />
            </div>
            {/* Attachments */}
            <div>
              <label className="block text-xs font-medium mb-1">Attachments (Optional)</label>
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
            <Button style={{background:'#0072C6', color:'#fff'}} className="hover:opacity-90 w-full flex items-center justify-center gap-2" variant="default" onClick={handleSendEmail} disabled={emailLoading}>
              <Mail className="w-5 h-5" />
              {emailLoading ? 'Sending...' : 'Send to Email'}
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
                    <input type="checkbox" checked={quickSelectedLeads.includes(l.id.toString())} readOnly className="accent-primary" />
                    <span>{l.full_name} ({l.phone}{l.email ? `, ${l.email}` : ''})</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Message box */}
            <div>
              <label className="block text-xs font-medium mb-1">Message</label>
              <Textarea value={quickMessage} onChange={e => setQuickMessage(e.target.value)} rows={5} className="w-full text-base" placeholder="Type your message here..." />
            </div>
            {/* Attachments */}
            <div>
              <label className="block text-xs font-medium mb-1">Attachments (Optional)</label>
              <input type="file" multiple onChange={handleQuickAttachmentChange} className="file:bg-background file:text-foreground file:border file:border-border file:rounded file:px-3 file:py-1 file:mr-3 file:text-sm border border-border rounded w-full p-2 bg-background text-foreground" />
              {quickAttachments.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm">
                  {quickAttachments.map((file, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span>{file.name}</span>
                      <Button size="sm" variant="outline" type="button" onClick={() => handleRemoveQuickAttachment(idx)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
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
            <Button style={{background:'#0072C6', color:'#fff'}} className="hover:opacity-90 w-full mt-2" variant="default" onClick={handleSendQuickEmail} disabled={emailLoading}>
              <Mail className="w-5 h-5 inline-block mr-2" />
              {emailLoading ? 'Sending...' : 'Send to Email'}
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}