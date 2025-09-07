import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ShieldCheckIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { LoadingSpinner } from './LoadingSpinner';
import { Badge } from './Badge';
import { mfaApi, authApi } from '../../services/api';
import { MFADevice } from '../../types/api';

const schema = z.object({
  token: z.string().min(6, 'Verification code must be 6 digits').max(6),
});

type FormData = z.infer<typeof schema>;

interface MFAChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
  userId: string;
}

export const MFAChallengeModal: React.FC<MFAChallengeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId,
}) => {
  const [selectedDevice, setSelectedDevice] = useState<MFADevice | null>(null);
  const [codeSent, setCodeSent] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Fetch user's MFA devices
  const { data: devices, isLoading: devicesLoading } = useQuery({
    queryKey: ['mfa-devices', userId],
    queryFn: mfaApi.getDevices,
    enabled: isOpen,
  });

  // Send SMS code mutation
  const sendSmsCodeMutation = useMutation({
    mutationFn: mfaApi.sendSmsMfaCodeView,
    onSuccess: () => {
      toast.success('SMS code sent successfully');
      setCodeSent(true);
    },
    onError: () => {
      toast.error('Failed to send SMS code');
    },
  });

  // Verify MFA code mutation
  const verifyMfaMutation = useMutation({
    mutationFn: ({ token, deviceId }: { token: string; deviceId?: string }) =>
      mfaApi.verifyMfaLogin(token, deviceId),
    onSuccess: (response) => {
      toast.success('MFA verification successful');
      onSuccess(response.token);
      onClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Invalid verification code';
      toast.error(message);
      form.setError('token', { message });
    },
  });

  // Auto-select first device if only one available
  useEffect(() => {
    if (devices && devices.length === 1 && !selectedDevice) {
      setSelectedDevice(devices[0]);
    }
  }, [devices, selectedDevice]);

  const handleDeviceSelect = (device: MFADevice) => {
    setSelectedDevice(device);
    setCodeSent(false);
    form.reset();

    // If SMS device, automatically send code
    if (device.device_type === 'sms') {
      sendSmsCodeMutation.mutate(device.id);
    }
  };

  const handleSendSmsCode = () => {
    if (selectedDevice && selectedDevice.device_type === 'sms') {
      sendSmsCodeMutation.mutate(selectedDevice.id);
    }
  };

  const onSubmit = (data: FormData) => {
    if (!selectedDevice) {
      toast.error('Please select an MFA device');
      return;
    }

    verifyMfaMutation.mutate({
      token: data.token,
      deviceId: selectedDevice.id,
    });
  };

  const handleClose = () => {
    setSelectedDevice(null);
    setCodeSent(false);
    form.reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Two-Factor Authentication"
      size="md"
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-monkai-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon className="h-8 w-8 text-monkai-600" />
          </div>
          <p className="text-sm text-neutral-600">
            Please verify your identity using one of your registered MFA devices.
          </p>
        </div>

        {devicesLoading ? (
          <LoadingSpinner />
        ) : devices && devices.length > 0 ? (
          <div className="space-y-4">
            {/* Device Selection */}
            {devices.length > 1 && (
              <div>
                <label className="form-label">Choose MFA Device</label>
                <div className="space-y-2 mt-2">
                  {devices.map((device) => (
                    <button
                      key={device.id}
                      type="button"
                      onClick={() => handleDeviceSelect(device)}
                      className={`w-full p-3 border rounded-lg text-left transition-colors ${
                        selectedDevice?.id === device.id
                          ? 'border-monkai-500 bg-monkai-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
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
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Form */}
            {selectedDevice && (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {selectedDevice.device_type === 'sms' && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          SMS Code to {selectedDevice.phone_number}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {codeSent ? 'Code sent!' : 'Click to send verification code'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleSendSmsCode}
                        loading={sendSmsCodeMutation.isPending}
                        disabled={codeSent}
                      >
                        {codeSent ? 'Code Sent' : 'Send Code'}
                      </Button>
                    </div>
                  </div>
                )}

                <Input
                  label="Verification Code"
                  placeholder="Enter 6-digit code"
                  required
                  maxLength={6}
                  {...form.register('token')}
                  error={form.formState.errors.token?.message}
                  help={
                    selectedDevice.device_type === 'totp'
                      ? 'Enter the code from your authenticator app'
                      : 'Enter the code sent to your phone'
                  }
                />

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={verifyMfaMutation.isPending}
                  >
                    Verify Code
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-500">
              No MFA devices found. Please contact support.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};