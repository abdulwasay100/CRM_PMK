import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Database, Palette, Globe } from "lucide-react";

export default function Settings() {
  // State for admin name
  const [firstName, setFirstName] = useState('Admin');
  const [lastName, setLastName] = useState('User');
  const [email, setEmail] = useState('admin@polymathkids.com');
  const [phone, setPhone] = useState('+91-9876543210');

  function handleUpdateProfile(e) {
    e.preventDefault();
    // Fire a window event so TopNavbar can update
    window.dispatchEvent(new CustomEvent('adminNameUpdate', { detail: { firstName, lastName } }));
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your CRM preferences and configurations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <CardTitle>Profile Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                  Update Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}