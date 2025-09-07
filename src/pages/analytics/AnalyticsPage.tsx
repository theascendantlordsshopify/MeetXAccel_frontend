import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  BellIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { bookingsApi, availabilityApi, workflowsApi, notificationsApi, contactsApi } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30');

  // Queries
  const { data: bookingAnalytics, isLoading: bookingLoading } = useQuery({
    queryKey: ['booking-analytics'],
    queryFn: bookingsApi.getAnalytics,
  });

  const { data: availabilityStats, isLoading: availabilityLoading } = useQuery({
    queryKey: ['availability-stats'],
    queryFn: availabilityApi.getStats,
  });

  const { data: workflowStats, isLoading: workflowLoading } = useQuery({
    queryKey: ['workflow-stats'],
    queryFn: workflowsApi.getPerformanceStats,
  });

  const { data: notificationStats, isLoading: notificationLoading } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: notificationsApi.getStats,
  });

  const { data: contactStats, isLoading: contactLoading } = useQuery({
    queryKey: ['contact-stats'],
    queryFn: contactsApi.getStats,
  });

  const isLoading = bookingLoading || availabilityLoading || workflowLoading || notificationLoading || contactLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Prepare chart data
  const bookingStatusData = [
    { name: 'Confirmed', value: bookingAnalytics?.confirmed_bookings || 0, color: '#22c55e' },
    { name: 'Cancelled', value: bookingAnalytics?.cancelled_bookings || 0, color: '#ef4444' },
    { name: 'Completed', value: bookingAnalytics?.completed_bookings || 0, color: '#6366f1' },
    { name: 'No Show', value: bookingAnalytics?.no_show_bookings || 0, color: '#f59e0b' },
  ];

  const eventTypeData = bookingAnalytics?.bookings_by_event_type?.map((item) => ({
    name: item.event_type__name,
    bookings: item.count,
  })) || [];

  const calendarSyncData = [
    { name: 'Success', value: bookingAnalytics?.calendar_sync_success || 0, color: '#22c55e' },
    { name: 'Failed', value: bookingAnalytics?.calendar_sync_failed || 0, color: '#ef4444' },
    { name: 'Pending', value: bookingAnalytics?.calendar_sync_pending || 0, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Analytics</h1>
          <p className="text-neutral-600">Insights into your scheduling performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input w-auto"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-monkai-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-monkai-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Total Bookings</p>
              <p className="text-2xl font-bold text-neutral-900">
                {bookingAnalytics?.total_bookings || 0}
              </p>
              <p className="text-xs text-monkai-600">
                {bookingAnalytics?.confirmed_bookings || 0} confirmed
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
              <p className="text-sm font-medium text-neutral-600">Availability</p>
              <p className="text-2xl font-bold text-neutral-900">
                {availabilityStats?.average_weekly_hours || 0}h
              </p>
              <p className="text-xs text-accent-600">per week</p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-warning-100 rounded-lg">
              <WrenchScrewdriverIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Workflow Success</p>
              <p className="text-2xl font-bold text-neutral-900">
                {workflowStats?.execution_stats_30_days?.success_rate || 0}%
              </p>
              <p className="text-xs text-warning-600">last 30 days</p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-danger-100 rounded-lg">
              <BellIcon className="h-6 w-6 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Email Open Rate</p>
              <p className="text-2xl font-bold text-neutral-900">
                {notificationStats?.email_open_rate || 0}%
              </p>
              <p className="text-xs text-danger-600">notifications</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Status Distribution */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Booking Status Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {bookingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bookings by Event Type */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Bookings by Event Type</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Calendar Sync Health */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Calendar Sync Health</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={calendarSyncData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {calendarSyncData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Weekly Availability */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Weekly Availability Hours</h2>
          <div className="space-y-3">
            {availabilityStats?.daily_hours && Object.entries(availabilityStats.daily_hours).map(([day, hours]) => (
              <div key={day} className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">{day}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-neutral-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-monkai-600 h-2 rounded-full"
                      style={{ width: `${Math.min((hours / 12) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-neutral-600 w-12 text-right">
                    {hours}h
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Workflow Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Total Workflows</span>
              <span className="text-sm font-medium">{workflowStats?.total_workflows || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Active</span>
              <span className="text-sm font-medium">{workflowStats?.active_workflows || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Success Rate</span>
              <span className="text-sm font-medium">
                {workflowStats?.execution_stats_30_days?.success_rate || 0}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Notification Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Email Delivery Rate</span>
              <span className="text-sm font-medium">{notificationStats?.email_delivery_rate || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Email Open Rate</span>
              <span className="text-sm font-medium">{notificationStats?.email_open_rate || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">SMS Delivery Rate</span>
              <span className="text-sm font-medium">{notificationStats?.sms_delivery_rate || 0}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Contact Insights</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Total Contacts</span>
              <span className="text-sm font-medium">{contactStats?.total_contacts || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Active Contacts</span>
              <span className="text-sm font-medium">{contactStats?.active_contacts || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">This Month Bookings</span>
              <span className="text-sm font-medium">
                {contactStats?.booking_frequency?.this_month || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};