'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useBasktClient } from '../../providers/BasktClientProvider';
import { PublicKey } from '@solana/web3.js';
import { showTransactionToast } from '../ui/transaction-toast';
import { Loader2 } from 'lucide-react';
import * as anchor from '@coral-xyz/anchor';

interface UpdateOracleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOracleUpdated: () => void;
  oracle?: {
    address: PublicKey;
    price: any;
    expo: number;
    conf: any;
    ema: any;
    publishTime: any;
  };
}

export function UpdateOracleModal({ open, onOpenChange, onOracleUpdated, oracle }: UpdateOracleModalProps) {
  const [price, setPrice] = useState('');
  const [confidence, setConfidence] = useState('');
  const [ema, setEma] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { client } = useBasktClient();

  // Reset form when modal opens with new oracle data
  useState(() => {
    if (open && oracle) {
      setPrice(oracle.price.toString());
      setConfidence(oracle.conf.toString());
      setEma(oracle.ema.toString());
      setErrors({});
    }
  });

  const schema = z.object({
    price: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Price must be a positive number"),
    confidence: z.string().optional(),
    ema: z.string().optional(),
  });

  const handleSubmit = async () => {
    if (!client || !oracle) return;

    try {
      // Validate inputs
      const validationResult = schema.safeParse({
        price,
        confidence,
        ema,
      });

      if (!validationResult.success) {
        const formattedErrors: { [key: string]: string } = {};
        validationResult.error.errors.forEach(error => {
          formattedErrors[error.path[0].toString()] = error.message;
        });
        setErrors(formattedErrors);
        return;
      }

      setIsSubmitting(true);
      setErrors({});

      // Extract oracle name from address (assuming it's stored in the oracle object)
      const oracleName = oracle.address.toString().split('/').pop() || '';

      // Parse values
      const priceValue = parseFloat(price);
      const confidenceValue = confidence ? parseFloat(confidence) : undefined;
      const emaValue = ema ? parseFloat(ema) : undefined;

      // Call the update method
      await client.updateOraclePrice(
        oracleName,
        oracle.address,
        new anchor.BN(priceValue),
        oracle.expo,
        emaValue,
        confidenceValue
      );

      showTransactionToast({
        title: 'Oracle Updated',
        description: `Oracle price has been updated successfully!`,
        address: oracle.address.toString(),
        addressLabel: 'View Oracle',
      });

      // Close modal and refresh oracles list
      onOpenChange(false);
      onOracleUpdated();
    } catch (error) {
      console.error('Error updating oracle:', error);
      setErrors({
        submit: `Failed to update oracle: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#010b1d] text-white border border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Update Oracle Price</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {oracle && (
            <>
              <div className="space-y-2">
                <label className="text-base font-medium text-white">Oracle Address</label>
                <div className="font-mono text-sm bg-[#0d1117] p-3 rounded-2xl border border-white/10 break-all">
                  {oracle.address.toString()}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-base font-medium text-white">Exponent</label>
                <div className="font-mono text-sm bg-[#0d1117] p-3 rounded-2xl border border-white/10">
                  {oracle.expo}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-base font-medium text-white">Price</label>
                <Input
                  type="text"
                  placeholder="Enter new price"
                  className={`h-12 bg-[#0d1117] border-0 ring-1 ${errors.price ? 'ring-red-500' : 'ring-white/5'} text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0`}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                {price && !isNaN(parseFloat(price)) && (
                  <p className="text-sm text-[#666]">
                    Actual price: {(parseFloat(price) * Math.pow(10, oracle?.expo || 0)).toLocaleString(undefined, {
                      maximumFractionDigits: Math.abs(oracle?.expo || 0),
                    })}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-base font-medium text-white">Confidence (optional)</label>
                <Input
                  type="text"
                  placeholder="Enter confidence value"
                  className={`h-12 bg-[#0d1117] border-0 ring-1 ${errors.confidence ? 'ring-red-500' : 'ring-white/5'} text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0`}
                  value={confidence}
                  onChange={(e) => setConfidence(e.target.value)}
                />
                {errors.confidence && <p className="text-sm text-red-500">{errors.confidence}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-base font-medium text-white">EMA (optional)</label>
                <Input
                  type="text"
                  placeholder="Enter EMA value"
                  className={`h-12 bg-[#0d1117] border-0 ring-1 ${errors.ema ? 'ring-red-500' : 'ring-white/5'} text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0`}
                  value={ema}
                  onChange={(e) => setEma(e.target.value)}
                />
                {errors.ema && <p className="text-sm text-red-500">{errors.ema}</p>}
              </div>
              {errors.submit && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-500">{errors.submit}</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="bg-transparent text-white hover:bg-white/5 border border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Oracle'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
