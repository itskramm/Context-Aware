import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { 
  LayoutDashboard, 
  Library, 
  Upload, 
  Sparkles, 
  Clapperboard, 
  Search, 
  User, 
  Settings,
  LogOut,
  Moon,
  Sun,
  GraduationCap
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

const NavItem = ({ to, icon: Icon, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  const content = (
    <>
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </>
  );

  const className = `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
    isActive 
      ? 'bg-primary text-primary-foreground' 
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;

  if (onClick) {
    return (
      <button onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link to={to} className={className}>
      {content}
    </Link>
  );
};

export default function AppSidebar() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const firstName = (user?.name || user?.full_name || user?.email?.split("@")[0] || "User").split(" ")[0];

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = '/login';
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <aside className="w-64 h-screen bg-card border-r border-border flex flex-col sticky top-0">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl gradient-brand text-white flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Context-Aware</h1>
            <p className="text-xs text-muted-foreground">Personalized study digests</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/lectures" icon={Library} label="My Lectures" />
        <NavItem to="/upload" icon={Upload} label="Upload Lecture" />
        <NavItem to="/generate-digest" icon={Sparkles} label="Generate Digest" />
        <NavItem to="/digests" icon={Clapperboard} label="My Digests" />
        <NavItem to="/search" icon={Search} label="Search" />
        <NavItem to="/profile" icon={User} label="Profile" />
        <NavItem to="/settings" icon={Settings} label="Settings" />
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {firstName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{firstName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1" 
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1" 
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}
