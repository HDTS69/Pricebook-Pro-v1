import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Building2, Mail, DollarSign, Palette, Bell } from 'lucide-react';

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
    id: 'quotes',
    title: 'Quote Settings',
    icon: DollarSign,
    description: 'Configure quote templates, pricing tiers, and default values.',
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
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="businessAddress" className="text-sm font-medium">
                      Business Address
                    </label>
                    <Input
                      id="businessAddress"
                      placeholder="Enter your business address"
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
                    />
                  </div>
                  <div className="pt-4">
                    <Button>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'quotes' && (
              <Card>
                <CardHeader>
                  <CardTitle>Quote Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">
                        Enable Tiered Pricing
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Show Gold, Silver, and Bronze pricing options
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">
                        Show Suggested Add-ons
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Display recommended additional services
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="pt-4">
                    <Button>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add more sections as needed */}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 