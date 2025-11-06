// components/Layout.tsx

"use client";

import React, { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePathname, useRouter } from 'next/navigation';
import { Moon, Sun, Home, FileText, Trophy, User, LogOut, Menu, X, History, Settings } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Route Protection Logic
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user && pathname !== '/auth') {
        router.push('/auth');
      }
    }
  }, [user, isAuthLoading, pathname, router]);

  const handleLogout = () => { logout(); router.push('/auth'); };
  const handleNavigation = (path: string) => { setSidebarOpen(false); router.push(path); };

  // Loading State
  if (isAuthLoading && pathname !== '/auth') {
    return ( <div className="loading-screen"><p>Authenticating...</p></div> );
  }

  // Render nothing during redirect phase
  if (!isAuthLoading && !user && pathname !== '/auth') { return null; }

  // Render Auth Page without Layout
  if (pathname === '/auth') { return <>{children}</>; }

  // Determine active tab
  const getActiveTab = () => {
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname.startsWith('/dashboard')) return 'dashboard';
    if (pathname.startsWith('/papers')) return 'papers';
    if (pathname.startsWith('/history')) return 'history';
    if (pathname.startsWith('/rankings')) return 'rankings';
    if (pathname.startsWith('/profile')) return 'profile';
    return 'dashboard';
  };
  const activeTab = getActiveTab();

  // Menu items (conditional admin link)
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/dashboard' },
    { id: 'papers', icon: FileText, label: 'Select Paper', path: '/papers' },
    { id: 'history', icon: History, label: 'Attempt History', path: '/history' },
    { id: 'rankings', icon: Trophy, label: 'Rankings', path: '/rankings' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];
  if (user?.role === 'admin') {
    menuItems.push({ id: 'admin', icon: Settings, label: 'Admin Panel', path: '/admin' });
  }

  // Render Layout for Authenticated Users
  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''} bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}>
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 backdrop-blur-lg">
         <div className="flex items-center justify-between px-4 md:px-6 py-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 btn-icon" aria-label="Toggle sidebar">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {/* Logo/Brand */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                OM
              </div>
              {/* --- UPDATED SITE NAME --- */}
              <span className="hidden md:block text-lg font-bold text-gray-900 dark:text-white">
                Open MCQ
              </span>
              {/* ------------------------- */}
            </div>
          </div>
          {/* Right side controls */}
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} aria-label="Toggle theme" className="p-2 btn-icon">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <div className="w-8 h-8 user-avatar-bg rounded-full flex items-center justify-center text-white text-sm font-bold uppercase">
                {/* --- FIX 1: Use firstName and lastName for initials --- */}
                {user?.firstName?.[0]}{user?.lastName?.[0] || '?'}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                {/* --- FIX 2: Combine firstName and lastName for display --- */}
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar & Main Content */}
      <div className="flex max-w-screen-2xl mx-auto">
        {/* Sidebar */}
        <aside className={`${ sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full' } md:translate-x-0 fixed md:sticky top-[73px] left-0 h-[calc(100vh-73px)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 z-30 flex flex-col`}>
          <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button key={item.id} onClick={() => handleNavigation(item.path)} className={`sidebar-button ${activeTab === item.id ? 'sidebar-button-active' : 'sidebar-button-inactive'}`}>
                <item.icon size={18} /> <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={handleLogout} className="sidebar-button sidebar-button-logout">
                <LogOut size={18} /> <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (<div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" aria-hidden="true"/>)}

      {/* Basic styles - consider moving to globals.css */}
      <style jsx>{`
        .loading-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #F9FAFB; } .dark .loading-screen { background-color: #111827; color: #F9FAFB; }
        .btn-icon { border-radius: 0.5rem; transition: background-color 0.2s; } .btn-icon:hover { background-color: #F3F4F6; } .dark .btn-icon { color: #D1D5DB; } .dark .btn-icon:hover { background-color: #374151; }
        .user-avatar-bg { background-image: linear-gradient(to bottom right, #3B82F6, #8B5CF6); }
        .sidebar-button { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 0.5rem; transition: all 0.2s; font-size: 0.875rem; }
        .sidebar-button-active { background-image: linear-gradient(to right, #3B82F6, #8B5CF6); color: white; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }
        .sidebar-button-inactive { color: #4B556F; } .sidebar-button-inactive:hover { background-color: #F3F4F6; color: #111827; } .dark .sidebar-button-inactive { color: #9CA3AF; } .dark .sidebar-button-inactive:hover { background-color: #374151; color: white; }
        .sidebar-button-logout { color: #DC2626; } .sidebar-button-logout:hover { background-color: #FEF2F2; } .dark .sidebar-button-logout { color: #F87171; } .dark .sidebar-button-logout:hover { background-color: rgba(185, 28, 28, 0.2); }
      `}</style>
    </div>
  );
}