import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Target,
  ChevronDown,
  CheckSquare,
  X,
  LogOut,
  User as UserIcon,
  Settings,
  Menu
} from 'lucide-react';
import { useStore } from '../store/useStore';
import CommandPalette from './CommandPalette';
import DemoBanner from './DemoBanner';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { contacts, opportunities, currentUser, logout } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);



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



  const pendingTasksCount = useMemo(() => {
    let count = 0;
    opportunities.forEach(opp => {
      if (opp.tasks) {
        opp.tasks.forEach(task => {
          const isAssignedToMe = task.assignee === currentUser?.id || task.assignee === currentUser?.email;
          if (!task.isCompleted && isAssignedToMe) {
            count++;
          }
        });
      }
    });
    return count;
  }, [opportunities, currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/calendars', icon: CalendarDays, label: 'Calendars' },
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
      <aside className={`fixed inset-y-0 left-0 z-50 w-52 flex-col bg-[#1e2a3b] text-white transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-14 items-center gap-2 px-4 border-b border-white/5">
          <img src="/dm.png" alt="Digital Mojo Logo" className="h-7 w-7 object-contain" />
          <h1 className="text-base font-bold tracking-tight text-white">Digital-Mojo</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden ml-auto text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${isActive
                  ? 'bg-primary text-black font-semibold'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} className={isActive ? 'text-white' : ''} />
                <span className={`font-medium ${isActive ? 'text-black' : 'text-white'}`}>
                  {item.label}
                </span>
                {item.path === '/tasks' && pendingTasksCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {pendingTasksCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {/* Demo Banner */}
        <DemoBanner />
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