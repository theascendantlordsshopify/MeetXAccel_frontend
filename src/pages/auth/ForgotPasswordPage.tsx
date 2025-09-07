import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../services/api';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export const ForgotPasswordPage: React.FC = () => {
  const [emailSent, setEmailSent] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: authApi.requestPasswordReset,
    onSuccess: () => {
      setEmailSent(true);
    },
    onError: (error: any) => {
      form.setError('email', {
        message: error.response?.data?.error || 'Failed to send reset email',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data.email);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <EnvelopeIcon className="h-8 w-8 text-accent-600" />
            </div>
            
            <h2 className="text-2xl font-display font-bold text-neutral-900 mb-4">
              Check Your Email
            </h2>
            
            <p className="text-neutral-600 mb-6">
              If an account with that email exists, we've sent you a password reset link.
            </p>
            
            <div className="space-y-4">
              <Link to="/login">
                <Button variant="primary" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
              
              <button
                onClick={() => setEmailSent(false)}
                className="text-sm text-monkai-600 hover:text-monkai-700"
              >
                Try a different email
              </button>
            </div>
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
            <EnvelopeIcon className="h-8 w-8 text-monkai-600" />
          </div>
          
          <h2 className="text-3xl font-display font-bold text-neutral-900">
            Forgot Password?
          </h2>
          
          <p className="mt-2 text-neutral-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              required
              icon={<EnvelopeIcon className="h-5 w-5" />}
              {...form.register('email')}
              error={form.formState.errors.email?.message}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={mutation.isPending}
            >
              Send Reset Link
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-monkai-600 hover:text-monkai-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};