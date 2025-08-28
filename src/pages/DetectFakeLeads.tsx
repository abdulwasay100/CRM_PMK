import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Simulate IP and device detection
function getDetectedLocation(lead) {
  // Fake logic: if email contains 'jp' or phone starts with '81', pretend it's Japan
  if ((lead.email && lead.email.includes('jp')) || (lead.phone && lead.phone.startsWith('81'))) {
    return { country: 'Japan', city: 'Tokyo' };
  }
  // Otherwise, default to Pakistan
  return { country: 'Pakistan', city: lead.city || 'Karachi' };
}
function getDeviceInfo(lead) {
  // Fake device info
  return 'Chrome on Windows';
}
function isSuspicious(lead, detected, blockList) {
  if (blockList.some(b => b.phone === lead.phone || b.email === lead.email)) return 'Blocked';
  if (!lead.phone || !lead.email) return 'Fake';
  if (lead.country && detected.country && lead.country.toLowerCase() !== detected.country.toLowerCase()) return 'Suspicious';
  if (/^(000|123|999)/.test(lead.phone)) return 'Fake';
  return 'Real';
}

export default function DetectFakeLeads() {
  const allLeads = [];
  const [blockList, setBlockList] = useState([]);
  const [alert, setAlert] = useState('');

  // Simulate new lead alert (if any lead matches block list)
  React.useEffect(() => {
    const blocked = allLeads.find(l => blockList.some(b => b.phone === l.phone || b.email === l.email));
    if (blocked) setAlert(`Alert: Lead with phone/email already in block list! (${blocked.phone || blocked.email})`);
    else setAlert('');
  }, [blockList, allLeads]);

  function handleBlock(lead) {
    if (!blockList.some(b => b.phone === lead.phone || b.email === lead.email)) {
      setBlockList([...blockList, { phone: lead.phone, email: lead.email, name: lead.fullName, blockedAt: new Date().toISOString() }]);
    }
  }


  // Count summary (only fake and suspicious)
  const fraudStats = allLeads.reduce((acc, lead) => {
    const detected = getDetectedLocation(lead);
    const status = isSuspicious(lead, detected, blockList);
    if (status === 'Fake') acc.fake++;
    if (status === 'Suspicious') acc.suspicious++;
    return acc;
  }, { fake: 0, suspicious: 0 });

  // Only show fake/suspicious leads
  const fraudLeads = allLeads.filter(lead => {
    const detected = getDetectedLocation(lead);
    const status = isSuspicious(lead, detected, blockList);
    return status === 'Fake' || status === 'Suspicious';
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Detect Fake Leads</h1>
        <p className="text-muted-foreground">Track location using IP/device, highlight mismatches, and block suspicious/fake leads.</p>
      </div>
      {/* Fraud summary */}
      <div className="flex gap-4 mb-4">
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded font-bold">Fake: {fraudStats.fake}</div>
        <div className="bg-warning/10 text-warning px-4 py-2 rounded font-bold">Suspicious: {fraudStats.suspicious}</div>
      </div>
      {alert && <div className="bg-destructive/10 text-destructive p-3 rounded">{alert}</div>}
      <Card>
        <CardHeader>
          <CardTitle>Fraud/Suspicious Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Phone</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Provided City</th>
                  <th className="p-2 border">Provided Country</th>
                  <th className="p-2 border">IP Location</th>
                  <th className="p-2 border">Device Info</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {fraudLeads.map(lead => {
                  const detected = getDetectedLocation(lead);
                  const device = getDeviceInfo(lead);
                  const status = isSuspicious(lead, detected, blockList);
                  let statusClass = '';
                  if (status === 'Fake') statusClass = 'bg-destructive/10 text-destructive font-bold';
                  if (status === 'Suspicious') statusClass = 'bg-warning/10 text-warning font-bold';
                  return (
                    <tr key={lead.id} className={statusClass}>
                      <td className="p-2 border">{lead.fullName}</td>
                      <td className="p-2 border">{lead.phone}</td>
                      <td className="p-2 border">{lead.email}</td>
                      <td className="p-2 border">{lead.city}</td>
                      <td className="p-2 border">{lead.country}</td>
                      <td className="p-2 border">{detected.city}, {detected.country}</td>
                      <td className="p-2 border">{device}</td>
                      <td className="p-2 border font-bold">{status}</td>
                      <td className="p-2 border">
                        <Button size="sm" variant="destructive" onClick={() => handleBlock(lead)}>Block</Button>
                      </td>
                    </tr>
                  );
                })}
                {fraudLeads.length === 0 && (
                  <tr><td colSpan={9} className="text-center p-4 text-muted-foreground">No fake or suspicious leads found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
} 