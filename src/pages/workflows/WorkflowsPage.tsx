import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { StatusIndicator } from '../../components/ui/StatusIndicator';
import { workflowsApi } from '../../services/api';
import { format } from 'date-fns';

export const WorkflowsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Queries
  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsApi.list,
  });

  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ['workflow-executions'],
    queryFn: workflowsApi.getExecutions,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['workflow-stats'],
    queryFn: workflowsApi.getPerformanceStats,
  });

  // Mutations
  const deleteWorkflowMutation = useMutation({
    mutationFn: workflowsApi.delete,
    onSuccess: () => {
      toast.success('Workflow deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: () => {
      toast.error('Failed to delete workflow');
    },
  });

  const duplicateWorkflowMutation = useMutation({
    mutationFn: workflowsApi.duplicate,
    onSuccess: () => {
      toast.success('Workflow duplicated successfully');
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: () => {
      toast.error('Failed to duplicate workflow');
    },
  });

  const testWorkflowMutation = useMutation({
    mutationFn: ({ id, testData }: { id: string; testData: any }) =>
      workflowsApi.test(id, testData),
    onSuccess: () => {
      toast.success('Workflow test initiated');
    },
    onError: () => {
      toast.error('Failed to test workflow');
    },
  });

  const validateWorkflowMutation = useMutation({
    mutationFn: workflowsApi.validate,
    onSuccess: (result) => {
      if (result.valid) {
        toast.success('Workflow validation passed');
      } else {
        toast.error(`Validation failed: ${result.errors.join(', ')}`);
      }
    },
    onError: () => {
      toast.error('Failed to validate workflow');
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Workflows</h1>
          <p className="text-neutral-600">Automate your booking processes with custom workflows</p>
        </div>
        
        <Link to="/dashboard/workflows/new">
          <Button
            variant="primary"
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Create Workflow
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-monkai-100 rounded-lg">
              <WrenchScrewdriverIcon className="h-6 w-6 text-monkai-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Total Workflows</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.total_workflows || 0}
              </p>
              <p className="text-xs text-monkai-600">
                {stats?.active_workflows || 0} active
              </p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-accent-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-accent-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Success Rate</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.execution_stats_30_days?.success_rate || 0}%
              </p>
              <p className="text-xs text-accent-600">last 30 days</p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-warning-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Executions</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.execution_stats_30_days?.total_executions || 0}
              </p>
              <p className="text-xs text-warning-600">this month</p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-danger-100 rounded-lg">
              <XCircleIcon className="h-6 w-6 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Failed</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.execution_stats_30_days?.failed_executions || 0}
              </p>
              <p className="text-xs text-danger-600">this month</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Workflows List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-neutral-900">Your Workflows</h2>
        </div>

        {workflowsLoading ? (
          <LoadingSpinner />
        ) : workflows && workflows.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Name</TableCell>
                <TableCell header>Trigger</TableCell>
                <TableCell header>Actions</TableCell>
                <TableCell header>Success Rate</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Last Run</TableCell>
                <TableCell header>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-neutral-900">{workflow.name}</p>
                      {workflow.description && (
                        <p className="text-sm text-neutral-500 max-w-xs truncate">
                          {workflow.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{workflow.trigger_display}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-neutral-600">
                      {workflow.actions?.length || 0} actions
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-full bg-neutral-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-accent-600 h-2 rounded-full"
                          style={{ width: `${workflow.success_rate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-neutral-900">
                        {workflow.success_rate}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusIndicator
                      status={workflow.is_active ? 'success' : 'inactive'}
                      label={workflow.is_active ? 'Active' : 'Inactive'}
                    />
                  </TableCell>
                  <TableCell>
                    {workflow.execution_stats.last_executed_at ? (
                      <div>
                        <p className="text-sm text-neutral-900">
                          {format(new Date(workflow.execution_stats.last_executed_at), 'MMM d')}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {format(new Date(workflow.execution_stats.last_executed_at), 'h:mm a')}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-neutral-500">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => testWorkflowMutation.mutate({
                          id: workflow.id,
                          testData: { test_type: 'mock_data' }
                        })}
                        loading={testWorkflowMutation.isPending}
                        title="Test Workflow"
                      >
                        <PlayIcon className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => validateWorkflowMutation.mutate(workflow.id)}
                        loading={validateWorkflowMutation.isPending}
                        title="Validate Workflow"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </Button>
                      
                      <Link to={`/dashboard/workflows/${workflow.id}`}>
                        <Button variant="ghost" size="sm" title="Edit Workflow">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateWorkflowMutation.mutate(workflow.id)}
                        loading={duplicateWorkflowMutation.isPending}
                        title="Duplicate Workflow"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this workflow?')) {
                            deleteWorkflowMutation.mutate(workflow.id);
                          }
                        }}
                        title="Delete Workflow"
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
            <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-2 text-sm font-medium text-neutral-900">No workflows created</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Create your first workflow to automate your booking processes.
            </p>
            <div className="mt-6">
              <Link to="/dashboard/workflows/new">
                <Button variant="primary">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Your First Workflow
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>

      {/* Recent Executions */}
      {executions && executions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">Recent Executions</h2>
            <Link to="/dashboard/workflows/executions">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Workflow</TableCell>
                <TableCell header>Booking</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Actions</TableCell>
                <TableCell header>Duration</TableCell>
                <TableCell header>Date</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.slice(0, 10).map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell>
                    <p className="font-medium text-neutral-900">{execution.workflow_name}</p>
                  </TableCell>
                  <TableCell>
                    {execution.booking_invitee ? (
                      <p className="text-sm text-neutral-600">{execution.booking_invitee}</p>
                    ) : (
                      <Badge variant="neutral" size="sm">Test</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusIndicator
                      status={
                        execution.status === 'completed' ? 'success' :
                        execution.status === 'failed' ? 'error' :
                        execution.status === 'running' ? 'warning' : 'inactive'
                      }
                      label={execution.status_display}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-neutral-600">
                      {execution.actions_executed} / {execution.actions_executed + execution.actions_failed}
                      {execution.actions_failed > 0 && (
                        <span className="text-danger-600 ml-1">
                          ({execution.actions_failed} failed)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {execution.execution_time_seconds ? (
                      <span className="text-sm text-neutral-600">
                        {execution.execution_time_seconds}s
                      </span>
                    ) : (
                      <span className="text-sm text-neutral-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-neutral-900">
                        {format(new Date(execution.created_at), 'MMM d')}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {format(new Date(execution.created_at), 'h:mm a')}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};