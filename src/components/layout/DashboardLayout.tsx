import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import {
  HomeIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CogIcon,
  ChartBarIcon,
  BellIcon,
  LinkIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Event Types', href: '/dashboard/event-types', icon: CalendarDaysIcon },
  { name: 'Bookings', href: '/dashboard/bookings', icon: ClockIcon },
  { name: 'Availability', href: '/dashboard/availability', icon: ClockIcon },
  { name: 'Contacts', href: '/dashboard/contacts', icon: UserGroupIcon },
  { name: 'Workflows', href: '/dashboard/workflows', icon: WrenchScrewdriverIcon },
  { name: 'Notifications', href: '/dashboard/notifications', icon: BellIcon },
  { name: 'Integrations', href: '/dashboard/integrations', icon: LinkIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
];

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-monkai-500 to-monkai-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="ml-3 text-xl font-display font-semibold monkai-text-gradient">
                Calendly Clone
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-monkai-50 text-monkai-700 border-r-2 border-monkai-500'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 transition-colors ${
                      isActive ? 'text-monkai-500' : 'text-neutral-400 group-hover:text-neutral-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="border-t border-neutral-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {user?.profile?.profile_picture ? (
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={user.profile.profile_picture}
                    alt={user.full_name}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-monkai-100 flex items-center justify-center">
                    <UserCircleIcon className="h-6 w-6 text-monkai-600" />
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {user?.full_name || user?.email}
                </p>
                <div className="flex items-center mt-1">
                  <StatusIndicator
                    status={user?.account_status === 'active' ? 'success' : 'warning'}
                    size="sm"
                  />
                  <span className="text-xs text-neutral-500 ml-1">
                    {user?.account_status === 'active' ? 'Active' : user?.account_status}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="p-2"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`lg:pl-64 transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-0'}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 lg:hidden"
              >
                <Bars3Icon className="h-5 w-5" />
              </Button>
              
              <div className="ml-4 lg:ml-0">
                <h1 className="text-2xl font-display font-semibold text-neutral-900">
                  {getPageTitle(location.pathname)}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user?.profile?.organizer_slug && (
                <Link
                  to={`/${user.profile.organizer_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-monkai-600 hover:text-monkai-700 font-medium"
                >
                  View Public Page →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/event-types': 'Event Types',
    '/dashboard/bookings': 'Bookings',
    '/dashboard/availability': 'Availability',
    '/dashboard/contacts': 'Contacts',
    '/dashboard/workflows': 'Workflows',
    '/dashboard/notifications': 'Notifications',
    '/dashboard/integrations': 'Integrations',
    '/dashboard/analytics': 'Analytics',
    '/dashboard/settings': 'Settings',
  };

  // Check for exact matches first
  if (routes[pathname]) {
    return routes[pathname];
  }

  // Check for partial matches
  for (const [route, title] of Object.entries(routes)) {
    if (pathname.startsWith(route) && route !== '/dashboard') {
      return title;
    }
  }

  return 'Dashboard';
}