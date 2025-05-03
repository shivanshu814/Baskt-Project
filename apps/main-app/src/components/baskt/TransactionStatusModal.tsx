import { CheckCircle2, XCircle, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';

type TransactionStatus = 'waiting' | 'confirmed' | 'creating' | 'success' | 'failed';

interface TransactionStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry?: () => void;
  status: TransactionStatus;
  error?: string;
}

export const TransactionStatusModal = ({
  open,
  onOpenChange,
  onRetry,
  status,
  error,
}: TransactionStatusModalProps) => {
  const getStatusContent = () => {
    switch (status) {
      case 'waiting':
        return {
          title: 'Waiting for Transaction',
          description: 'Please wait while we confirm your transaction on the blockchain...',
          icon: (
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin relative z-10" />
            </div>
          ),
        };
      case 'confirmed':
        return {
          title: 'Transaction Confirmed!',
          description: 'Your transaction has been confirmed on the blockchain.',
          icon: (
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
              <CheckCircle2 className="h-12 w-12 text-green-500 relative z-10" />
            </div>
          ),
        };
      case 'creating':
        return {
          title: 'Creating Your Baskt',
          description: 'We are now creating your Baskt and saving the metadata...',
          icon: (
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="h-12 w-12 text-purple-500 animate-spin relative z-10" />
            </div>
          ),
        };
      case 'success':
        return {
          title: 'Baskt Created Successfully!',
          description: 'Your Baskt has been created and is ready to use.',
          icon: (
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
              <CheckCircle2 className="h-12 w-12 text-green-500 relative z-10" />
            </div>
          ),
        };
      case 'failed':
        return {
          title: 'Transaction Failed',
          description: error || 'There was an error processing your transaction.',
          icon: (
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
              <XCircle className="h-12 w-12 text-red-500 relative z-10" />
            </div>
          ),
        };
    }
  };

  const content = getStatusContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-b from-gray-900/90 to-gray-900 backdrop-blur-xl">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <div className="w-20 h-20 flex items-center justify-center">{content?.icon}</div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white">{content?.title}</h2>
            <p className="text-base text-gray-400">{content?.description}</p>
          </div>

          {status === 'failed' && onRetry && (
            <Button
              onClick={onRetry}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white"
              size="lg"
            >
              Try Again
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
