import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  Users,
  Target,
  Search,
  Phone,
  MessageCircle,
  Bell,
  HelpCircle,
  ChevronDown,
  Moon,
  Sun,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  CheckSquare,
  Settings
} from 'lucide-react';
import { useStore } from '../store/useStore';
import CommandPalette from './CommandPalette';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { contacts, opportunities, notifications, fetchNotifications, currentUser, logout } = useStore();
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const lower = searchQuery.toLowerCase();
    const results = [
      ...contacts.filter(c => c.name.toLowerCase().includes(lower)).map(c => ({ ...c, type: 'Contact', url: '/contacts' })),
      ...opportunities.filter(o => o.name.toLowerCase().includes(lower)).map(o => ({ ...o, type: 'Opportunity', url: '/opportunities' }))
    ];
    setSearchResults(results);
  }, [searchQuery, contacts, opportunities]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/conversations', icon: MessageSquare, label: 'Conversations' },
    { path: '/calendars', icon: CalendarDays, label: 'Calendars' },
    { path: '/contacts', icon: Users, label: 'Contacts' },
    { path: '/opportunities', icon: Target, label: 'Opportunities' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark overflow-hidden transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex-col bg-[#2d323c] text-white transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-2">
            <svg className="h-8 w-8 text-[#05acd6]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
            </svg>
            <h1 className="text-lg font-bold tracking-tight">GoHighLevel</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-gray-400 hover:bg-white/10 hover:text-gray-100'
                  }`}
              >
                <Icon size={22} className={isActive ? "text-primary fill-current opacity-100" : ""} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 md:px-8 transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3 text-gray-800 dark:text-gray-200">
              <div className="hidden md:block p-1.5 bg-gray-100 dark:bg-gray-700 rounded-md">
                <Target className="text-gray-600 dark:text-gray-300" size={20} />
              </div>
              <h2 className="text-sm md:text-base font-bold text-gray-700 dark:text-gray-200 truncate max-w-[200px] md:max-w-none">Digital Mojo · Hyderabad</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            <div className="relative hidden md:block w-64">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                className="block w-full rounded-lg border-0 bg-gray-100 dark:bg-gray-700 py-2 pl-10 pr-4 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-200 dark:ring-gray-600 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                placeholder="Search..."
              />
              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto z-50">
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                      onClick={() => navigate(result.url)}
                    >
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{result.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{result.type}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={toggleDarkMode}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
                <Phone size={20} />
              </button>
              <button className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
                <MessageCircle size={20} />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors relative">
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-gray-800"></span>
                )}
              </button>
              <button className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
                <HelpCircle size={20} />
              </button>
            </div>

            <div className="relative" ref={profileRef}>
              <div
                className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700 cursor-pointer"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <img
                  className="h-8 w-8 md:h-9 md:w-9 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                  src={currentUser?.avatar || "https://ui-avatars.com/api/?name=User&background=random"}
                  alt="User avatar"
                />
                <ChevronDown size={16} className="text-gray-400 hidden md:block" />
              </div>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in duration-200">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser?.email || 'user@example.com'}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <UserIcon size={16} />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark transition-colors duration-200">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
};

export default Layout;