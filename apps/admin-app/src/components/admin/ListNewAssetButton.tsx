'use client';

import { z } from 'zod';
import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { trpc } from '../../utils/trpc';
import { useForm } from 'react-hook-form';
import { useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Plus, ChevronDown } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { usePrivy } from '@privy-io/react-auth';
import { CreateAssetInput } from '../../types/asset';
import { zodResolver } from '@hookform/resolvers/zod';
import { showTransactionToast } from '../ui/transaction-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';

const isValidSolanaPublicKey = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};

const formSchema = z.object({
  ticker: z.string().min(1, { message: 'Ticker is required' }),
  name: z.string().min(1, { message: 'Asset name is required' }),
  oracleType: z.enum(['pyth', 'custom']),
  oracleAddress: z
    .string()
    .min(32, { message: 'Valid oracle address required' })
    .refine((val) => isValidSolanaPublicKey(val), {
      message: 'Invalid Solana public key format',
    }),

  permissions: z.object({
    allowLong: z.boolean().default(true),
    allowShort: z.boolean().default(true),
  }),

  maxPriceError: z.string().min(1, { message: 'Max price error is required' }),
  maxPriceAgeSec: z.string().min(1, { message: 'Max price age is required' }),

  logoUrl: z.string().url({ message: 'Please enter a valid URL' }).optional(),

  fees: z.object({
    openFee: z.string().default('0.1'),
    closeFee: z.string().default('0.1'),
    fundingFee: z.string().default('0.01'),
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function ListNewAssetButton() {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { client } = useBasktClient();
  const { authenticated, login } = usePrivy();

  const createAsset = trpc.asset.createAsset.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Asset saved successfully',
      });
      setShowModal(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticker: '',
      name: '',
      oracleType: 'pyth',
      oracleAddress: '',
      permissions: {
        allowLong: true,
        allowShort: true,
      },
      maxPriceError: '100',
      maxPriceAgeSec: '60',
      logoUrl: '',
      fees: {
        openFee: '0.1',
        closeFee: '0.1',
        fundingFee: '0.01',
      },
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!authenticated) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet to list new assets',
        variant: 'destructive',
      });
      login();
      return;
    }

    if (
      !values.ticker ||
      !values.oracleAddress ||
      !values.maxPriceError ||
      !values.maxPriceAgeSec
    ) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (!isValidSolanaPublicKey(values.oracleAddress)) {
        toast({
          title: 'Validation Error',
          description: 'Invalid oracle address format',
          variant: 'destructive',
        });
        return;
      }

      if (!client) {
        toast({
          title: 'Client Error',
          description: 'Client not initialized',
          variant: 'destructive',
        });
        return;
      }

      const assetData = {
        ticker: values.ticker,
        oracleType: values.oracleType,
        oracleAddress: values.oracleAddress,
        permissions: {
          allowLongs: values.permissions.allowLong,
          allowShorts: values.permissions.allowShort,
        },
        maxPriceError: parseInt(values.maxPriceError),
        maxPriceAgeSec: parseInt(values.maxPriceAgeSec),
        fees: {
          openFee: parseFloat(values.fees.openFee),
          closeFee: parseFloat(values.fees.closeFee),
          fundingFee: parseFloat(values.fees.fundingFee),
        },
      };

      let result = null;
      if (assetData.oracleType === 'custom') {
        result = await client.addAsset({
          ticker: assetData.ticker,
          oracle: {
            oracleType: 'Custom',
            oracleAccount: new PublicKey(assetData.oracleAddress),
            maxPriceAgeSec: assetData.maxPriceAgeSec,
            maxPriceError: new anchor.BN(assetData.maxPriceError),
            priceFeedId: '',
          },
          permissions: assetData.permissions,
        });
      } else {
        result = await client.addAssetWithPythOracle(
          assetData.ticker,
          new PublicKey(assetData.oracleAddress),
          assetData.permissions,
        );
      }

      if (!result) {
        throw new Error('Failed to add asset on blockchain');
      }

      try {
        // Use custom logo URL if provided, otherwise use default CoinMarketCap URL
        const logoUrl = values.logoUrl
          ? values.logoUrl
          : `https://s2.coinmarketcap.com/static/img/coins/64x64/${assetData.ticker.toLowerCase()}.png`;

        const assetInput: CreateAssetInput = {
          ticker: assetData.ticker,
          name: values.name,
          assetAddress: result.assetAddress.toString(), // Use the actual asset address from the blockchain result
          oracleAddress: assetData.oracleAddress,
          logo: logoUrl,
        };
        await createAsset.mutateAsync(assetInput);
      } catch (dbError) {
        toast({
          title: 'Warning',
          description:
            'Asset was added to blockchain but failed to save in database. Please contact support.',
          variant: 'destructive',
        });
      }

      showTransactionToast({
        title: 'Asset Listed Successfully',
        description: `The asset ${values.ticker} has been listed and is now available for basket creation.`,
        txSignature: result.txSignature,
      });

      setShowModal(false);
      form.reset();
    } catch (error) {
      toast({
        title: 'Error Adding Asset',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        <Plus className="mr-2 h-4 w-4" /> List New Asset
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#010b1d] border-white/10 text-white sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">List New Asset</DialogTitle>
            <DialogDescription className="text-[#E5E7EB]">
              Add a new asset to make it available for user baskets.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-2">
              <label className="text-base font-medium text-white">Ticker Symbol</label>
              <Input
                placeholder="BTC"
                {...form.register('ticker')}
                className="h-12 bg-[#0d1117] border-0 ring-1 ring-white/5 text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0"
              />
              {form.formState.errors.ticker && (
                <p className="text-red-500 text-sm">{form.formState.errors.ticker.message}</p>
              )}
              <p className="text-sm text-[#666]">
                Enter the ticker symbol of the asset (e.g., BTC, ETH)
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-base font-medium text-white">Asset Name</label>
              <Input
                placeholder="Bitcoin"
                {...form.register('name')}
                className="h-12 bg-[#0d1117] border-0 ring-1 ring-white/5 text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0"
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
              )}
              <p className="text-sm text-[#666]">Enter the full name of the asset</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Oracle Type</label>
              <Select
                onValueChange={(value) => form.setValue('oracleType', value as 'pyth' | 'custom')}
              >
                <SelectTrigger className="h-12 bg-[#0d1117] border-0 ring-[0.5px] ring-white/5 text-white text-base rounded-2xl focus-visible:ring-[0.5px] focus-visible:ring-white/10 focus-visible:ring-offset-0 data-[value]:ring-[0.5px] data-[value]:ring-white/5">
                  <SelectValue placeholder="Select oracle type" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1117] border-0 ring-[0.5px] ring-white/5 rounded-2xl max-h-[200px] overflow-y-auto">
                  <SelectItem
                    value="pyth"
                    className="text-white hover:bg-white/5 data-[state=checked]:bg-white/10"
                  >
                    Pyth
                  </SelectItem>

                  <SelectItem
                    value="custom"
                    className="text-white hover:bg-white/5 data-[state=checked]:bg-white/10"
                  >
                    Custom
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.oracleType && (
                <p className="text-red-500 text-sm">{form.formState.errors.oracleType.message}</p>
              )}
              <p className="text-xs text-[#E5E7EB]/60">Select the oracle feed type</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Oracle Address</label>
              <Input
                placeholder="Enter oracle address"
                {...form.register('oracleAddress')}
                className="h-12 bg-[#0d1117] border-0 ring-1 ring-white/5 text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0"
              />
              {form.formState.errors.oracleAddress && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.oracleAddress.message}
                </p>
              )}
              <p className="text-xs text-[#E5E7EB]/60">Specify the oracle account address</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Logo URL</label>
                <Input
                  placeholder="https://example.com/logo.png"
                  {...form.register('logoUrl')}
                  className="h-12 bg-[#0d1117] border-0 ring-1 ring-white/5 text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0"
                />
                {form.formState.errors.logoUrl && (
                  <p className="text-red-500 text-sm">{form.formState.errors.logoUrl.message}</p>
                )}
                <p className="text-xs text-[#E5E7EB]/60">Custom logo URL (optional)</p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-[#0d1117] rounded-md flex items-center justify-center overflow-hidden border border-white/10">
                  {form.watch('logoUrl') ? (
                    <img
                      src={form.watch('logoUrl')}
                      alt="Asset Logo Preview"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = `https://s2.coinmarketcap.com/static/img/coins/64x64/${form.watch('ticker')?.toLowerCase() || 'placeholder'}.png`;
                      }}
                    />
                  ) : form.watch('ticker') ? (
                    <img
                      src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${form.watch('ticker').toLowerCase()}.png`}
                      alt="Default Logo"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/64x64/gray/white?text=?';
                      }}
                    />
                  ) : (
                    <span className="text-white/40 text-xl">?</span>
                  )}
                </div>
                <div className="text-sm text-white/60">
                  <p>Logo Preview</p>
                  <p className="text-xs">Default logo will be used if no custom URL is provided</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Max Price Error</label>
                <Input
                  type="number"
                  placeholder="100"
                  {...form.register('maxPriceError')}
                  className="h-12 bg-[#0d1117] border-0 ring-1 ring-white/5 text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0"
                />
                {form.formState.errors.maxPriceError && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.maxPriceError.message}
                  </p>
                )}
                <p className="text-xs text-[#E5E7EB]/60">Maximum allowed price error</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Max Price Age (seconds)</label>
                <Input
                  type="number"
                  placeholder="60"
                  {...form.register('maxPriceAgeSec')}
                  className="h-12 bg-[#0d1117] border-0 ring-1 ring-white/5 text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0"
                />
                {form.formState.errors.maxPriceAgeSec && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.maxPriceAgeSec.message}
                  </p>
                )}
                <p className="text-xs text-[#E5E7EB]/60">Maximum age of price in seconds</p>
              </div>
            </div>

            <Collapsible className="space-y-2">
              <div className="flex items-center justify-between space-x-4">
                <h4 className="text-sm font-medium text-white">Asset Permissions</h4>
                <CollapsibleTrigger className="hover:bg-[#1a1f2e] p-1 rounded">
                  <ChevronDown className="h-4 w-4 text-white/60" />
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowLong"
                      defaultChecked={true}
                      {...form.register('permissions.allowLong')}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="allowLong" className="text-sm text-white">
                      Allow Long
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowShort"
                      defaultChecked={true}
                      {...form.register('permissions.allowShort')}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="allowShort" className="text-sm text-white">
                      Allow Short
                    </label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible className="space-y-2">
              <div className="flex items-center justify-between space-x-4">
                <h4 className="text-sm font-medium text-white">Fee Structure</h4>
                <CollapsibleTrigger className="hover:bg-[#1a1f2e] p-1 rounded">
                  <ChevronDown className="h-4 w-4 text-white/60" />
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2">
                <div className="rounded-md border border-white/10 p-4 bg-[#0d1117]">
                  <p className="text-sm text-[#E5E7EB]/60">Configure fee structure here</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/10">
            <Button
              type="submit"
              className="h-11 px-8 bg-blue-500 text-white hover:bg-blue-500/90 rounded-full"
              onClick={() => onSubmit(form.getValues())}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding Asset...' : 'List New Asset'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
