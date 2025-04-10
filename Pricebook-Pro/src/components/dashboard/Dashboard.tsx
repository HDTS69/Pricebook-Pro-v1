import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BarChart3, Users, ClipboardList } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
}

function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Quotes"
            value="12"
            description="+2 from last month"
            icon={ClipboardList}
          />
          <StatCard
            title="Active Customers"
            value="24"
            description="+4 from last month"
            icon={Users}
          />
          <StatCard
            title="Revenue"
            value="$12,345"
            description="+20.1% from last month"
            icon={BarChart3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Quote management coming soon...
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Customer Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Customer activity tracking coming soon...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 