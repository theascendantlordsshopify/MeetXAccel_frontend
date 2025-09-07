import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ClockIcon,
  CalendarDaysIcon,
  NoSymbolIcon,
  CogIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { StatusIndicator } from '../../components/ui/StatusIndicator';
import { availabilityApi } from '../../services/api';
import { format } from 'date-fns';

const ruleSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  is_active: z.boolean(),
});

const overrideSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  is_available: z.boolean(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  reason: z.string().optional(),
  is_active: z.boolean(),
});

const blockedTimeSchema = z.object({
  start_datetime: z.string().min(1, 'Start time is required'),
  end_datetime: z.string().min(1, 'End time is required'),
  reason: z.string().optional(),
  is_active: z.boolean(),
});

const recurringBlockSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_active: z.boolean(),
});

const bufferSchema = z.object({
  default_buffer_before: z.number().min(0).max(120),
  default_buffer_after: z.number().min(0).max(120),
  minimum_gap: z.number().min(0).max(60),
  slot_interval_minutes: z.number().min(5).max(60),
});

type RuleFormData = z.infer<typeof ruleSchema>;
type OverrideFormData = z.infer<typeof overrideSchema>;
type BlockedTimeFormData = z.infer<typeof blockedTimeSchema>;
type RecurringBlockFormData = z.infer<typeof recurringBlockSchema>;
type BufferFormData = z.infer<typeof bufferSchema>;

const WEEKDAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export const AvailabilityPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('rules');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Forms
  const ruleForm = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: { is_active: true },
  });

  const overrideForm = useForm<OverrideFormData>({
    resolver: zodResolver(overrideSchema),
    defaultValues: { is_available: true, is_active: true },
  });

  const blockedForm = useForm<BlockedTimeFormData>({
    resolver: zodResolver(blockedTimeSchema),
    defaultValues: { is_active: true },
  });

  const recurringForm = useForm<RecurringBlockFormData>({
    resolver: zodResolver(recurringBlockSchema),
    defaultValues: { is_active: true },
  });

  const bufferForm = useForm<BufferFormData>({
    resolver: zodResolver(bufferSchema),
  });

  // Queries
  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['availability-rules'],
    queryFn: availabilityApi.getRules,
  });

  const { data: overrides, isLoading: overridesLoading } = useQuery({
    queryKey: ['date-overrides'],
    queryFn: availabilityApi.getOverrides,
  });

  const { data: blockedTimes, isLoading: blockedLoading } = useQuery({
    queryKey: ['blocked-times'],
    queryFn: availabilityApi.getBlockedTimes,
  });

  const { data: recurringBlocks, isLoading: recurringLoading } = useQuery({
    queryKey: ['recurring-blocks'],
    queryFn: availabilityApi.getRecurringBlocks,
  });

  const { data: bufferSettings, isLoading: bufferLoading } = useQuery({
    queryKey: ['buffer-settings'],
    queryFn: availabilityApi.getBufferSettings,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['availability-stats'],
    queryFn: availabilityApi.getStats,
  });

  // Mutations
  const createRuleMutation = useMutation({
    mutationFn: availabilityApi.createRule,
    onSuccess: () => {
      toast.success('Availability rule created');
      setShowRuleModal(false);
      ruleForm.reset();
      queryClient.invalidateQueries({ queryKey: ['availability-rules'] });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RuleFormData> }) =>
      availabilityApi.updateRule(id, data),
    onSuccess: () => {
      toast.success('Availability rule updated');
      setShowRuleModal(false);
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ['availability-rules'] });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: availabilityApi.deleteRule,
    onSuccess: () => {
      toast.success('Availability rule deleted');
      queryClient.invalidateQueries({ queryKey: ['availability-rules'] });
    },
  });

  const updateBufferMutation = useMutation({
    mutationFn: availabilityApi.updateBufferSettings,
    onSuccess: () => {
      toast.success('Buffer settings updated');
      queryClient.invalidateQueries({ queryKey: ['buffer-settings'] });
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: availabilityApi.clearCache,
    onSuccess: () => {
      toast.success('Cache cleared successfully');
    },
  });

  const precomputeCacheMutation = useMutation({
    mutationFn: () => availabilityApi.precomputeCache(14),
    onSuccess: () => {
      toast.success('Cache precomputation started');
    },
  });

  const tabs = [
    { id: 'rules', name: 'Weekly Hours', icon: ClockIcon },
    { id: 'overrides', name: 'Date Overrides', icon: CalendarDaysIcon },
    { id: 'blocked', name: 'Blocked Times', icon: NoSymbolIcon },
    { id: 'recurring', name: 'Recurring Blocks', icon: NoSymbolIcon },
    { id: 'buffer', name: 'Buffer Settings', icon: CogIcon },
  ];

  const openEditModal = (type: string, item: any) => {
    setEditingItem(item);
    
    if (type === 'rule') {
      ruleForm.reset(item);
      setShowRuleModal(true);
    } else if (type === 'override') {
      overrideForm.reset(item);
      setShowOverrideModal(true);
    } else if (type === 'blocked') {
      blockedForm.reset(item);
      setShowBlockedModal(true);
    } else if (type === 'recurring') {
      recurringForm.reset(item);
      setShowRecurringModal(true);
    }
  };

  const onRuleSubmit = (data: RuleFormData) => {
    if (editingItem) {
      updateRuleMutation.mutate({ id: editingItem.id, data });
    } else {
      createRuleMutation.mutate(data);
    }
  };

  const onBufferSubmit = (data: BufferFormData) => {
    updateBufferMutation.mutate(data);
  };

  return (
    <div className="space-y-8">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-monkai-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-monkai-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Weekly Hours</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.average_weekly_hours || 0}h
              </p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-accent-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-accent-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Active Rules</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.active_rules || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-warning-100 rounded-lg">
              <NoSymbolIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Blocked Times</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.total_blocks || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-danger-100 rounded-lg">
              <CogIcon className="h-6 w-6 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Cache Hit Rate</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.cache_hit_rate || 0}%
              </p>
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

      {/* Weekly Hours Tab */}
      {activeTab === 'rules' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Weekly Availability</h2>
              <p className="text-sm text-neutral-600">Set your regular weekly availability hours</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowRuleModal(true)}
              icon={<PlusIcon className="h-4 w-4" />}
            >
              Add Hours
            </Button>
          </div>

          {rulesLoading ? (
            <LoadingSpinner />
          ) : rules && rules.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Day</TableCell>
                  <TableCell header>Time Range</TableCell>
                  <TableCell header>Event Types</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <span className="font-medium">{rule.day_of_week_display}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 text-neutral-400 mr-2" />
                        {rule.start_time} - {rule.end_time}
                        {rule.spans_midnight && (
                          <Badge variant="warning" size="sm" className="ml-2">
                            Spans Midnight
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-neutral-600">
                        {rule.event_types_count > 0 ? `${rule.event_types_count} specific` : 'All event types'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusIndicator
                        status={rule.is_active ? 'success' : 'inactive'}
                        label={rule.is_active ? 'Active' : 'Inactive'}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal('rule', rule)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this rule?')) {
                              deleteRuleMutation.mutate(rule.id);
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
              <ClockIcon className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-neutral-900">No availability rules</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Add your weekly availability to start accepting bookings.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Buffer Settings Tab */}
      {activeTab === 'buffer' && (
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">Buffer Time Settings</h2>
            <p className="text-sm text-neutral-600">Configure default buffer times and slot intervals</p>
          </div>

          {bufferLoading ? (
            <LoadingSpinner />
          ) : bufferSettings ? (
            <form onSubmit={bufferForm.handleSubmit(onBufferSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Buffer Before (minutes)"
                  type="number"
                  min="0"
                  max="120"
                  {...bufferForm.register('default_buffer_before', { valueAsNumber: true })}
                  error={bufferForm.formState.errors.default_buffer_before?.message}
                  help="Time to block before each meeting"
                />

                <Input
                  label="Buffer After (minutes)"
                  type="number"
                  min="0"
                  max="120"
                  {...bufferForm.register('default_buffer_after', { valueAsNumber: true })}
                  error={bufferForm.formState.errors.default_buffer_after?.message}
                  help="Time to block after each meeting"
                />

                <Input
                  label="Minimum Gap (minutes)"
                  type="number"
                  min="0"
                  max="60"
                  {...bufferForm.register('minimum_gap', { valueAsNumber: true })}
                  error={bufferForm.formState.errors.minimum_gap?.message}
                  help="Minimum time between bookings"
                />

                <Input
                  label="Slot Interval (minutes)"
                  type="number"
                  min="5"
                  max="60"
                  {...bufferForm.register('slot_interval_minutes', { valueAsNumber: true })}
                  error={bufferForm.formState.errors.slot_interval_minutes?.message}
                  help="Time between available slots"
                />
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-neutral-200">
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => clearCacheMutation.mutate()}
                    loading={clearCacheMutation.isPending}
                  >
                    Clear Cache
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => precomputeCacheMutation.mutate()}
                    loading={precomputeCacheMutation.isPending}
                  >
                    Precompute Cache
                  </Button>
                </div>

                <Button
                  type="submit"
                  loading={updateBufferMutation.isPending}
                >
                  Save Settings
                </Button>
              </div>
            </form>
          ) : null}
        </Card>
      )}

      {/* Add/Edit Rule Modal */}
      <Modal
        isOpen={showRuleModal}
        onClose={() => {
          setShowRuleModal(false);
          setEditingItem(null);
          ruleForm.reset();
        }}
        title={editingItem ? 'Edit Availability Rule' : 'Add Availability Rule'}
      >
        <form onSubmit={ruleForm.handleSubmit(onRuleSubmit)} className="space-y-4">
          <div>
            <label className="form-label">Day of Week</label>
            <select
              {...ruleForm.register('day_of_week', { valueAsNumber: true })}
              className="input"
              required
            >
              <option value="">Select a day</option>
              {WEEKDAYS.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              required
              {...ruleForm.register('start_time')}
              error={ruleForm.formState.errors.start_time?.message}
            />

            <Input
              label="End Time"
              type="time"
              required
              {...ruleForm.register('end_time')}
              error={ruleForm.formState.errors.end_time?.message}
            />
          </div>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...ruleForm.register('is_active')}
              className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
            />
            <span className="ml-2 text-sm text-neutral-700">Active</span>
          </label>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowRuleModal(false);
                setEditingItem(null);
                ruleForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={editingItem ? updateRuleMutation.isPending : createRuleMutation.isPending}
            >
              {editingItem ? 'Update' : 'Create'} Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};