import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Eye, EyeOff, Save, Key } from "lucide-react";

export default function Settings() {
  // State for admin profile
  const [firstName, setFirstName] = useState('Admin');
  const [lastName, setLastName] = useState('User');
  const [email, setEmail] = useState('admin@polymathkids.com');
  const [phone, setPhone] = useState('+91-9876543210');
  const [username, setUsername] = useState('admin');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');


  // Load user data on component mount
  useEffect(() => {
    // Get user info from cookies
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    // Prefer server source of truth
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data?.authenticated && data.user?.username) {
        setUsername(data.user.username);
      } else {
        // fallback to cookie if available
        const rawUserInfoCookie = getCookie('user-info');
        const userInfoCookie = rawUserInfoCookie ? decodeURIComponent(rawUserInfoCookie) : null;
        if (userInfoCookie) {
          try {
            const userInfo = JSON.parse(userInfoCookie);
            setUsername(userInfo.username || 'admin');
          } catch (error) {
            console.error('Error parsing user info:', error);
            setUsername('admin');
          }
        } else {
          setUsername('admin');
        }
      }
    }).catch(() => {
      // ignore; keep default
    });

    // Load other profile data from localStorage (if exists)
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      setFirstName(user.firstName || 'Admin');
      setLastName(user.lastName || 'User');
      setEmail(user.email || 'admin@polymathkids.com');
      setPhone(user.phone || '+91-9876543210');
    }
  }, []);

  function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    
    // Save profile data
    const profileData = {
      username,
      firstName,
      lastName,
      email,
      phone,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(profileData));
    
    // Fire a window event so TopNavbar can update
    window.dispatchEvent(new CustomEvent('adminNameUpdate', { detail: { firstName, lastName } }));
    
    // Show success message
    setPasswordMessage('Profile updated successfully!');
    setTimeout(() => setPasswordMessage(''), 3000);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage('');

    // Debug logging
    console.log('Password change attempt:', { username, currentPassword: '***', newPassword: '***' });

    // Validation
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage('New password must be at least 6 characters');
      setPasswordLoading(false);
      return;
    }

    try {
      // Call password change API
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          currentPassword, 
          newPassword 
        }),
      });

      const data = await response.json();
      console.log('Password change response:', data);

      if (!response.ok) {
        setPasswordMessage(data.error || 'Error changing password');
        setPasswordLoading(false);
        return;
      }

      setPasswordMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordMessage('Error changing password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your CRM preferences and configurations</p>
      </div>

      <div className="max-w-4xl">
        {/* Main Settings */}
        <div className="space-y-6">
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
                    <Input 
                      id="firstName" 
                      value={firstName} 
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={lastName} 
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                {/* Username and Email fields removed as requested */}
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                  <Save className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <CardTitle>Change Password</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordMessage && (
                <Alert variant={passwordMessage.includes('successfully') ? 'default' : 'destructive'}>
                  <AlertDescription>{passwordMessage}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input 
                      id="currentPassword" 
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword} 
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input 
                      id="newPassword" 
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="bg-gradient-primary hover:opacity-90"
                  disabled={passwordLoading}
                >
                  <Key className="w-4 h-4 mr-2" />
                  {passwordLoading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}