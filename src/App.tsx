import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import { useStore } from './store/useStore';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Calendars from './pages/Calendars';
// Contacts page removed from navigation
import Opportunities from './pages/Opportunities';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

const PrivateRoute = () => {
  const { currentUser, isLoadingAuth } = useStore();

  if (isLoadingAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const { fetchNotifications, initializeListeners, initializeAuthListener } = useStore();

  useEffect(() => {
    initializeAuthListener();
    fetchNotifications();
    initializeListeners();
  }, [fetchNotifications, initializeListeners, initializeAuthListener]);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<PrivateRoute />}>
          <Route element={<Layout><Outlet /></Layout>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendars" element={<Calendars />} />
            {/* Contacts routes removed */}
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
