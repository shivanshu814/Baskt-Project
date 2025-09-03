import { useUser } from '@baskt/ui';
import { useState } from 'react';
import { trpc } from '../../lib/api/trpc';
import { SendReferralEmailParams } from '../../types/referral';

export function postReferralMail() {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { userAddress } = useUser();

  const sendEmailMutation = trpc.referral.sendEmail.useMutation();

  const sendReferralEmail = async ({ inviteeEmail }: SendReferralEmailParams) => {
    if (!userAddress) {
      setError('User address not found. Please connect your wallet.');
      return { success: false, error: 'User address not found' };
    }

    try {
      setIsSending(true);
      setError(null);
      setSuccess(null);

      const result = await sendEmailMutation.mutateAsync({
        inviteeEmail,
        referrerAddress: userAddress,
      });

      if (result.success) {
        const message = 'message' in result ? result.message : 'Referral email sent successfully!';
        setSuccess(message);
        return { success: true, data: result };
      } else {
        const error = 'error' in result ? result.error : 'Failed to send referral email';
        setError(error);
        return { success: false, error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send referral email';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSending(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    sendReferralEmail,
    isSending,
    error,
    success,
    clearMessages,
  };
}
