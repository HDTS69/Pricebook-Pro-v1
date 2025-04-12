import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Building2, Mail, /* DollarSign, */ Palette, Bell, BookOpen, ListChecks, Timer, Package } from 'lucide-react';

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

export function SettingsPage() {
  const [activeSection, setActiveSection] = React.useState('business');
  
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 