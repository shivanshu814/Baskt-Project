import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@baskt/ui';
import { Button } from '@baskt/ui';
import { Input } from '@baskt/ui';
import { Label } from '@baskt/ui';
import { PublicKeyText } from '@baskt/ui';
import { useFaucet } from '../../hooks/useFaucet';
import { FaucetDialogProps, FaucetFormData } from '../../types/faucet';
import { Coins } from 'lucide-react';
import { toast } from 'sonner';

export function FaucetDialog({
  showModal,
  setShowModal,
  userAddress,
  onFaucetComplete,
}: FaucetDialogProps) {
  const { sendFaucet, isLoading } = useFaucet();
  const [formData, setFormData] = useState<FaucetFormData>({
    amount: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    try {
      await sendFaucet(userAddress, formData);
      onFaucetComplete();
      setShowModal(false);
      setFormData({ amount: '' });
    } catch (error) {
      toast('Failed to send faucet');
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setFormData({ amount: '' });
    setError(null);
  };

  return (
    <Dialog open={showModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] w-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-0">
          <DialogHeader className="pt-6 pb-2">
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Send USDC Faucet
            </DialogTitle>
            <DialogDescription className="text-sm mt-1">
              Send USDC tokens to user account. This will mint USDC to the specified address.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="user-address" className="text-xs">
                User Address
              </Label>
              <div className="p-2 rounded-md text-xs bg-muted">
                <PublicKeyText publicKey={userAddress} isCopy={true} noFormat={true} />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="amount" className="text-xs">
                USDC Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                autoComplete="off"
                placeholder="Enter amount in USDC"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                required
                disabled={isLoading}
              />
              {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-2 pb-6 pt-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-md px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.amount || parseFloat(formData.amount) <= 0}
              className="rounded-md px-4 py-2 font-semibold"
            >
              {isLoading ? `Sending...` : `Send ${formData.amount || '0'} USDC`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
