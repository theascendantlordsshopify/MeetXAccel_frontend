import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  CalendarDaysIcon,
  VideoCameraIcon,
  LinkIcon,
  PlusIcon,
  PlayIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { StatusIndicator } from '../../components/ui/StatusIndicator';
import { integrationsApi } from '../../services/api';
import { format } from 'date-fns';

const webhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  webhook_url: z.string().url('Please enter a valid URL'),
  events: z.array(z.string()).min(1, 'Select at least one event'),
  secret_key: z.string().optional(),
  is_active: z.boolean(),
  retry_failed: z.boolean(),
  max_retries: z.number().min(1).max(10),
});

type WebhookFormData = z.infer<typeof webhookSchema>;

const WEBHOOK_EVENTS = [
  { value: 'booking_created', label: 'Booking Created' },
  { value: 'booking_cancelled', label: 'Booking Cancelled' },
  { value: 'booking_rescheduled', label: 'Booking Rescheduled' },
  { value: 'booking_completed', label: 'Booking Completed' },
];

export const IntegrationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('calendar');
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<any>(null);

  const webhookForm = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      is_active: true,
      retry_failed: true,
      max_retries: 3,
      events: [],
    },
  });

  // Queries
  const { data: calendarIntegrations, isLoading: calendarLoading } = useQuery({
    queryKey: ['calendar-integrations'],
    queryFn: integrationsApi.getCalendarIntegrations,
  });

  const { data: videoIntegrations, isLoading: videoLoading } = useQuery({
    queryKey: ['video-integrations'],
    queryFn: integrationsApi.getVideoIntegrations,
  });

  const { data: webhooks, isLoading: webhooksLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: integrationsApi.getWebhooks,
  });

  const { data: integrationHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['integration-health'],
    queryFn: integrationsApi.getHealth,
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['integration-logs'],
    queryFn: integrationsApi.getLogs,
  });

  // Mutations
  const createWebhookMutation = useMutation({
    mutationFn: integrationsApi.createWebhook,
    onSuccess: () => {
      toast.success('Webhook created successfully');
      setShowWebhookModal(false);
      webhookForm.reset();
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: () => {
      toast.error('Failed to create webhook');
    },
  });

  const updateWebhookMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WebhookFormData> }) =>
      integrationsApi.updateWebhook(id, data),
    onSuccess: () => {
      toast.success('Webhook updated successfully');
      setShowWebhookModal(false);
      setEditingWebhook(null);
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: () => {
      toast.error('Failed to update webhook');
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: integrationsApi.deleteWebhook,
    onSuccess: () => {
      toast.success('Webhook deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: () => {
      toast.error('Failed to delete webhook');
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: integrationsApi.testWebhook,
    onSuccess: () => {
      toast.success('Test webhook sent successfully');
    },
    onError: () => {
      toast.error('Failed to send test webhook');
    },
  });

  const refreshCalendarMutation = useMutation({
    mutationFn: integrationsApi.refreshCalendarSync,
    onSuccess: () => {
      toast.success('Calendar sync refreshed');
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations'] });
    },
    onError: () => {
      toast.error('Failed to refresh calendar sync');
    },
  });

  const connectIntegration = async (provider: string, type: 'calendar' | 'video') => {
    try {
      const redirectUri = `${window.location.origin}/integrations/callback`;
      const response = await integrationsApi.initiateOAuth(provider, type, redirectUri);
      
      if (response.authorization_url) {
        window.location.href = response.authorization_url;
      }
    } catch (error) {
      toast.error(`Failed to connect ${provider}`);
    }
  };

  const onWebhookSubmit = (data: WebhookFormData) => {
    if (editingWebhook) {
      updateWebhookMutation.mutate({ id: editingWebhook.id, data });
    } else {
      createWebhookMutation.mutate(data);
    }
  };

  const openEditWebhook = (webhook: any) => {
    setEditingWebhook(webhook);
    webhookForm.reset(webhook);
    setShowWebhookModal(true);
  };

  const tabs = [
    { id: 'calendar', name: 'Calendar', icon: CalendarDaysIcon },
    { id: 'video', name: 'Video Conferencing', icon: VideoCameraIcon },
    { id: 'webhooks', name: 'Webhooks', icon: LinkIcon },
    { id: 'logs', name: 'Activity Logs', icon: ExclamationTriangleIcon },
  ];

  return (
    <div className="space-y-8">
      {/* Integration Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-monkai-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-monkai-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Calendar Sync</p>
              <p className="text-2xl font-bold text-neutral-900">
                {calendarIntegrations?.length || 0}
              </p>
              <p className="text-xs text-monkai-600">connected</p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-accent-100 rounded-lg">
              <VideoCameraIcon className="h-6 w-6 text-accent-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Video Conferencing</p>
              <p className="text-2xl font-bold text-neutral-900">
                {videoIntegrations?.length || 0}
              </p>
              <p className="text-xs text-accent-600">connected</p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-warning-100 rounded-lg">
              <LinkIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Webhooks</p>
              <p className="text-2xl font-bold text-neutral-900">
                {webhooks?.length || 0}
              </p>
              <p className="text-xs text-warning-600">configured</p>
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

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Connect Calendar Services */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Connect Calendar Services</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-neutral-200 rounded-lg p-4 hover:border-monkai-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">G</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-neutral-900">Google Calendar</h3>
                      <p className="text-sm text-neutral-500">Sync with Google Calendar</p>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => connectIntegration('google', 'calendar')}
                >
                  Connect Google Calendar
                </Button>
              </div>

              <div className="border border-neutral-200 rounded-lg p-4 hover:border-monkai-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">O</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-neutral-900">Outlook Calendar</h3>
                      <p className="text-sm text-neutral-500">Sync with Microsoft Outlook</p>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => connectIntegration('outlook', 'calendar')}
                >
                  Connect Outlook
                </Button>
              </div>
            </div>
          </Card>

          {/* Connected Calendar Integrations */}
          {calendarIntegrations && calendarIntegrations.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-6">Connected Calendars</h2>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>Provider</TableCell>
                    <TableCell header>Email</TableCell>
                    <TableCell header>Status</TableCell>
                    <TableCell header>Sync Enabled</TableCell>
                    <TableCell header>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calendarIntegrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <CalendarDaysIcon className="h-4 w-4 text-neutral-400 mr-2" />
                          {integration.provider_display}
                        </div>
                      </TableCell>
                      <TableCell>{integration.provider_email}</TableCell>
                      <TableCell>
                        <StatusIndicator
                          status={
                            integration.is_active && !integration.is_token_expired ? 'success' :
                            integration.is_token_expired ? 'error' : 'inactive'
                          }
                          label={
                            integration.is_active && !integration.is_token_expired ? 'Connected' :
                            integration.is_token_expired ? 'Token Expired' : 'Inactive'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={integration.sync_enabled ? 'success' : 'neutral'}>
                          {integration.sync_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => refreshCalendarMutation.mutate(integration.id)}
                            loading={refreshCalendarMutation.isPending}
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      )}

      {/* Video Tab */}
      {activeTab === 'video' && (
        <div className="space-y-6">
          {/* Connect Video Services */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Connect Video Conferencing</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-neutral-200 rounded-lg p-4 hover:border-monkai-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">Z</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-neutral-900">Zoom</h3>
                      <p className="text-sm text-neutral-500">Generate Zoom meeting links</p>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => connectIntegration('zoom', 'video')}
                >
                  Connect Zoom
                </Button>
              </div>

              <div className="border border-neutral-200 rounded-lg p-4 hover:border-monkai-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">M</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-neutral-900">Google Meet</h3>
                      <p className="text-sm text-neutral-500">Generate Google Meet links</p>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => connectIntegration('google_meet', 'video')}
                >
                  Connect Google Meet
                </Button>
              </div>
            </div>
          </Card>

          {/* Connected Video Integrations */}
          {videoIntegrations && videoIntegrations.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-6">Connected Video Services</h2>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>Provider</TableCell>
                    <TableCell header>Email</TableCell>
                    <TableCell header>Status</TableCell>
                    <TableCell header>Auto Generate</TableCell>
                    <TableCell header>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videoIntegrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <VideoCameraIcon className="h-4 w-4 text-neutral-400 mr-2" />
                          {integration.provider_display}
                        </div>
                      </TableCell>
                      <TableCell>{integration.provider_email}</TableCell>
                      <TableCell>
                        <StatusIndicator
                          status={
                            integration.is_active && !integration.is_token_expired ? 'success' :
                            integration.is_token_expired ? 'error' : 'inactive'
                          }
                          label={
                            integration.is_active && !integration.is_token_expired ? 'Connected' :
                            integration.is_token_expired ? 'Token Expired' : 'Inactive'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={integration.auto_generate_links ? 'success' : 'neutral'}>
                          {integration.auto_generate_links ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Configure
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Webhooks</h2>
              <p className="text-sm text-neutral-600">Send real-time notifications to external services</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowWebhookModal(true)}
              icon={<PlusIcon className="h-4 w-4" />}
            >
              Add Webhook
            </Button>
          </div>

          {webhooksLoading ? (
            <LoadingSpinner />
          ) : webhooks && webhooks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Name</TableCell>
                  <TableCell header>URL</TableCell>
                  <TableCell header>Events</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <LinkIcon className="h-4 w-4 text-neutral-400 mr-2" />
                        {webhook.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-neutral-100 px-2 py-1 rounded">
                        {webhook.webhook_url}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 2).map((event) => (
                          <Badge key={event} variant="neutral" size="sm">
                            {event.replace('_', ' ')}
                          </Badge>
                        ))}
                        {webhook.events.length > 2 && (
                          <Badge variant="neutral" size="sm">
                            +{webhook.events.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusIndicator
                        status={webhook.is_active ? 'success' : 'inactive'}
                        label={webhook.is_active ? 'Active' : 'Inactive'}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => testWebhookMutation.mutate(webhook.id)}
                          loading={testWebhookMutation.isPending}
                        >
                          <PlayIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditWebhook(webhook)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this webhook?')) {
                              deleteWebhookMutation.mutate(webhook.id);
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
              <LinkIcon className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-neutral-900">No webhooks configured</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Add webhooks to receive real-time notifications about booking events.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'logs' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Integration Activity Logs</h2>

          {logsLoading ? (
            <LoadingSpinner />
          ) : logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Type</TableCell>
                  <TableCell header>Integration</TableCell>
                  <TableCell header>Message</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Date</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="neutral">{log.log_type_display}</Badge>
                    </TableCell>
                    <TableCell>{log.integration_type}</TableCell>
                    <TableCell>
                      <p className="text-sm text-neutral-900 max-w-xs truncate">
                        {log.message}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusIndicator
                        status={log.success ? 'success' : 'error'}
                        label={log.success ? 'Success' : 'Failed'}
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(log.created_at), 'MMM d, h:mm a')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-neutral-900">No activity logs</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Integration activity will appear here.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Add/Edit Webhook Modal */}
      <Modal
        isOpen={showWebhookModal}
        onClose={() => {
          setShowWebhookModal(false);
          setEditingWebhook(null);
          webhookForm.reset();
        }}
        title={editingWebhook ? 'Edit Webhook' : 'Add Webhook'}
        size="lg"
      >
        <form onSubmit={webhookForm.handleSubmit(onWebhookSubmit)} className="space-y-4">
          <Input
            label="Name"
            required
            {...webhookForm.register('name')}
            error={webhookForm.formState.errors.name?.message}
            placeholder="My CRM Integration"
          />

          <Input
            label="Webhook URL"
            type="url"
            required
            {...webhookForm.register('webhook_url')}
            error={webhookForm.formState.errors.webhook_url?.message}
            placeholder="https://api.example.com/webhooks/calendly"
          />

          <div>
            <label className="form-label">Events to Send</label>
            <div className="space-y-2 mt-2">
              {WEBHOOK_EVENTS.map((event) => (
                <label key={event.value} className="flex items-center">
                  <input
                    type="checkbox"
                    value={event.value}
                    {...webhookForm.register('events')}
                    className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
                  />
                  <span className="ml-2 text-sm text-neutral-700">{event.label}</span>
                </label>
              ))}
            </div>
            {webhookForm.formState.errors.events && (
              <p className="form-error">{webhookForm.formState.errors.events.message}</p>
            )}
          </div>

          <Input
            label="Secret Key (Optional)"
            type="password"
            {...webhookForm.register('secret_key')}
            error={webhookForm.formState.errors.secret_key?.message}
            help="Used to verify webhook authenticity"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Retries"
              type="number"
              min="1"
              max="10"
              {...webhookForm.register('max_retries', { valueAsNumber: true })}
              error={webhookForm.formState.errors.max_retries?.message}
            />

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...webhookForm.register('is_active')}
                  className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
                />
                <span className="ml-2 text-sm text-neutral-700">Active</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...webhookForm.register('retry_failed')}
                  className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
                />
                <span className="ml-2 text-sm text-neutral-700">Retry Failed Requests</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowWebhookModal(false);
                setEditingWebhook(null);
                webhookForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={editingWebhook ? updateWebhookMutation.isPending : createWebhookMutation.isPending}
            >
              {editingWebhook ? 'Update' : 'Create'} Webhook
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};