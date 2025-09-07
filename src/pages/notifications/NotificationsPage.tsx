import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  PlusIcon,
  PlayIcon,
  PencilIcon,
  TrashIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { StatusIndicator } from '../../components/ui/StatusIndicator';
import { notificationsApi } from '../../services/api';
import { format } from 'date-fns';

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  template_type: z.string().min(1, 'Template type is required'),
  notification_type: z.enum(['email', 'sms']),
  subject: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  is_active: z.boolean(),
  is_default: z.boolean(),
});

const preferencesSchema = z.object({
  booking_confirmations_email: z.boolean(),
  booking_reminders_email: z.boolean(),
  booking_cancellations_email: z.boolean(),
  daily_agenda_email: z.boolean(),
  booking_confirmations_sms: z.boolean(),
  booking_reminders_sms: z.boolean(),
  booking_cancellations_sms: z.boolean(),
  reminder_minutes_before: z.number().min(5).max(1440),
  daily_agenda_time: z.string(),
  dnd_enabled: z.boolean(),
  dnd_start_time: z.string(),
  dnd_end_time: z.string(),
  exclude_weekends_reminders: z.boolean(),
  exclude_weekends_agenda: z.boolean(),
  preferred_notification_method: z.enum(['email', 'sms', 'both']),
  max_reminders_per_day: z.number().min(1).max(50),
});

type TemplateFormData = z.infer<typeof templateSchema>;
type PreferencesFormData = z.infer<typeof preferencesSchema>;

const TEMPLATE_TYPES = [
  { value: 'booking_confirmation', label: 'Booking Confirmation' },
  { value: 'booking_reminder', label: 'Booking Reminder' },
  { value: 'booking_cancellation', label: 'Booking Cancellation' },
  { value: 'booking_rescheduled', label: 'Booking Rescheduled' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'custom', label: 'Custom' },
];

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('templates');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      notification_type: 'email',
      is_active: true,
      is_default: false,
    },
  });

  const preferencesForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
  });

  // Queries
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: notificationsApi.getTemplates,
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['notification-logs'],
    queryFn: notificationsApi.getLogs,
  });

  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: notificationsApi.getPreferences,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: notificationsApi.getStats,
  });

  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: notificationsApi.createTemplate,
    onSuccess: () => {
      toast.success('Template created successfully');
      setShowTemplateModal(false);
      templateForm.reset();
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: () => {
      toast.error('Failed to create template');
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TemplateFormData> }) =>
      notificationsApi.updateTemplate(id, data),
    onSuccess: () => {
      toast.success('Template updated successfully');
      setShowTemplateModal(false);
      setEditingTemplate(null);
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: () => {
      toast.error('Failed to update template');
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: notificationsApi.deleteTemplate,
    onSuccess: () => {
      toast.success('Template deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: () => {
      toast.error('Failed to delete template');
    },
  });

  const testTemplateMutation = useMutation({
    mutationFn: notificationsApi.testTemplate,
    onSuccess: () => {
      toast.success('Test notification sent');
    },
    onError: () => {
      toast.error('Failed to send test notification');
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: notificationsApi.updatePreferences,
    onSuccess: () => {
      toast.success('Preferences updated successfully');
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: () => {
      toast.error('Failed to update preferences');
    },
  });

  const resendNotificationMutation = useMutation({
    mutationFn: notificationsApi.resendNotification,
    onSuccess: () => {
      toast.success('Notification resent successfully');
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    },
    onError: () => {
      toast.error('Failed to resend notification');
    },
  });

  const onTemplateSubmit = (data: TemplateFormData) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const onPreferencesSubmit = (data: PreferencesFormData) => {
    updatePreferencesMutation.mutate(data);
  };

  const openEditTemplate = (template: any) => {
    setEditingTemplate(template);
    templateForm.reset(template);
    setShowTemplateModal(true);
  };

  const tabs = [
    { id: 'templates', name: 'Templates', icon: EnvelopeIcon },
    { id: 'logs', name: 'Activity Logs', icon: BellIcon },
    { id: 'preferences', name: 'Preferences', icon: CogIcon },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Notifications</h1>
          <p className="text-neutral-600">Manage notification templates and delivery preferences</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-monkai-100 rounded-lg">
              <EnvelopeIcon className="h-6 w-6 text-monkai-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Email Sent</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.email_count || 0}
              </p>
              <p className="text-xs text-monkai-600">
                {stats?.email_delivery_rate || 0}% delivered
              </p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-accent-100 rounded-lg">
              <DevicePhoneMobileIcon className="h-6 w-6 text-accent-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">SMS Sent</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.sms_count || 0}
              </p>
              <p className="text-xs text-accent-600">
                {stats?.sms_delivery_rate || 0}% delivered
              </p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-warning-100 rounded-lg">
              <BellIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Open Rate</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.email_open_rate || 0}%
              </p>
              <p className="text-xs text-warning-600">email opens</p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-danger-100 rounded-lg">
              <BellIcon className="h-6 w-6 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Failed</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.total_failed || 0}
              </p>
              <p className="text-xs text-danger-600">notifications</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-monkai-500 text-monkai-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              <tab.icon
                className={`mr-2 h-5 w-5 ${
                  activeTab === tab.id ? 'text-monkai-500' : 'text-neutral-400 group-hover:text-neutral-500'
                }`}
              />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Notification Templates</h2>
              <p className="text-sm text-neutral-600">Customize your notification messages</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowTemplateModal(true)}
              icon={<PlusIcon className="h-4 w-4" />}
            >
              Create Template
            </Button>
          </div>

          {templatesLoading ? (
            <LoadingSpinner />
          ) : templates && templates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Name</TableCell>
                  <TableCell header>Type</TableCell>
                  <TableCell header>Channel</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Default</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {template.notification_type === 'email' ? (
                          <EnvelopeIcon className="h-4 w-4 text-neutral-400 mr-2" />
                        ) : (
                          <DevicePhoneMobileIcon className="h-4 w-4 text-neutral-400 mr-2" />
                        )}
                        <div>
                          <p className="font-medium text-neutral-900">{template.name}</p>
                          {template.subject && (
                            <p className="text-sm text-neutral-500 max-w-xs truncate">
                              {template.subject}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{template.template_type_display}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={template.notification_type === 'email' ? 'primary' : 'accent'}
                      >
                        {template.notification_type_display}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusIndicator
                        status={template.is_active ? 'success' : 'inactive'}
                        label={template.is_active ? 'Active' : 'Inactive'}
                      />
                    </TableCell>
                    <TableCell>
                      {template.is_default && (
                        <Badge variant="primary" size="sm">Default</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => testTemplateMutation.mutate(template.id)}
                          loading={testTemplateMutation.isPending}
                        >
                          <PlayIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditTemplate(template)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this template?')) {
                              deleteTemplateMutation.mutate(template.id);
                            }
                          }}
                        >
                          <TrashIcon className="h-4 w-4 text-danger-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <BellIcon className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-neutral-900">No templates created</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Create notification templates to customize your messages.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'logs' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Notification Activity</h2>

          {logsLoading ? (
            <LoadingSpinner />
          ) : logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Recipient</TableCell>
                  <TableCell header>Type</TableCell>
                  <TableCell header>Subject</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Sent</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {log.notification_type === 'email' ? (
                          <EnvelopeIcon className="h-4 w-4 text-neutral-400 mr-2" />
                        ) : (
                          <DevicePhoneMobileIcon className="h-4 w-4 text-neutral-400 mr-2" />
                        )}
                        {log.recipient_email || log.recipient_phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={log.notification_type === 'email' ? 'primary' : 'accent'}
                      >
                        {log.notification_type_display}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-neutral-900 max-w-xs truncate">
                        {log.subject || 'SMS Message'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusIndicator
                        status={
                          log.status === 'delivered' ? 'success' :
                          log.status === 'sent' ? 'success' :
                          log.status === 'failed' ? 'error' :
                          log.status === 'pending' ? 'warning' : 'inactive'
                        }
                        label={log.status_display}
                      />
                    </TableCell>
                    <TableCell>
                      {log.sent_at ? (
                        <div>
                          <p className="text-sm text-neutral-900">
                            {format(new Date(log.sent_at), 'MMM d')}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {format(new Date(log.sent_at), 'h:mm a')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-500">Not sent</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resendNotificationMutation.mutate(log.id)}
                          loading={resendNotificationMutation.isPending}
                        >
                          Resend
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <BellIcon className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-neutral-900">No notifications sent</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Notification activity will appear here.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Notification Preferences</h2>

          {preferencesLoading ? (
            <LoadingSpinner />
          ) : preferences ? (
            <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-8">
              {/* Email Preferences */}
              <div>
                <h3 className="text-md font-medium text-neutral-900 mb-4">Email Notifications</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...preferencesForm.register('booking_confirmations_email')}
                      className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Booking confirmations</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...preferencesForm.register('booking_reminders_email')}
                      className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Booking reminders</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...preferencesForm.register('booking_cancellations_email')}
                      className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Booking cancellations</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...preferencesForm.register('daily_agenda_email')}
                      className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Daily agenda</span>
                  </label>
                </div>
              </div>

              {/* SMS Preferences */}
              <div>
                <h3 className="text-md font-medium text-neutral-900 mb-4">SMS Notifications</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...preferencesForm.register('booking_confirmations_sms')}
                      className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Booking confirmations</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...preferencesForm.register('booking_reminders_sms')}
                      className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Booking reminders</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...preferencesForm.register('booking_cancellations_sms')}
                      className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Booking cancellations</span>
                  </label>
                </div>
              </div>

              {/* Timing Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Reminder Time (minutes before)"
                  type="number"
                  min="5"
                  max="1440"
                  {...preferencesForm.register('reminder_minutes_before', { valueAsNumber: true })}
                  error={preferencesForm.formState.errors.reminder_minutes_before?.message}
                />

                <Input
                  label="Daily Agenda Time"
                  type="time"
                  {...preferencesForm.register('daily_agenda_time')}
                  error={preferencesForm.formState.errors.daily_agenda_time?.message}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={updatePreferencesMutation.isPending}
                >
                  Save Preferences
                </Button>
              </div>
            </form>
          ) : null}
        </Card>
      )}

      {/* Add/Edit Template Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setEditingTemplate(null);
          templateForm.reset();
        }}
        title={editingTemplate ? 'Edit Template' : 'Create Template'}
        size="lg"
      >
        <form onSubmit={templateForm.handleSubmit(onTemplateSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name"
              required
              {...templateForm.register('name')}
              error={templateForm.formState.errors.name?.message}
              placeholder="Booking Confirmation"
            />

            <div>
              <label className="form-label">Template Type</label>
              <select
                {...templateForm.register('template_type')}
                className="input"
                required
              >
                <option value="">Select type</option>
                {TEMPLATE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Notification Type</label>
            <div className="flex space-x-4 mt-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="email"
                  {...templateForm.register('notification_type')}
                  className="text-monkai-600 focus:ring-monkai-500"
                />
                <span className="ml-2 text-sm text-neutral-700">Email</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="sms"
                  {...templateForm.register('notification_type')}
                  className="text-monkai-600 focus:ring-monkai-500"
                />
                <span className="ml-2 text-sm text-neutral-700">SMS</span>
              </label>
            </div>
          </div>

          {templateForm.watch('notification_type') === 'email' && (
            <Input
              label="Subject"
              {...templateForm.register('subject')}
              error={templateForm.formState.errors.subject?.message}
              placeholder="Your booking is confirmed"
            />
          )}

          <div>
            <label className="form-label">Message</label>
            <textarea
              {...templateForm.register('message')}
              rows={6}
              className="input"
              placeholder="Hi {{invitee_name}}, your booking for {{event_name}} is confirmed..."
            />
            {templateForm.formState.errors.message && (
              <p className="form-error">{templateForm.formState.errors.message.message}</p>
            )}
            <p className="form-help">
              Use placeholders like {{`{{invitee_name}}`}}, {{`{{event_name}}`}}, {{`{{start_time}}`}} for dynamic content
            </p>
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...templateForm.register('is_active')}
                className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
              />
              <span className="ml-2 text-sm text-neutral-700">Active</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                {...templateForm.register('is_default')}
                className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
              />
              <span className="ml-2 text-sm text-neutral-700">Set as default</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowTemplateModal(false);
                setEditingTemplate(null);
                templateForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={editingTemplate ? updateTemplateMutation.isPending : createTemplateMutation.isPending}
            >
              {editingTemplate ? 'Update' : 'Create'} Template
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};