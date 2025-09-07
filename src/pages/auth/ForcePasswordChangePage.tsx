import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ShieldExclamationIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../services/api';

const schema = z.object({
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  new_password_confirm: z.string(),
}).refine((data) => data.new_password === data.new_password_confirm, {
  message: "Passwords don't match",
  path: ["new_password_confirm"],
});

type FormData = z.infer<typeof schema>;

export const ForcePasswordChangePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuthStore();
  const [changeComplete, setChangeComplete] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: authApi.forcePasswordChange,
    onSuccess: (response) => {
      setChangeComplete(true);
      // Update auth store with new token
      if (user) {
        login({ ...user, account_status: 'active' }, response.token);
      }
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    },
    onError: (error: any) => {
      form.setError('new_password', {
        message: error.response?.data?.error || 'Failed to change password',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data.new_password);
  };

  if (changeComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="h-8 w-8 text-accent-600" />
            </div>
            
            <h2 className="text-2xl font-display font-bold text-neutral-900 mb-4">
              Password Updated!
            </h2>
            
            <p className="text-neutral-600 mb-6">
              Your password has been successfully updated. Your account is now active.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldExclamationIcon className="h-8 w-8 text-warning-600" />
          </div>
          
          <h2 className="text-3xl font-display font-bold text-neutral-900">
            Password Change Required
          </h2>
          
          <p className="mt-2 text-neutral-600">
            Your password has expired. Please set a new password to continue using your account.
          </p>
        </div>

        <Card className="p-8">
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-warning-800">
              <strong>Security Notice:</strong> For your account security, passwords must be changed regularly. 
              Please choose a strong, unique password.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="New Password"
              type="password"
              required
              {...form.register('new_password')}
              error={form.formState.errors.new_password?.message}
              help="Must be at least 8 characters with uppercase, lowercase, number, and special character"
            />

            <Input
              label="Confirm New Password"
              type="password"
              required
              {...form.register('new_password_confirm')}
              error={form.formState.errors.new_password_confirm?.message}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={mutation.isPending}
            >
              Update Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};