'use client';

import { z } from 'zod';
import { toast } from 'sonner';
import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { trpc } from '../../utils/trpc';
import { useBasktClient } from '@baskt/ui';
import { showTransactionToast } from '../ui/transaction-toast';
import { AddOracleModalProps, CreateOracleInput } from '../../types/oracle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

export function AddOracleModal({ open, onOpenChange, onOracleAdded }: AddOracleModalProps) {
  const [ema, setEma] = useState('');
  const { client } = useBasktClient();
  const [price, setPrice] = useState('');
  const [exponent, setExponent] = useState('-6');
  const [oracleName, setOracleName] = useState('');
  const [confidence, setConfidence] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oracleType, setOracleType] = useState<string>('custom');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const oracleSchema = z.object({
    oracleName: z
      .string()
      .min(1, 'Oracle name is required')
      .regex(/^[a-zA-Z]+$/, 'Oracle name must contain only alphabets'),
    price: z
      .string()
      .min(1, 'Price is required')
      .refine((val) => !isNaN(parseFloat(val)), 'Price must be a valid number'),
    exponent: z
      .string()
      .refine((val) => !isNaN(parseInt(val)), 'Exponent must be a valid number')
      .refine((val) => parseInt(val) <= 0, 'Exponent must be less than or equal to 0')
      .refine((val) => parseInt(val) >= -6, 'Exponent must be greater than -6'),
  });

  const createOracle = trpc.oracle.createOracle.useMutation({
    onSuccess: () => {
      toast.success('Oracle saved successfully');
      onOracleAdded();
      onOpenChange(false);

      setOracleName('');
      setPrice('');
      setExponent('-6');
      setConfidence('');
      setEma('');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async () => {
    setErrors({});

    try {
      oracleSchema.parse({ oracleName, price, exponent });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as string;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
        toast.error(error.errors[0]?.message || 'Validation failed');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const priceValue = parseFloat(price);
      const exponentValue = parseInt(exponent);
      const confidenceValue = confidence ? parseFloat(confidence) : undefined;
      const emaValue = ema ? parseFloat(ema) : undefined;

      if (isNaN(priceValue) || isNaN(exponentValue)) {
        toast.error('Price and exponent must be valid numbers');
        return;
      }

      let oracleAddress = '';
      if (client) {
        try {
          const result = await client.createCustomOracle(
            client.protocolPDA,
            oracleName,
            priceValue,
            exponentValue,
            emaValue,
            confidenceValue,
          );
          oracleAddress = result.address.toString();

          const input: CreateOracleInput = {
            oracleName,
            oracleType,
            price: priceValue,
            exponent: exponentValue,
            confidence: confidenceValue,
            ema: emaValue,
          };

          await createOracle.mutateAsync(input);

          showTransactionToast({
            title: 'Oracle Created',
            description: `Oracle ${oracleName} has been created successfully!`,
            address: oracleAddress,
            addressLabel: 'View Oracle',
          });
        } catch (error) {
          console.error('Error creating oracle on blockchain:', error);
          toast.error('Failed to create oracle on blockchain');
          return;
        }
      }

      onOracleAdded();
      onOpenChange(false);
      setOracleName('');
      setPrice('');
      setExponent('-6');
      setConfidence('');
      setEma('');
    } catch (error) {
      console.error('Error creating oracle:', error);
      toast.error('Failed to create oracle. See console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#010b1d] border-white/10 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Add New Oracle</DialogTitle>
          <DialogDescription className="text-[#E5E7EB]">
            Configure and add a new price oracle feed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-base font-medium text-white">Oracle Name</label>
              <Input
                placeholder="BTC/USD Price Feed"
                className={`h-12 bg-[#0d1117] border-0 ring-1 ${errors.oracleName ? 'ring-red-500' : 'ring-white/5'} text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0`}
                value={oracleName}
                onChange={(e) => {
                  setOracleName(e.target.value);
                  if (errors.oracleName) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.oracleName;
                      return newErrors;
                    });
                  }
                }}
              />
              {errors.oracleName ? (
                <p className="text-sm text-red-500">{errors.oracleName}</p>
              ) : (
                <p className="text-sm text-[#666]">
                  A unique identifier for this oracle (alphabets only)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-base font-medium text-white">Oracle Type</label>
              <Select value={oracleType} onValueChange={setOracleType}>
                <SelectTrigger className="h-12 bg-[#0d1117] border-0 ring-[0.5px] ring-white/5 text-white text-base rounded-2xl focus-visible:ring-[0.5px] focus-visible:ring-white/10 focus-visible:ring-offset-0 data-[value]:ring-[0.5px] data-[value]:ring-white/5">
                  <SelectValue placeholder="Select oracle type" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1117] border-0 ring-[0.5px] ring-white/5 rounded-2xl max-h-[200px] overflow-y-auto">
                  <SelectItem
                    value="custom"
                    className="text-white hover:bg-white/5 data-[state=checked]:bg-white/10"
                  >
                    Custom
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-[#666]">Currently only Custom oracles are supported</p>
            </div>
          </div>

          {oracleType === 'custom' && (
            <div className="space-y-4 mt-4">
              <h3 className="text-lg font-medium text-white">Custom Oracle Parameters</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-base font-medium text-white">Price</label>
                  <Input
                    type="number"
                    placeholder="10000"
                    className={`h-12 bg-[#0d1117] border-0 ring-1 ${errors.price ? 'ring-red-500' : 'ring-white/5'} text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0`}
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      if (errors.price) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.price;
                          return newErrors;
                        });
                      }
                    }}
                  />
                  {errors.price ? (
                    <p className="text-sm text-red-500">{errors.price}</p>
                  ) : (
                    <p className="text-sm text-[#666]">Current price value</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-base font-medium text-white">Exponent</label>
                  <Input
                    type="number"
                    placeholder="-6"
                    className={`h-12 bg-[#0d1117] border-0 ring-1 ${errors.exponent ? 'ring-red-500' : 'ring-white/5'} text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0`}
                    value={exponent}
                    onChange={(e) => {
                      setExponent(e.target.value);
                      if (errors.exponent) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.exponent;
                          return newErrors;
                        });
                      }
                    }}
                  />
                  {errors.exponent ? (
                    <p className="text-sm text-red-500">{errors.exponent}</p>
                  ) : (
                    <p className="text-sm text-[#666]">Price exponent (must be between -6 and 0)</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-base font-medium text-white">Confidence</label>
                  <Input
                    type="number"
                    placeholder="Optional (defaults to 1% of price)"
                    className="h-12 bg-[#0d1117] border-0 ring-1 ring-white/5 text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0"
                    value={confidence}
                    onChange={(e) => setConfidence(e.target.value)}
                  />
                  <p className="text-sm text-[#666]">Confidence interval (optional)</p>
                </div>
                <div className="space-y-2">
                  <label className="text-base font-medium text-white">EMA</label>
                  <Input
                    type="number"
                    placeholder="Optional (defaults to price)"
                    className="h-12 bg-[#0d1117] border-0 ring-1 ring-white/5 text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0"
                    value={ema}
                    onChange={(e) => setEma(e.target.value)}
                  />
                  <p className="text-sm text-[#666]">Exponential Moving Average (optional)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="h-11 px-8 bg-blue-500 text-white hover:bg-blue-500/90 rounded-full"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              'Add Oracle'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
