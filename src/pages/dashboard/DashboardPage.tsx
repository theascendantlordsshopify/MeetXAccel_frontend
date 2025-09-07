import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusIndicator } from '../../components/ui/StatusIndicator';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../stores/authStore';
import { dashboardApi, bookingsApi, eventTypesApi, integrationsApi } from '../../services/api';
import { formatDistanceToNow, format } from 'date-fns';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: recentBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['recent-bookings'],
    queryFn: () => bookingsApi.list({ limit: 5 }),
  });

  const { data: eventTypes, isLoading: eventTypesLoading } = useQuery({
    queryKey: ['event-types'],
    queryFn: eventTypesApi.list,
  });

  const { data: integrationHealth, isLoading: integrationsLoading } = useQuery({
    queryKey: ['integration-health'],
    queryFn: integrationsApi.getHealth,
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-monkai-600 to-monkai-800 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">
              Welcome back, {user?.first_name}!
            </h1>
            <p className="text-monkai-100 text-lg">
              Here's what's happening with your scheduling today.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <CalendarDaysIcon className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-monkai-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-monkai-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Event Types</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.total_event_types || 0}
              </p>
              <p className="text-xs text-accent-600">
                {stats?.active_event_types || 0} active
              </p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-accent-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-accent-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Total Bookings</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.total_bookings || 0}
              </p>
              <p className="text-xs text-accent-600">
                {stats?.upcoming_bookings || 0} upcoming
              </p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-warning-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">This Month</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.confirmed_bookings || 0}
              </p>
              <p className="text-xs text-warning-600">confirmed</p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-danger-100 rounded-lg">
              <LinkIcon className="h-6 w-6 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Integrations</p>
              <p className="text-2xl font-bold text-neutral-900">
                {(stats?.calendar_integrations || 0) + (stats?.video_integrations || 0)}
              </p>
              <p className="text-xs text-danger-600">connected</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Recent Bookings</h2>
              <Link to="/dashboard/bookings">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            {bookingsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border border-neutral-200 rounded-lg">
                    <div className="w-12 h-12 bg-neutral-200 rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-neutral-200 rounded animate-pulse" />
                      <div className="h-3 bg-neutral-200 rounded w-2/3 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentBookings && recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center space-x-4 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-monkai-100 rounded-lg flex items-center justify-center">
                        <ClockIcon className="h-6 w-6 text-monkai-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {booking.invitee_name} - {booking.event_type.name}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {format(new Date(booking.start_time), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          booking.status === 'confirmed' ? 'success' :
                          booking.status === 'cancelled' ? 'danger' :
                          booking.status === 'completed' ? 'primary' : 'warning'
                        }
                      >
                        {booking.status_display}
                      </Badge>
                      <StatusIndicator
                        status={
                          booking.calendar_sync_status === 'succeeded' ? 'success' :
                          booking.calendar_sync_status === 'failed' ? 'error' :
                          booking.calendar_sync_status === 'pending' ? 'warning' : 'inactive'
                        }
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClockIcon className="mx-auto h-12 w-12 text-neutral-400" />
                <h3 className="mt-2 text-sm font-medium text-neutral-900">No bookings yet</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Share your booking link to start receiving bookings.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions & Status */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/dashboard/event-types/new" className="block">
                <Button variant="primary" className="w-full justify-start">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Event Type
                </Button>
              </Link>
              
              {user?.profile?.organizer_slug && (
                <Link
                  to={`/${user.profile.organizer_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="secondary" className="w-full justify-start">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View Public Page
                  </Button>
                </Link>
              )}
              
              <Link to="/dashboard/integrations" className="block">
                <Button variant="ghost" className="w-full justify-start">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Connect Calendar
                </Button>
              </Link>
            </div>
          </Card>

          {/* Integration Health */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Integration Health</h2>
            
            {integrationsLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-neutral-200 rounded animate-pulse" />
                <div className="h-4 bg-neutral-200 rounded animate-pulse" />
              </div>
            ) : integrationHealth ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Overall Health</span>
                  <StatusIndicator
                    status={
                      integrationHealth.overall_health === 'healthy' ? 'success' :
                      integrationHealth.overall_health === 'degraded' ? 'warning' : 'error'
                    }
                    label={integrationHealth.overall_health}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Calendar Sync</span>
                  <span className="text-sm font-medium">
                    {integrationHealth.calendar_integrations?.length || 0} connected
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Video Conferencing</span>
                  <span className="text-sm font-medium">
                    {integrationHealth.video_integrations?.length || 0} connected
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-neutral-500">No integrations configured</p>
                <Link to="/dashboard/integrations" className="text-sm text-monkai-600 hover:text-monkai-700">
                  Set up integrations →
                </Link>
              </div>
            )}
          </Card>

          {/* Account Status */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Account Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Email Verified</span>
                <StatusIndicator
                  status={user?.is_email_verified ? 'success' : 'warning'}
                  label={user?.is_email_verified ? 'Verified' : 'Unverified'}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">MFA Enabled</span>
                <StatusIndicator
                  status={user?.is_mfa_enabled ? 'success' : 'inactive'}
                  label={user?.is_mfa_enabled ? 'Enabled' : 'Disabled'}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Account Status</span>
                <Badge
                  variant={user?.account_status === 'active' ? 'success' : 'warning'}
                >
                  {user?.account_status}
                </Badge>
              </div>
            </div>
            
            {(!user?.is_email_verified || !user?.is_mfa_enabled) && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <Link to="/dashboard/settings/security">
                  <Button variant="ghost" size="sm" className="w-full">
                    Complete Setup →
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Event Types Overview */}
      {eventTypes && eventTypes.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">Your Event Types</h2>
            <Link to="/dashboard/event-types">
              <Button variant="ghost" size="sm">
                Manage All
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventTypes.slice(0, 6).map((eventType) => (
              <div
                key={eventType.id}
                className="border border-neutral-200 rounded-lg p-4 hover:border-monkai-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-neutral-900 truncate">
                    {eventType.name}
                  </h3>
                  <StatusIndicator
                    status={eventType.is_active ? 'success' : 'inactive'}
                    size="sm"
                  />
                </div>
                
                <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                  {eventType.description || 'No description'}
                </p>
                
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{eventType.duration} min</span>
                  <span>{eventType.location_type}</span>
                  {eventType.is_group_event && (
                    <Badge variant="primary" size="sm">
                      Group ({eventType.max_attendees})
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 mt-3">
                  <Link
                    to={`/${user?.profile?.organizer_slug}/${eventType.event_type_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      <EyeIcon className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/${user?.profile?.organizer_slug}/${eventType.event_type_slug}`
                      );
                    }}
                  >
                    <LinkIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};