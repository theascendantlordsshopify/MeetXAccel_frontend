import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CheckCircleIcon, XCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { authApi } from '../../services/api';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const token = searchParams.get('token');

  const verifyMutation = useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: () => {
      setVerificationStatus('success');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    },
    onError: (error: any) => {
      setVerificationStatus('error');
      setErrorMessage(error.response?.data?.error || 'Verification failed');
    },
  });

  const resendMutation = useMutation({
    mutationFn: authApi.resendVerification,
    onSuccess: () => {
      // Show success message
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.error || 'Failed to resend verification');
    },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate(token);
    } else {
      setVerificationStatus('error');
      setErrorMessage('Invalid verification link');
    }
  }, [token]);

  const handleResendVerification = () => {
    const email = prompt('Enter your email address:');
    if (email) {
      resendMutation.mutate(email);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="p-8 text-center">
          {verificationStatus === 'loading' && (
            <>
              <LoadingSpinner size="lg" className="mb-6" />
              <h2 className="text-2xl font-display font-bold text-neutral-900 mb-4">
                Verifying Email
              </h2>
              <p className="text-neutral-600">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {verificationStatus === 'success' && (
            <>
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="h-8 w-8 text-accent-600" />
              </div>
              
              <h2 className="text-2xl font-display font-bold text-neutral-900 mb-4">
                Email Verified!
              </h2>
              
              <p className="text-neutral-600 mb-6">
                Your email has been successfully verified. You can now sign in to your account.
              </p>
              
              <Link to="/login">
                <Button variant="primary" className="w-full">
                  Continue to Sign In
                </Button>
              </Link>
            </>
          )}

          {verificationStatus === 'error' && (
            <>
              <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircleIcon className="h-8 w-8 text-danger-600" />
              </div>
              
              <h2 className="text-2xl font-display font-bold text-neutral-900 mb-4">
                Verification Failed
              </h2>
              
              <p className="text-neutral-600 mb-6">
                {errorMessage}
              </p>
              
              <div className="space-y-4">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleResendVerification}
                  loading={resendMutation.isPending}
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </Button>
                
                <Link to="/login">
                  <Button variant="secondary" className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};