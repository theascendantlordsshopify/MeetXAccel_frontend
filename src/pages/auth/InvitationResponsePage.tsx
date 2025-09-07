import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { UserPlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';
import { teamApi } from '../../services/api';

const acceptSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"],
});

type AcceptFormData = z.infer<typeof acceptSchema>;

export const InvitationResponsePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [invitationData, setInvitationData] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const token = searchParams.get('token');

  const form = useForm<AcceptFormData>({
    resolver: zodResolver(acceptSchema),
  });

  const respondMutation = useMutation({
    mutationFn: teamApi.respondToInvitation,
    onSuccess: (response) => {
      setResponseStatus('success');
      if (response.user && response.token) {
        login(response.user, response.token);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    },
    onError: (error: any) => {
      setResponseStatus('error');
    },
  });

  useEffect(() => {
    if (!token) {
      setResponseStatus('error');
      return;
    }

    // For demo purposes, we'll simulate invitation data
    // In real implementation, you'd fetch invitation details
    setInvitationData({
      invited_email: 'user@example.com',
      role_name: 'Team Member',
      invited_by_name: 'John Doe',
      message: 'Welcome to our team!',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    setResponseStatus('form');
  }, [token]);

  const handleAccept = (data?: AcceptFormData) => {
    const payload: any = {
      token,
      action: 'accept',
    };

    if (needsRegistration && data) {
      payload.first_name = data.first_name;
      payload.last_name = data.last_name;
      payload.password = data.password;
      payload.password_confirm = data.password_confirm;
    }

    respondMutation.mutate(payload);
  };

  const handleDecline = () => {
    respondMutation.mutate({
      token,
      action: 'decline',
    });
  };

  if (responseStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (responseStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="h-8 w-8 text-accent-600" />
            </div>
            
            <h2 className="text-2xl font-display font-bold text-neutral-900 mb-4">
              Welcome to the Team!
            </h2>
            
            <p className="text-neutral-600 mb-6">
              You've successfully joined the team. Redirecting to your dashboard...
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (responseStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircleIcon className="h-8 w-8 text-danger-600" />
            </div>
            
            <h2 className="text-2xl font-display font-bold text-neutral-900 mb-4">
              Invalid Invitation
            </h2>
            
            <p className="text-neutral-600 mb-6">
              This invitation link is invalid or has expired.
            </p>
            
            <Link to="/login">
              <Button variant="primary" className="w-full">
                Go to Sign In
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-monkai-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserPlusIcon className="h-8 w-8 text-monkai-600" />
          </div>
          
          <h2 className="text-3xl font-display font-bold text-neutral-900">
            Team Invitation
          </h2>
          
          <p className="mt-2 text-neutral-600">
            You've been invited to join a team
          </p>
        </div>

        <Card className="p-8">
          {invitationData && (
            <div className="bg-monkai-50 border border-monkai-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-monkai-900 mb-2">Invitation Details</h3>
              <div className="space-y-1 text-sm text-monkai-700">
                <p><strong>Email:</strong> {invitationData.invited_email}</p>
                <p><strong>Role:</strong> {invitationData.role_name}</p>
                <p><strong>From:</strong> {invitationData.invited_by_name}</p>
                {invitationData.message && (
                  <p><strong>Message:</strong> "{invitationData.message}"</p>
                )}
              </div>
            </div>
          )}

          {needsRegistration ? (
            <form onSubmit={form.handleSubmit(handleAccept)} className="space-y-6">
              <div className="text-center mb-4">
                <p className="text-sm text-neutral-600">
                  Complete your registration to accept this invitation
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  required
                  {...form.register('first_name')}
                  error={form.formState.errors.first_name?.message}
                />
                
                <Input
                  label="Last Name"
                  required
                  {...form.register('last_name')}
                  error={form.formState.errors.last_name?.message}
                />
              </div>

              <Input
                label="Password"
                type="password"
                required
                {...form.register('password')}
                error={form.formState.errors.password?.message}
                help="Must be at least 8 characters long"
              />

              <Input
                label="Confirm Password"
                type="password"
                required
                {...form.register('password_confirm')}
                error={form.formState.errors.password_confirm?.message}
              />

              <div className="flex space-x-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  loading={respondMutation.isPending}
                >
                  Accept & Join Team
                </Button>
                
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDecline}
                  disabled={respondMutation.isPending}
                >
                  Decline
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-neutral-600 mb-6">
                  Would you like to accept this invitation?
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => handleAccept()}
                  loading={respondMutation.isPending}
                >
                  Accept Invitation
                </Button>
                
                <Button
                  variant="danger"
                  onClick={handleDecline}
                  disabled={respondMutation.isPending}
                >
                  Decline
                </Button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setNeedsRegistration(true)}
                  className="text-sm text-monkai-600 hover:text-monkai-700"
                >
                  Don't have an account? Complete registration →
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};