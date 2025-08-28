import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const dateOptions = [
  { label: 'All', value: 'all' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Custom Range', value: 'custom' },
];

export default function RetargetStudents() {
  const allLeads = [];
  const [statusFilter, setStatusFilter] = useState('not_enrolled');
  const [courseFilter, setCourseFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [flyer, setFlyer] = useState<File | null>(null);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [viewLead, setViewLead] = useState(false);
  const [messageMode, setMessageMode] = useState<'flyer' | 'schedule'>('flyer');

  // Filter logic
  const filteredLeads = allLeads.filter(lead => {
    let match = true;
    if (statusFilter === 'not_enrolled') {
      match = match && (lead.leadStatus !== 'Converted');
    }
    if (statusFilter === 'interested_course' && courseFilter) {
      match = match && lead.interestedCourse === courseFilter;
    }
    // Date filter
    if (dateFilter !== 'all' && lead.createdAt) {
      const leadDate = new Date(lead.createdAt);
      const now = new Date();
      if (dateFilter === 'daily') {
        match = match && leadDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'weekly') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        match = match && leadDate >= weekAgo;
      } else if (dateFilter === 'monthly') {
        match = match && leadDate.getMonth() === now.getMonth() && leadDate.getFullYear() === now.getFullYear();
      } else if (dateFilter === 'yearly') {
        match = match && leadDate.getFullYear() === now.getFullYear();
      } else if (dateFilter === 'custom' && customFrom && customTo) {
        const from = new Date(customFrom);
        const to = new Date(customTo);
        match = match && leadDate >= from && leadDate <= to;
      }
    }
    return match;
  });

  // Get unique courses for filter
  const courses = Array.from(new Set(allLeads.map(l => l.interestedCourse).filter(Boolean)));

  // Export to CSV
  function exportCSV() {
    const headers = ['Name', 'Parent', 'Phone', 'Email', 'Age', 'City', 'Interested Course', 'Status', 'Created At'];
    const rows = filteredLeads.map(l => [
      l.fullName,
      l.parentName,
      l.phone ? "'" + l.phone : '', // Prefix phone with single quote
      l.email,
      l.age,
      l.city,
      l.interestedCourse,
      l.leadStatus,
      l.createdAt
    ]);
    // Add a space after each comma for readability
    const csvContent = [headers, ...rows].map(r => r.map(x => '"' + (x || '') + '"').join(', ')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'retarget_students.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSend(type) {
    // Simulate sending
    alert(`Sending ${type} to ${filteredLeads.length} students.\nMessage: ${messageTemplate}\nFlyer: ${flyer ? flyer.name : 'None'}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Retarget Students</h1>
        <p className="text-muted-foreground">Filter and export lists for students who didn’t enroll or showed interest in specific courses.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs mb-1">Type</label>
              <select className="border p-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="not_enrolled">Didn’t Enroll</option>
                <option value="interested_course">Interested in Course</option>
              </select>
            </div>
            {statusFilter === 'interested_course' && (
              <div>
                <label className="block text-xs mb-1">Course</label>
                <select className="border p-2" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
                  <option value="">All Courses</option>
                  {courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs mb-1">Date Range</label>
              <select className="border p-2" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                {dateOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            {dateFilter === 'custom' && (
              <>
                <div>
                  <label className="block text-xs mb-1">From</label>
                  <input type="date" className="border p-2" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs mb-1">To</label>
                  <input type="date" className="border p-2" value={customTo} onChange={e => setCustomTo(e.target.value)} />
                </div>
              </>
            )}
            <Button onClick={exportCSV} className="ml-auto">Export to CSV</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Filtered Students ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Parent</th>
                  <th className="p-2 border">Phone</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Age</th>
                  <th className="p-2 border">City</th>
                  <th className="p-2 border">Interested Course</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Created At</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(l => (
                  <tr key={l.id}>
                    <td className="p-2 border">{l.fullName}</td>
                    <td className="p-2 border">{l.parentName}</td>
                    <td className="p-2 border">{l.phone}</td>
                    <td className="p-2 border">{l.email}</td>
                    <td className="p-2 border">{l.age}</td>
                    <td className="p-2 border">{l.city}</td>
                    <td className="p-2 border">{l.interestedCourse}</td>
                    <td className="p-2 border">{l.leadStatus}</td>
                    <td className="p-2 border">{l.createdAt ? new Date(l.createdAt).toLocaleDateString() : ''}</td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr><td colSpan={9} className="text-center p-4 text-muted-foreground">No students found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Second Table: Bulk Messaging */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bulk Messaging & Flyers</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setViewLead(true)}>View</Button>
        </CardHeader>
        <CardContent>
          {/* Option select: Flyer bhejna or Schedule Message */}
          <div className="mb-4 flex gap-4 items-center">
            <label className="font-semibold">Choose Action:</label>
            <Button size="sm" variant={messageMode === 'flyer' ? 'default' : 'outline'} onClick={() => setMessageMode('flyer')}>Flyer</Button>
            <Button size="sm" variant={messageMode === 'schedule' ? 'default' : 'outline'} onClick={() => setMessageMode('schedule')}>Schedule Message</Button>
          </div>
          {/* Flyer upload and message field */}
          {messageMode === 'flyer' && (
            <div className="mb-4">
              <label className="block text-xs mb-1">Upload Flyer (optional)</label>
              <input type="file" accept=".pdf,image/*" onChange={e => setFlyer(e.target.files?.[0] || null)} />
              {flyer && <div className="text-xs mt-1">Selected: {flyer.name}</div>}
              <div className="mb-4 mt-4">
                <label className="block text-xs mb-1">Message</label>
                <textarea className="border p-2 w-full" rows={3} value={messageTemplate} onChange={e => setMessageTemplate(e.target.value)} placeholder="Type your message here..." />
              </div>
              <div className="flex gap-2 mt-2">
                <Button onClick={() => handleSend('WhatsApp')}>Send via WhatsApp</Button>
                <Button onClick={() => handleSend('Email')}>Send via Email</Button>
                <Button onClick={() => handleSend('SMS')}>Send via SMS</Button>
              </div>
            </div>
          )}
          {/* Message template and schedule */}
          {messageMode === 'schedule' && (
            <>
              <div className="mb-4 flex-1">
                <label className="block text-xs mb-1">Message Template</label>
                <textarea className="border p-2 w-full" rows={3} value={messageTemplate} onChange={e => setMessageTemplate(e.target.value)} placeholder="Type your message here..." />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSend('WhatsApp')}>WhatsApp</Button>
                <Button onClick={() => handleSend('Email')}>Email</Button>
                <Button onClick={() => handleSend('SMS')}>SMS</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Lead Details Popup: show all filtered students (name, phone, email only) */}
      {viewLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-xl" onClick={() => setViewLead(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Filtered Students</h2>
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="min-w-full text-xs border">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Phone</th>
                    <th className="p-2 border">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map(l => (
                    <tr key={l.id}>
                      <td className="p-2 border">{l.fullName}</td>
                      <td className="p-2 border">{l.phone}</td>
                      <td className="p-2 border">{l.email}</td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr><td colSpan={3} className="text-center p-4 text-muted-foreground">No students found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 