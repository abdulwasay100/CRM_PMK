import React, { useState } from "react";
import { Plus, Percent, Gift, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { mockDiscounts } from "@/data/mockData";
import { Discount, Lead } from "@/types";
import { useRef } from 'react';

export default function Discounts() {
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Lead search and discount selection state
  const [leadSearch, setLeadSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [discountType, setDiscountType] = useState('');
  // Load leads from localStorage so search works
  function getLeadsFromStorage(): Lead[] {
    const data = localStorage.getItem('leads');
    if (data) {
      try { return JSON.parse(data); } catch { return []; }
    }
    return [];
  }
  const [leads, setLeads] = useState<Lead[]>(getLeadsFromStorage());
  React.useEffect(() => {
    setLeads(getLeadsFromStorage());
    function handleStorage() {
      setLeads(getLeadsFromStorage());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  const filteredLeads = leads.filter(l =>
    l.fullName.toLowerCase().includes(leadSearch.toLowerCase()) ||
    l.phone?.toLowerCase().includes(leadSearch.toLowerCase()) ||
    l.email?.toLowerCase().includes(leadSearch.toLowerCase())
  );
  // Hardcoded discount values
  function getDiscountPercent(lead, type) {
    if (!lead || !type) return null;
    if (lead.fullName === 'Arjun Sharma') return 25;
    if (lead.fullName === 'Priya Patel') return 15;
    if (lead.fullName === 'Rohan Kumar') return 20;
    return 10;
  }
  const discountPercent = getDiscountPercent(selectedLead, discountType);

  // Local discounts state with persistence
  function getDiscountsFromStorage(): Discount[] {
    const data = localStorage.getItem('discounts');
    if (data) {
      try { return JSON.parse(data); } catch { return []; }
    }
    return [];
  }
  function saveDiscountsToStorage(discounts: Discount[]) {
    localStorage.setItem('discounts', JSON.stringify(discounts));
  }
  const [discounts, setDiscounts] = useState<Discount[]>(getDiscountsFromStorage());
  React.useEffect(() => {
    // Keep in sync if discounts updated elsewhere
    function handleStorage() {
      setDiscounts(getDiscountsFromStorage());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  React.useEffect(() => {
    saveDiscountsToStorage(discounts);
  }, [discounts]);
  // For resetting the form
  const leadInputRef = useRef();

  const getTypeIcon = (type: Discount['discountType']) => {
    switch (type) {
      case 'Early Bird': return '🐦';
      case 'Sibling': return '👥';
      case 'Referral': return '🤝';
      case 'Special Offer': return '🎁';
      default: return '💰';
    }
  };

  const getTypeColor = (type: Discount['discountType']) => {
    switch (type) {
      case 'Early Bird': return 'bg-warning-light text-warning';
      case 'Sibling': return 'bg-success-light text-success';
      case 'Referral': return 'bg-primary-light text-primary';
      case 'Special Offer': return 'bg-destructive-light text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredDiscounts = discounts.filter(discount => {
    const matchesType = typeFilter === "All" || discount.discountType === typeFilter;
    const matchesStatus = statusFilter === "All" || 
      (statusFilter === "Active" && discount.isActive) ||
      (statusFilter === "Expired" && !discount.isActive);
    return matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Discount Management</h1>
          <p className="text-muted-foreground">Track and manage discount offers for leads</p>
        </div>
      </div>

      {/* Quick Actions with live counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🐦</div>
            <h3 className="font-medium">Early Bird</h3>
            <div className="text-lg font-bold">{discounts.filter(d => d.discountType === 'Early Bird').length}</div>
            <p className="text-xs text-muted-foreground">Quick enrollment discount</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">👥</div>
            <h3 className="font-medium">Sibling Discount</h3>
            <div className="text-lg font-bold">{discounts.filter(d => d.discountType === 'Sibling').length}</div>
            <p className="text-xs text-muted-foreground">Multi-child enrollment</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🤝</div>
            <h3 className="font-medium">Referral Bonus</h3>
            <div className="text-lg font-bold">{discounts.filter(d => d.discountType === 'Referral').length}</div>
            <p className="text-xs text-muted-foreground">Friend referral rewards</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🎁</div>
            <h3 className="font-medium">Special Offer</h3>
            <div className="text-lg font-bold">{discounts.filter(d => d.discountType === 'Special Offer').length}</div>
            <p className="text-xs text-muted-foreground">Custom promotions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Early Bird">Early Bird</SelectItem>
                <SelectItem value="Sibling">Sibling</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Special Offer">Special Offer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{discounts.filter(d => d.isActive).length}</div>
            <p className="text-sm text-muted-foreground">Active Discounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{discounts.filter(d => !d.isActive).length}</div>
            <p className="text-sm text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Lead & Discount Type */}
      <Card>
        <CardHeader>
          <CardTitle>Search Lead & Assign Discount</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lead Search */}
          <div>
            <label className="block text-xs font-medium mb-1">Search Lead</label>
            <input
              className="border p-2 rounded w-full mb-2"
              placeholder="Search by name, phone, or email..."
              value={leadSearch}
              onChange={e => {
                setLeadSearch(e.target.value);
                setSelectedLead(null);
              }}
            />
            {leadSearch && (
              <div className="max-h-32 overflow-auto border rounded">
                {filteredLeads.length === 0 && (
                  <div className="p-2 text-muted-foreground text-sm">No leads found</div>
                )}
                {filteredLeads.map(l => (
                  <div key={l.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer" onClick={() => { setSelectedLead(l); setLeadSearch(l.fullName); }}>
                    <span>{l.fullName} ({l.phone})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Discount Type Dropdown */}
          {selectedLead && (
            <div>
              <label className="block text-xs font-medium mb-1">Select Discount Type</label>
              <select className="border p-2 rounded w-full" value={discountType} onChange={e => setDiscountType(e.target.value)}>
                <option value="">Select type...</option>
                <option value="Early Bird">Early Bird</option>
                <option value="Sibling">Sibling</option>
                <option value="Referral">Referral</option>
                <option value="Special Offer">Special Offer</option>
              </select>
            </div>
          )}
          {/* Show Discount Details and OK button */}
          {selectedLead && discountType && discountPercent && (
            <div className="p-4 border rounded bg-muted/30 space-y-2">
              <div className="font-medium mb-1">Selected Lead: {selectedLead.fullName}</div>
              <div>Discount Type: {discountType}</div>
              <div>Discount: <span className="font-bold">{discountPercent}%</span></div>
              {discounts.some(d => d.leadId === selectedLead.id) ? (
                <div className="text-red-600 text-sm mt-2">This lead already has a discount assigned.</div>
              ) : (
                <Button
                  className="mt-2"
                  onClick={() => {
                    setDiscounts(prev => [
                      ...prev,
                      {
                        id: Date.now().toString(),
                        leadId: selectedLead.id,
                        leadName: selectedLead.fullName,
                        discountType,
                        percentage: discountPercent,
                        amount: 0,
                        reason: '',
                        isActive: true,
                        expiresAt: '',
                        createdAt: new Date().toISOString(),
                      }
                    ]);
                    setLeadSearch('');
                    setSelectedLead(null);
                    setDiscountType('');
                  }}
                >OK</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Discounts List */}
      <Card>
        <CardHeader>
          <CardTitle>All Discounts ({filteredDiscounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDiscounts.length === 0 && (
              <div className="text-center text-muted-foreground py-8">No discounts found.</div>
            )}
            {filteredDiscounts.map((discount) => (
              <div key={discount.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getTypeIcon(discount.discountType)}</span>
                      <div>
                        <h3 className="font-semibold text-foreground">{discount.leadName}</h3>
                        <p className="text-sm text-muted-foreground">{discount.reason || '—'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Lead: {discount.leadName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Percent className="w-4 h-4" />
                        {discount.percentage}% off
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(discount.discountType)}`}>
                        {discount.discountType}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${discount.isActive ? 'bg-success-light text-success' : 'bg-destructive-light text-destructive'}`}>
                        {discount.isActive ? 'Active' : 'Expired'}
                      </span>
                      <Button
                        size="sm"
                        variant={discount.isActive ? 'outline' : 'default'}
                        className="ml-2"
                        onClick={() => {
                          setDiscounts(prev => prev.map(d => d.id === discount.id ? { ...d, isActive: !d.isActive } : d));
                        }}
                      >
                        {discount.isActive ? 'Mark Not Active' : 'Mark Active'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="ml-2"
                        onClick={() => {
                          setDiscounts(prev => prev.filter(d => d.id !== discount.id));
                        }}
                      >Remove</Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{discount.percentage}%</div>
                      <div className="text-sm text-muted-foreground">discount</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}