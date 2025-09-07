import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  UserIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusIndicator } from '../../components/ui/StatusIndicator';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { useAuthStore } from '../../stores/authStore';
import { profileApi, authApi, sessionApi, mfaApi, auditApi } from '../../services/api';
import { formatDistanceToNow, format } from 'date-fns';

const profileSchema = z.object({
  display_name: z.string().min(1, 'Display name is required'),
  bio: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  company: z.string().optional(),
  job_title: z.string().optional(),
  timezone_name: z.string().min(1, 'Timezone is required'),
  language: z.string().min(1, 'Language is required'),
  brand_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  public_profile: z.boolean(),
  show_phone: z.boolean(),
  show_email: z.boolean(),
  reasonable_hours_start: z.number().min(0).max(23),
  reasonable_hours_end: z.number().min(1).max(24),
});

const passwordSchema = z.object({
  old_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  new_password_confirm: z.string(),
}).refine((data) => data.new_password === data.new_password_confirm, {
  message: "Passwords don't match",
  path: ["new_password_confirm"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<any>(null);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: user?.profile,
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Queries
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: sessionApi.getSessions,
    enabled: activeTab === 'security',
  });

  const { data: mfaDevices, isLoading: mfaLoading } = useQuery({
    queryKey: ['mfa-devices'],
    queryFn: mfaApi.getDevices,
    enabled: activeTab === 'security',
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: auditApi.getUserLogs,
    enabled: activeTab === 'audit',
  });

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: profileApi.update,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast.success('Profile updated successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully');
      passwordForm.reset();
      setShowPasswordForm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to change password');
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: sessionApi.revokeSession,
    onSuccess: () => {
      toast.success('Session revoked successfully');
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    },
    onError: () => {
      toast.error('Failed to revoke session');
    },
  });

  const revokeAllSessionsMutation = useMutation({
    mutationFn: sessionApi.revokeAllSessions,
    onSuccess: () => {
      toast.success('All other sessions revoked successfully');
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    },
    onError: () => {
      toast.error('Failed to revoke sessions');
    },
  });

  const setupMFAMutation = useMutation({
    mutationFn: mfaApi.setupMFA,
    onSuccess: (data) => {
      setMfaSetupData(data);
      setShowMFASetup(true);
    },
    onError: () => {
      toast.error('Failed to setup MFA');
    },
  });

  const verifyMFAMutation = useMutation({
    mutationFn: mfaApi.verifyMFASetup,
    onSuccess: (data) => {
      toast.success('MFA enabled successfully');
      setShowMFASetup(false);
      setMfaSetupData(null);
      queryClient.invalidateQueries({ queryKey: ['mfa-devices'] });
      // Show backup codes
      if (data.backup_codes) {
        // TODO: Show backup codes modal
      }
    },
    onError: () => {
      toast.error('Invalid verification code');
    },
  });

  const disableMFAMutation = useMutation({
    mutationFn: mfaApi.disableMFA,
    onSuccess: () => {
      toast.success('MFA disabled successfully');
      queryClient.invalidateQueries({ queryKey: ['mfa-devices'] });
    },
    onError: () => {
      toast.error('Failed to disable MFA');
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'audit', name: 'Audit Logs', icon: ComputerDesktopIcon },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Profile Information</h2>
            
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Display Name"
                  required
                  {...profileForm.register('display_name')}
                  error={profileForm.formState.errors.display_name?.message}
                />
                
                <Input
                  label="Company"
                  {...profileForm.register('company')}
                  error={profileForm.formState.errors.company?.message}
                />
                
                <Input
                  label="Job Title"
                  {...profileForm.register('job_title')}
                  error={profileForm.formState.errors.job_title?.message}
                />
                
                <Input
                  label="Phone"
                  type="tel"
                  {...profileForm.register('phone')}
                  error={profileForm.formState.errors.phone?.message}
                />
                
                <Input
                  label="Website"
                  type="url"
                  {...profileForm.register('website')}
                  error={profileForm.formState.errors.website?.message}
                />
                
                <div>
                  <label className="form-label">Timezone</label>
                  <select
                    {...profileForm.register('timezone_name')}
                    className="input"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Bio</label>
                <textarea
                  {...profileForm.register('bio')}
                  rows={4}
                  className="input"
                  placeholder="Tell people a bit about yourself..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Brand Color"
                  type="color"
                  {...profileForm.register('brand_color')}
                  error={profileForm.formState.errors.brand_color?.message}
                />
                
                <div>
                  <label className="form-label">Language</label>
                  <select
                    {...profileForm.register('language')}
                    className="input"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-md font-medium text-neutral-900">Privacy Settings</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...profileForm.register('public_profile')}
                      className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Make profile public</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...profileForm.register('show_email')}
                      className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Show email on public profile</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...profileForm.register('show_phone')}
                      className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Show phone on public profile</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={updateProfileMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Password Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Password</h2>
                <p className="text-sm text-neutral-600">Manage your account password</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowPasswordForm(true)}
              >
                <KeyIcon className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </div>
          </Card>

          {/* MFA Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Multi-Factor Authentication</h2>
                <p className="text-sm text-neutral-600">Add an extra layer of security to your account</p>
              </div>
              <StatusIndicator
                status={user?.is_mfa_enabled ? 'success' : 'inactive'}
                label={user?.is_mfa_enabled ? 'Enabled' : 'Disabled'}
              />
            </div>

            {mfaLoading ? (
              <LoadingSpinner />
            ) : user?.is_mfa_enabled ? (
              <div className="space-y-4">
                <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
                  <p className="text-sm text-accent-800">
                    MFA is enabled for your account. Your account is protected with two-factor authentication.
                  </p>
                </div>
                
                {mfaDevices && mfaDevices.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 mb-3">Registered Devices</h3>
                    <div className="space-y-2">
                      {mfaDevices.map((device) => (
                        <div key={device.id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg">
                          <div className="flex items-center">
                            <DevicePhoneMobileIcon className="h-5 w-5 text-neutral-400 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{device.name}</p>
                              <p className="text-xs text-neutral-500">{device.device_type_display}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {device.is_primary && (
                              <Badge variant="primary" size="sm">Primary</Badge>
                            )}
                            <StatusIndicator
                              status={device.is_active ? 'success' : 'inactive'}
                              size="sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const password = prompt('Enter your password to disable MFA:');
                      if (password) {
                        disableMFAMutation.mutate(password);
                      }
                    }}
                  >
                    Disable MFA
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const password = prompt('Enter your password to regenerate backup codes:');
                      if (password) {
                        // TODO: Implement regenerate backup codes
                      }
                    }}
                  >
                    Regenerate Backup Codes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                  <p className="text-sm text-warning-800">
                    MFA is not enabled. Enable two-factor authentication to secure your account.
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setupMFAMutation.mutate({
                        device_type: 'totp',
                        device_name: 'Authenticator App',
                      });
                    }}
                  >
                    <ShieldCheckIcon className="h-4 w-4 mr-2" />
                    Enable MFA
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Active Sessions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Active Sessions</h2>
                <p className="text-sm text-neutral-600">Manage your active login sessions</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => revokeAllSessionsMutation.mutate()}
                disabled={revokeAllSessionsMutation.isPending}
              >
                Revoke All Others
              </Button>
            </div>

            {sessionsLoading ? (
              <LoadingSpinner />
            ) : sessions && sessions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>Device</TableCell>
                    <TableCell header>Location</TableCell>
                    <TableCell header>Last Activity</TableCell>
                    <TableCell header>Status</TableCell>
                    <TableCell header>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <ComputerDesktopIcon className="h-5 w-5 text-neutral-400 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {session.device_info?.browser || 'Unknown Browser'}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {session.device_info?.os || 'Unknown OS'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-neutral-900">{session.location || 'Unknown'}</p>
                          <p className="text-xs text-neutral-500">{session.ip_address}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-neutral-900">
                            {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true })}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {format(new Date(session.last_activity), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <StatusIndicator
                            status={session.is_active && !session.is_expired ? 'success' : 'inactive'}
                            size="sm"
                          />
                          {session.is_current && (
                            <Badge variant="primary" size="sm">Current</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {!session.is_current && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => revokeSessionMutation.mutate(session.id)}
                            disabled={revokeSessionMutation.isPending}
                          >
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <ComputerDesktopIcon className="mx-auto h-12 w-12 text-neutral-400" />
                <h3 className="mt-2 text-sm font-medium text-neutral-900">No active sessions</h3>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Audit Logs</h2>
          
          {auditLoading ? (
            <LoadingSpinner />
          ) : auditLogs && auditLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Action</TableCell>
                  <TableCell header>Description</TableCell>
                  <TableCell header>IP Address</TableCell>
                  <TableCell header>Date</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="neutral">{log.action_display}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-neutral-900">{log.description}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-neutral-600">{log.ip_address || 'N/A'}</p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-neutral-900">
                          {format(new Date(log.created_at), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {format(new Date(log.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <ComputerDesktopIcon className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-neutral-900">No audit logs</h3>
            </div>
          )}
        </Card>
      )}

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordForm}
        onClose={() => setShowPasswordForm(false)}
        title="Change Password"
      >
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            required
            {...passwordForm.register('old_password')}
            error={passwordForm.formState.errors.old_password?.message}
          />
          
          <Input
            label="New Password"
            type="password"
            required
            {...passwordForm.register('new_password')}
            error={passwordForm.formState.errors.new_password?.message}
            help="Must be at least 8 characters long"
          />
          
          <Input
            label="Confirm New Password"
            type="password"
            required
            {...passwordForm.register('new_password_confirm')}
            error={passwordForm.formState.errors.new_password_confirm?.message}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPasswordForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={changePasswordMutation.isPending}
            >
              Change Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* MFA Setup Modal */}
      <Modal
        isOpen={showMFASetup}
        onClose={() => setShowMFASetup(false)}
        title="Setup Multi-Factor Authentication"
        size="md"
      >
        {mfaSetupData && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-neutral-600 mb-4">
                Scan this QR code with your authenticator app:
              </p>
              {mfaSetupData.qr_code && (
                <img
                  src={mfaSetupData.qr_code}
                  alt="MFA QR Code"
                  className="mx-auto border border-neutral-200 rounded-lg"
                />
              )}
            </div>
            
            <div>
              <label className="form-label">Manual Entry Key</label>
              <div className="flex">
                <input
                  type="text"
                  value={mfaSetupData.manual_entry_key || ''}
                  readOnly
                  className="input flex-1 font-mono text-xs"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="ml-2"
                  onClick={() => {
                    navigator.clipboard.writeText(mfaSetupData.manual_entry_key);
                    toast.success('Copied to clipboard');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const token = formData.get('token') as string;
                if (token) {
                  verifyMFAMutation.mutate(token);
                }
              }}
              className="space-y-4"
            >
              <Input
                label="Verification Code"
                name="token"
                placeholder="Enter 6-digit code"
                required
                maxLength={6}
                help="Enter the 6-digit code from your authenticator app"
              />
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowMFASetup(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={verifyMFAMutation.isPending}
                >
                  Verify & Enable
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};