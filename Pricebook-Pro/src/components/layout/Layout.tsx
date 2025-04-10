import React from 'react';
import { Home, Settings, Briefcase, FileText, Users, BarChart2, Calendar, Menu, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';

interface LayoutProps {
  children: React.ReactNode;
  user: {
    name: string;
    role: string;
  };
  currentView: string;
  setView: (view: string) => void;
  onLogout: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  view: string;
  role?: string[];
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Dashboard', view: 'dashboard' },
  { icon: Briefcase, label: 'Tasks', view: 'tasks' },
  { icon: FileText, label: 'Quotes', view: 'quotes' },
  { icon: Users, label: 'Jobs', view: 'jobs' },
  { icon: Calendar, label: 'Schedule', view: 'calendar' },
  { icon: BarChart2, label: 'Reports', view: 'reports' },
  { icon: Settings, label: 'Admin Settings', view: 'adminSettings', role: ['admin'] },
  { icon: Settings, label: 'Tech Settings', view: 'techSettings', role: ['technician'] },
];

export const Layout: React.FC<LayoutProps> = ({
  children,
  user,
  currentView,
  setView,
  onLogout,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const filteredNavItems = navItems.filter(
    item => !item.role || item.role.includes(user.role)
  );

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50
          w-64 bg-white border-r transform transition-transform duration-200 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0
        `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <h1 className="text-xl font-bold">Pricebook Pro</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        <nav className="mt-4">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={`
                  w-full flex items-center px-4 py-2 text-sm
                  ${currentView === item.view
                    ? 'bg-gray-100 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user.name} ({user.role})
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}; 