import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Separator } from '@/components/ui/separator';
import { Building2, Mail, /* DollarSign, */ Palette, Bell, BookOpen, ListChecks, Timer, Package, ExternalLink, UserCog, ShieldCheck } from 'lucide-react';
import { getActiveServiceM8Token, disconnectServiceM8 } from '@/lib/servicem8';
import { useToast } from "@/hooks/use-toast";
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'business',
    title: 'Business Information',
    icon: Building2,
    description: 'Manage your business details, logo, and contact information.',
  },
  {
    id: 'pricebook',
    title: 'Price Book Settings',
    icon: BookOpen,
    description: 'Configure quote tiers, default values, and manage standard tasks.',
  },
  {
    id: 'users',
    title: 'User Management',
    icon: UserCog,
    description: 'Manage admin and technician accounts.',
  },
  {
    id: 'email',
    title: 'Email Settings',
    icon: Mail,
    description: 'Customize email templates and notification preferences.',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette,
    description: 'Customize the look and feel of your dashboard.',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Manage your notification preferences.',
  },
];

const SERVICE_M8_APP_ID = import.meta.env.VITE_SERVICEM8_APP_ID;
// Use the Supabase function URL as the redirect URI for the initial OAuth request
const REDIRECT_URI = 'https://ybkgvombhjchlcmbrizk.supabase.co/functions/v1/servicem8-oauth-callback';

const SCOPES = [
  'read_customers', 
  'manage_customers',
  'read_customer_contacts',
  'manage_customer_contacts'
].join('%20'); // URL encoded space

const AUTH_URL = `https://go.servicem8.com/oauth/authorize?response_type=code&client_id=${SERVICE_M8_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPES}`;

type ConnectionStatus = 'loading' | 'connected' | 'not-connected' | 'error';

export function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = React.useState('business');
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);
  
  // --- State for Settings ---
  // Business Info
  const [businessName, setBusinessName] = React.useState('');
  const [businessAddress, setBusinessAddress] = React.useState('');
  const [businessPhone, setBusinessPhone] = React.useState('');
  const [businessEmail, setBusinessEmail] = React.useState('');
  // Price Book - Quote Options
  const [enableTiers, setEnableTiers] = React.useState(true); // Example default
  const [showAddons, setShowAddons] = React.useState(true); // Example default
  // Price Book - Task Display
  const [showTaskTime, setShowTaskTime] = React.useState(true);
  const [showTaskMaterials, setShowTaskMaterials] = React.useState(true);
  // TODO: Load initial values for these states from storage/API

  const checkStatus = useCallback(async () => {
    console.log("Checking ServiceM8 connection status...");
    setStatus('loading');
    setError(null);
    try {
      const token = await getActiveServiceM8Token();
      if (token) {
        console.log("ServiceM8 is connected.");
        setStatus('connected');
      } else {
        console.log("ServiceM8 is not connected.");
        setStatus('not-connected');
      }
    } catch (err: any) {
      console.error("Error checking ServiceM8 status:", err);
      setError(err.message || "An unknown error occurred.");
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // --- Save Handlers ---
  const handleSaveBusinessInfo = () => {
    const businessSettings = {
      name: businessName,
      address: businessAddress,
      phone: businessPhone,
      email: businessEmail,
    };
    console.log("Saving Business Information:", businessSettings);
    // TODO: Implement actual saving logic (e.g., API call, localStorage)
    alert("Business Information saved (check console)"); // Simple feedback
  };

  const handleSavePriceBookSettings = () => {
    const pricebookSettings = {
      enableTiers: enableTiers,
      showAddons: showAddons,
      showTaskTime: showTaskTime,
      showTaskMaterials: showTaskMaterials,
    };
    console.log("Saving Price Book Settings:", pricebookSettings);
    // TODO: Implement actual saving logic
    alert("Price Book Settings saved (check console)"); // Simple feedback
  };

  const handleConnect = () => {
    console.log("Redirecting to ServiceM8 auth URL:", AUTH_URL);
    // Redirect the user to initiate the OAuth flow
    window.location.href = AUTH_URL; 
  };

  const handleDisconnect = async () => {
    console.log("Attempting to disconnect ServiceM8...");
    setIsDisconnecting(true);
    setError(null);
    try {
      const success = await disconnectServiceM8();
      if (success) {
        console.log("Successfully disconnected.");
        setStatus('not-connected');
        toast({
          title: "Success",
          description: "Successfully disconnected from ServiceM8.",
        });
      } else {
        console.error("Disconnect function returned false.");
        setError("Failed to disconnect. Please try again.");
        toast({
          variant: "destructive",
          title: "Disconnection Failed",
          description: "Could not disconnect from ServiceM8. Please try again or contact support.",
        });
      }
    } catch (err: any) {
      console.error("Error disconnecting ServiceM8:", err);
      const errorMessage = err.message || "An error occurred during disconnection.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Disconnection Error",
        description: errorMessage,
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleFixAdminRole = async () => {
    console.log("Attempting to fix admin role...");
    setError(null);
    try {
      // Correctly update metadata using the updateUser method
      const { data, error } = await supabase.auth.updateUser({
        data: {
          role: 'Administrator',
        },
      });
      
      if (error) throw error;
      
      if (data?.user) {
        console.log("Admin role fixed successfully.");
        toast({
          title: "Success",
          description: "Admin role fixed successfully. Please refresh the page.",
        });
      } else {
        console.error("Failed to fix admin role.");
        setError("Failed to fix admin role. Please try again or contact support.");
        toast({
          variant: "destructive",
          title: "Admin Role Fix Failed",
          description: "Failed to fix admin role. Please try again or contact support.",
        });
      }
    } catch (err: any) {
      console.error("Error fixing admin role:", err);
      const errorMessage = err.message || "An error occurred during admin role fix.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Admin Role Fix Error",
        description: errorMessage,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

        <div className="grid gap-6 md:grid-cols-[250px_1fr]">
          <Card className="p-4">
            <nav className="space-y-2">
              {settingsSections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveSection(section.id)}
                >
                  <section.icon className="mr-2 h-4 w-4" />
                  {section.title}
                </Button>
              ))}
            </nav>
          </Card>

          <div className="space-y-6">
            {activeSection === 'business' && (
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="businessName" className="text-sm font-medium">
                      Business Name
                    </label>
                    <Input
                      id="businessName"
                      placeholder="Enter your business name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="businessAddress" className="text-sm font-medium">
                      Business Address
                    </label>
                    <Input
                      id="businessAddress"
                      placeholder="Enter your business address"
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="businessPhone" className="text-sm font-medium">
                      Business Phone
                    </label>
                    <Input
                      id="businessPhone"
                      type="tel"
                      placeholder="Enter your business phone"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="businessEmail" className="text-sm font-medium">
                      Business Email
                    </label>
                    <Input
                      id="businessEmail"
                      type="email"
                      placeholder="Enter your business email"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                    />
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button onClick={handleSaveBusinessInfo}>Save Business Info</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'pricebook' && (
              <Card>
                <CardHeader>
                  <CardTitle>Price Book Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Quote Options</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <label className="text-sm font-medium">Enable Tiered Pricing</label>
                          <p className="text-sm text-muted-foreground">Show Gold, Silver, and Bronze pricing options</p>
                        </div>
                        <Switch 
                          checked={enableTiers}
                          onCheckedChange={setEnableTiers}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <label className="text-sm font-medium">Show Suggested Add-ons</label>
                          <p className="text-sm text-muted-foreground">Display recommended additional services</p>
                        </div>
                        <Switch 
                          checked={showAddons}
                          onCheckedChange={setShowAddons}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Manage Standard Tasks</h3>
                    <div className="p-4 border rounded-lg space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <label htmlFor="show-time-toggle" className="text-sm font-medium flex items-center">
                              <Timer className="mr-2 h-4 w-4 text-muted-foreground"/> Show Estimated Time
                            </label>
                            <p className="text-sm text-muted-foreground pl-6">Display the estimated duration on task cards.</p>
                          </div>
                          <Switch 
                            id="show-time-toggle"
                            checked={showTaskTime}
                            onCheckedChange={setShowTaskTime}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <label htmlFor="show-materials-toggle" className="text-sm font-medium flex items-center">
                              <Package className="mr-2 h-4 w-4 text-muted-foreground"/> Show Materials List
                            </label>
                            <p className="text-sm text-muted-foreground pl-6">Display the materials list on task cards.</p>
                          </div>
                          <Switch 
                            id="show-materials-toggle"
                            checked={showTaskMaterials}
                            onCheckedChange={setShowTaskMaterials}
                          />
                        </div>
                      </div>
                      
                      <Separator className="my-4"/>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Add, edit, or remove predefined tasks used in your price book.</p>
                        <Button variant="secondary" size="sm">
                          <ListChecks className="mr-2 h-4 w-4" /> Manage Tasks
                        </Button>
                      </div>
                      <div className="p-6 bg-muted rounded-md text-center text-muted-foreground">
                        Task Management Component Placeholder
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button onClick={handleSavePriceBookSettings}>Save Price Book Settings</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'users' && (
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage administrator and technician accounts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Admin and Technician Accounts</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Create and manage user accounts. Administrators have full access, while technicians have limited access.
                        </p>
                      </div>
                      <Link to="/settings/user-management">
                        <Button>
                          <UserCog className="mr-2 h-4 w-4" />
                          Manage Users
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg space-y-2">
                    <h3 className="font-medium">Account Permissions</h3>
                    <p className="text-sm text-muted-foreground">
                      Administrators can:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                      <li>Create and manage all users</li>
                      <li>Access all system settings</li>
                      <li>Manage quotes, jobs, and customers</li>
                      <li>Configure system-wide settings</li>
                    </ul>
                    
                    <p className="text-sm text-muted-foreground mt-2">
                      Technicians can:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                      <li>View and update their assigned jobs</li>
                      <li>Create quotes for customers</li>
                      <li>View customer information</li>
                      <li>Update their own profile</li>
                    </ul>
                    
                    {/* Debug info */}
                    <div className="mt-4 p-2 border border-dashed border-yellow-500 rounded-md bg-yellow-50 dark:bg-yellow-950">
                      <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Debug Info</h4>
                      <p className="text-xs mt-1">Your current role: <span className="font-mono">{user?.user_metadata?.role || 'Not set'}</span></p>
                      <p className="text-xs mt-1">If this doesn't show "Administrator", you'll be redirected to the dashboard when trying to access the User Management page.</p>
                      
                      {(!user?.user_metadata?.role || user.user_metadata.role !== 'Administrator') && (
                        <div className="mt-2">
                          <Button 
                            size="sm" 
                            onClick={handleFixAdminRole} 
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Fix Admin Role
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'email' && (
              <Card>
                <CardHeader>
                  <CardTitle>Email Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="emailTemplate" className="text-sm font-medium">
                      Email Template
                    </label>
                    <Input
                      id="emailTemplate"
                      placeholder="Enter your email template"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="notificationPreferences" className="text-sm font-medium">
                      Notification Preferences
                    </label>
                    <Input
                      id="notificationPreferences"
                      placeholder="Enter your notification preferences"
                    />
                  </div>
                  <div className="pt-4">
                    <Button>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'appearance' && (
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="theme" className="text-sm font-medium">
                      Theme
                    </label>
                    <Input
                      id="theme"
                      placeholder="Enter your theme"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="customization" className="text-sm font-medium">
                      Customization
                    </label>
                    <Input
                      id="customization"
                      placeholder="Enter your customization"
                    />
                  </div>
                  <div className="pt-4">
                    <Button>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="notificationFrequency" className="text-sm font-medium">
                      Notification Frequency
                    </label>
                    <Input
                      id="notificationFrequency"
                      placeholder="Enter your notification frequency"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="notificationPreferences" className="text-sm font-medium">
                      Notification Preferences
                    </label>
                    <Input
                      id="notificationPreferences"
                      placeholder="Enter your notification preferences"
                    />
                  </div>
                  <div className="pt-4">
                    <Button>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>ServiceM8 Integration</CardTitle>
                <CardDescription>
                  Connect your ServiceM8 account to sync customers and jobs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {status === 'loading' && (
                  <p className="text-muted-foreground">Checking ServiceM8 status...</p>
                )}
                {status === 'connected' && (
                  <p className="text-green-600 font-medium">Connected to ServiceM8</p>
                )}
                {status === 'not-connected' && (
                  <p className="text-orange-600 font-medium">Not Connected to ServiceM8</p>
                )}
                {status === 'error' && (
                  <div>
                    <p className="text-destructive font-medium">Error checking ServiceM8 status.</p>
                    {error && <p className="text-sm text-muted-foreground mt-1">{error}</p>}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                {status === 'connected' && (
                  <Button 
                    variant="destructive" 
                    onClick={handleDisconnect} 
                    disabled={isDisconnecting}
                  >
                    {isDisconnecting ? "Disconnecting..." : "Disconnect ServiceM8"}
                  </Button>
                )}
                {status === 'not-connected' && (
                  <Button onClick={handleConnect}>
                    Connect ServiceM8
                  </Button>
                )}
                {status === 'error' && (
                  <Button onClick={checkStatus} variant="outline">
                    Retry Connection Check
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 