'use client';

import { z } from 'zod';
import { toast } from 'sonner';
import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { trpc } from '../../utils/trpc';
import { OracleType } from '@baskt/types';
import { useBasktClient } from '@baskt/ui';
import { usePrivy } from '@privy-io/react-auth';
import { showTransactionToast } from '../ui/transaction-toast';
import { AddOracleModalProps, CreateOracleInput } from '../../types/oracle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

export function AddOracleModal({ open, onOpenChange, onOracleAdded }: AddOracleModalProps) {
  const { client } = useBasktClient();
  const { authenticated, login } = usePrivy();
  const [oracleName, setOracleName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oracleType, setOracleType] = useState<OracleType>(OracleType.CUSTOM);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [price, setPrice] = useState('');
  const [exponent, setExponent] = useState('-6');
  const [confidence, setConfidence] = useState('');
  const [ema, setEma] = useState('');

  // Price config state
  const [providerId, setProviderId] = useState('solana');
  const [providerChain, setProviderChain] = useState('solana');
  const [providerName, setProviderName] = useState('dexscreener');
  const [twpSeconds, setTwpSeconds] = useState('300');
  const [updateFrequency, setUpdateFrequency] = useState('15');

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
    twpSeconds: z
      .string()
      .min(1, 'TWP seconds is required')
      .refine((val) => !isNaN(parseInt(val)), 'TWP seconds must be a valid number')
      .refine((val) => parseInt(val) > 0, 'TWP seconds must be greater than 0'),
    updateFrequency: z
      .string()
      .min(1, 'Update frequency is required')
      .refine((val) => !isNaN(parseInt(val)), 'Update frequency must be a valid number')
      .refine((val) => parseInt(val) > 0, 'Update frequency must be greater than 0'),
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
    if (!authenticated) {
      toast.error('Please connect your wallet to add a new oracle');
      login();
      return;
    }

    setErrors({});

    try {
      oracleSchema.parse({ oracleName, price, exponent, twpSeconds, updateFrequency });
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
      const twpSecondsValue = parseInt(twpSeconds);
      const updateFrequencyValue = parseInt(updateFrequency);

      // Parse confidence and EMA values if provided
      const confidenceValue = confidence ? parseFloat(confidence) : undefined;
      const emaValue = ema ? parseFloat(ema) : undefined;

      if (isNaN(priceValue) || isNaN(exponentValue)) {
        toast.error('Price and exponent must be valid numbers');
        return;
      }

      // Validate confidence and EMA if provided
      if (confidence && isNaN(confidenceValue!)) {
        toast.error('Confidence must be a valid number');
        return;
      }

      if (ema && isNaN(emaValue!)) {
        toast.error('EMA must be a valid number');
        return;
      }

      let oracleAddress = '';
      if (client) {
        try {
          // Use the original blockchain interaction with all parameters
          const result = await client.createCustomOracle(
            client.protocolPDA,
            oracleName,
            priceValue,
            exponentValue,
            emaValue, // Pass the EMA value
            confidenceValue, // Pass the confidence value
          );
          oracleAddress = result.address.toString();

          // Create the new input object matching the updated OracleConfig model
          const input: CreateOracleInput = {
            oracleName,
            oracleType,
            oracleAddress,
            priceConfig: {
              provider: {
                id: providerId,
                chain: providerChain,
                name: providerName,
              },
              twp: {
                seconds: twpSecondsValue,
              },
              updateFrequencySeconds: updateFrequencyValue,
            },
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
      setProviderId('solana');
      setProviderChain('solana');
      setProviderName('dexscreener');
      setTwpSeconds('300');
      setUpdateFrequency('15');
    } catch (error) {
      console.error('Error creating oracle:', error);
      toast.error('Failed to create oracle. See console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#010b1d] border-white/10 text-white sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Add New Oracle</DialogTitle>
          <DialogDescription className="text-[#E5E7EB]">
            Configure and add a new price oracle feed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
              <Select
                value={oracleType}
                onValueChange={(value) => setOracleType(value as OracleType)}
              >
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

              {/* Blockchain Parameters (still needed for on-chain interaction) */}
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

              {/* Price Config Section */}
              <h3 className="text-lg font-medium text-white mt-6">Price Configuration</h3>

              {/* Provider Section */}
              <div className="space-y-2">
                <h4 className="text-base font-medium text-white">Provider</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">ID</label>
                    <Input
                      placeholder="solana"
                      className="h-12 bg-[#0d1117] border-0 ring-1 ring-white/5 text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0"
                      value={providerId}
                      onChange={(e) => setProviderId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Chain</label>
                    <Input
                      placeholder="solana"
                      className="h-12 bg-[#0d1117] border-0 ring-1 ring-white/5 text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0"
                      value={providerChain}
                      onChange={(e) => setProviderChain(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Name</label>
                    <Input
                      placeholder="dexscreener"
                      className="h-12 bg-[#0d1117] border-0 ring-1 ring-white/5 text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0"
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* TWP and Update Frequency */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <label className="text-base font-medium text-white">TWP Seconds</label>
                  <Input
                    type="number"
                    placeholder="300"
                    className={`h-12 bg-[#0d1117] border-0 ring-1 ${errors.twpSeconds ? 'ring-red-500' : 'ring-white/5'} text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0`}
                    value={twpSeconds}
                    onChange={(e) => {
                      setTwpSeconds(e.target.value);
                      if (errors.twpSeconds) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.twpSeconds;
                          return newErrors;
                        });
                      }
                    }}
                  />
                  {errors.twpSeconds ? (
                    <p className="text-sm text-red-500">{errors.twpSeconds}</p>
                  ) : (
                    <p className="text-sm text-[#666]">Time-weighted period in seconds</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-base font-medium text-white">Update Frequency</label>
                  <Input
                    type="number"
                    placeholder="15"
                    className={`h-12 bg-[#0d1117] border-0 ring-1 ${errors.updateFrequency ? 'ring-red-500' : 'ring-white/5'} text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0`}
                    value={updateFrequency}
                    onChange={(e) => {
                      setUpdateFrequency(e.target.value);
                      if (errors.updateFrequency) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.updateFrequency;
                          return newErrors;
                        });
                      }
                    }}
                  />
                  {errors.updateFrequency ? (
                    <p className="text-sm text-red-500">{errors.updateFrequency}</p>
                  ) : (
                    <p className="text-sm text-[#666]">Update frequency in seconds</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
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
