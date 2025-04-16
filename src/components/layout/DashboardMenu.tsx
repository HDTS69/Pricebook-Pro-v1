import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  Home,
  LogOut,
  Users,
  Settings,
  Book,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// Match exactly the items in DashboardLayout
const navigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'Jobs', path: '/jobs', icon: Briefcase },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Pricebook', path: '/pricebook', icon: Book },
  { name: 'Settings', path: '/settings', icon: Settings },
];

interface DashboardMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardMenu({ isOpen, onClose }: DashboardMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  // Extract user information
  const userEmail = user?.email || 'user@example.com';
  const userName = user?.user_metadata?.name || userEmail.split('@')[0] || 'User';
  const userRole = user?.user_metadata?.role || 'Administrator';
  const userAvatar = user?.user_metadata?.avatar_url || null;

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };
  
  const handleSignOut = async () => {
    console.log('Sign out clicked');
    await signOut();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Menu - match exactly the sidebar in DashboardLayout */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r p-4 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
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
    </>
  );
} 