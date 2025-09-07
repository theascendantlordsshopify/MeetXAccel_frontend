import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  UserPlusIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { teamApi } from '../../services/api';
import { format } from 'date-fns';

const invitationSchema = z.object({
  invited_email: z.string().email('Please enter a valid email address'),
  role: z.string().min(1, 'Please select a role'),
  message: z.string().optional(),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

export const TeamManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('invitations');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const invitationForm = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
  });

  // Queries
  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: teamApi.getInvitations,
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: teamApi.getRoles,
  });

  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: teamApi.getPermissions,
  });

  // Mutations
  const sendInvitationMutation = useMutation({
    mutationFn: teamApi.sendInvitation,
    onSuccess: () => {
      toast.success('Invitation sent successfully');
      setShowInviteModal(false);
      invitationForm.reset();
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send invitation');
    },
  });

  const onInvitationSubmit = (data: InvitationFormData) => {
    sendInvitationMutation.mutate(data);
  };

  const tabs = [
    { id: 'invitations', name: 'Team Invitations', icon: UserPlusIcon },
    { id: 'roles', name: 'Roles', icon: ShieldCheckIcon },
    { id: 'permissions', name: 'Permissions', icon: KeyIcon },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Team Management</h1>
          <p className="text-neutral-600">Manage your team members, roles, and permissions</p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => setShowInviteModal(true)}
          icon={<UserPlusIcon className="h-4 w-4" />}
        >
          Invite Team Member
        </Button>
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

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">Team Invitations</h2>
          </div>

          {invitationsLoading ? (
            <LoadingSpinner />
          ) : invitations && invitations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Email</TableCell>
                  <TableCell header>Role</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Invited By</TableCell>
                  <TableCell header>Date</TableCell>
                  <TableCell header>Expires</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 text-neutral-400 mr-2" />
                        {invitation.invited_email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{invitation.role_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invitation.status === 'accepted' ? 'success' :
                          invitation.status === 'declined' ? 'danger' :
                          invitation.status === 'expired' ? 'neutral' : 'warning'
                        }
                      >
                        {invitation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{invitation.invited_by_name}</TableCell>
                    <TableCell>
                      {format(new Date(invitation.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invitation.expires_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <UserPlusIcon className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-neutral-900">No invitations sent</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Start by inviting team members to collaborate.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Roles</h2>

          {rolesLoading ? (
            <LoadingSpinner />
          ) : roles && roles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Name</TableCell>
                  <TableCell header>Type</TableCell>
                  <TableCell header>Description</TableCell>
                  <TableCell header>Permissions</TableCell>
                  <TableCell header>System Role</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <ShieldCheckIcon className="h-4 w-4 text-neutral-400 mr-2" />
                        {role.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{role.role_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-neutral-600 max-w-xs truncate">
                        {role.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-neutral-600">
                        {role.total_permissions} permissions
                      </span>
                    </TableCell>
                    <TableCell>
                      {role.is_system_role && (
                        <Badge variant="primary" size="sm">System</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <ShieldCheckIcon className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-neutral-900">No roles found</h3>
            </div>
          )}
        </Card>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Permissions</h2>

          {permissionsLoading ? (
            <LoadingSpinner />
          ) : permissions && permissions.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(
                permissions.reduce((acc, permission) => {
                  const category = permission.category || 'general';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(permission);
                  return acc;
                }, {} as Record<string, typeof permissions>)
              ).map(([category, categoryPermissions]) => (
                <div key={category}>
                  <h3 className="text-md font-medium text-neutral-900 mb-3 capitalize">
                    {category.replace('_', ' ')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryPermissions.map((permission) => (
                      <div key={permission.id} className="border border-neutral-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <KeyIcon className="h-4 w-4 text-neutral-400 mr-2 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-neutral-900">
                              {permission.name}
                            </h4>
                            <p className="text-xs text-neutral-500 mt-1">
                              {permission.description}
                            </p>
                            <code className="text-xs text-monkai-600 bg-monkai-50 px-1 py-0.5 rounded mt-1 inline-block">
                              {permission.codename}
                            </code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <KeyIcon className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-neutral-900">No permissions found</h3>
            </div>
          )}
        </Card>
      )}

      {/* Invite Team Member Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
      >
        <form onSubmit={invitationForm.handleSubmit(onInvitationSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            icon={<EnvelopeIcon className="h-5 w-5" />}
            {...invitationForm.register('invited_email')}
            error={invitationForm.formState.errors.invited_email?.message}
          />

          <div>
            <label className="form-label">Role</label>
            <select
              {...invitationForm.register('role')}
              className="input"
              required
            >
              <option value="">Select a role</option>
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} - {role.role_type}
                </option>
              ))}
            </select>
            {invitationForm.formState.errors.role && (
              <p className="form-error">{invitationForm.formState.errors.role.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Personal Message (Optional)</label>
            <textarea
              {...invitationForm.register('message')}
              rows={3}
              className="input"
              placeholder="Add a personal message to the invitation..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowInviteModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={sendInvitationMutation.isPending}
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};