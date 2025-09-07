import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../services/api';

const schema = z.object({
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  new_password_confirm: z.string(),
}).refine((data) => data.new_password === data.new_password_confirm, {
  message: "Passwords don't match",
  path: ["new_password_confirm"],
});

type FormData = z.infer<typeof schema>;

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [resetComplete, setResetComplete] = useState(false);
  const token = searchParams.get('token');
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => authApi.confirmPasswordReset(token!, data.new_password),
    onSuccess: () => {
      setResetComplete(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    },
    onError: (error: any) => {
      form.setError('new_password', {
        message: error.response?.data?.error || 'Failed to reset password',
      });
    },
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  if (resetComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="h-8 w-8 text-accent-600" />
            </div>
            
            <h2 className="text-2xl font-display font-bold text-neutral-900 mb-4">
              Password Reset Complete
            </h2>
            
            <p className="text-neutral-600 mb-6">
              Your password has been successfully reset. You'll be redirected to the login page shortly.
            </p>
            
            <Link to="/login">
              <Button variant="primary" className="w-full">
                Continue to Sign In
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
            <KeyIcon className="h-8 w-8 text-monkai-600" />
          </div>
          
          <h2 className="text-3xl font-display font-bold text-neutral-900">
            Reset Password
          </h2>
          
          <p className="mt-2 text-neutral-600">
            Enter your new password below.
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="New Password"
              type="password"
              required
              {...form.register('new_password')}
              error={form.formState.errors.new_password?.message}
              help="Must be at least 8 characters long"
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
              Reset Password
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-monkai-600 hover:text-monkai-700"
            >
              Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};