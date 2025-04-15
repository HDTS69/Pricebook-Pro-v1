import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  Home,
  Menu,
  LogOut,
  Users,
  FileText,
  Settings,
  Book,
  Briefcase,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomers } from '@/contexts/CustomerContext';

const navigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'Jobs', path: '/jobs', icon: Briefcase },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Pricebook', path: '/pricebook', icon: Book },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { refreshCustomers, allCustomers, isLoadingCustomers } = useCustomers();
  
  // Extract user information
  const userEmail = user?.email || 'user@example.com';
  const userName = user?.user_metadata?.name || userEmail.split('@')[0] || 'User';
  const userRole = user?.user_metadata?.role || 'Administrator';
  const userAvatar = user?.user_metadata?.avatar_url || null;

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Ensure customer data is loaded for all pages
  useEffect(() => {
    // If customers are empty and not currently loading, refresh them
    if (allCustomers.length === 0 && !isLoadingCustomers) {
      console.log("DashboardLayout: Loading customer data");
      refreshCustomers();
    }
  }, [allCustomers.length, isLoadingCustomers, refreshCustomers]);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    console.log('Sign out clicked');
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-bold">Pricebook Pro</h2>
      </div>

      {/* Sidebar - Same content for both desktop and mobile */}
      <div
        className={`fixed left-0 top-0 z-40 h-full w-64 bg-card border-r p-4 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary">Pricebook Pro</h2>
            <div className="flex items-center space-x-3 px-3 py-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt={userName} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold">{userName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
                <p className="text-xs text-muted-foreground/80">{userRole}</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2 mt-8">
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => handleNavigation(item.path)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            ))}
          </nav>

          <div className="mt-auto">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive mt-2"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="md:pl-64">
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
} 