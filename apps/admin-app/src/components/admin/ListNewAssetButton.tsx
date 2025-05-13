'use client';

import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Plus } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { usePrivy } from '@privy-io/react-auth';
import { trpc } from '../../utils/trpc';
import { useBasktClient } from '@baskt/ui';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { showTransactionToast } from '../ui/transaction-toast';

const providerOptions = ['Binance', 'Dexscreener', 'Coingecko'];

const formSchema = z.object({
  ticker: z.string().min(1, { message: 'Ticker is required' }),
  name: z.string().min(1, { message: 'Asset name is required' }),
  priceConfig: z.object({
    provider: z.object({
      name: z.enum(providerOptions as [string, ...string[]], {
        required_error: 'Provider name is required',
      }),
      id: z.string().min(1, { message: 'Provider ID is required' }),
      chain: z.string().optional(),
    }),
    twp: z.object({
      seconds: z.coerce.number().int().min(1, { message: 'TWP seconds required' }),
    }),
    updateFrequencySeconds: z.coerce
      .number()
      .int()
      .min(1, { message: 'Update frequency required' }),
  }),
  logo: z.string().url({ message: 'Please enter a valid logo URL' }),
  permissions: z.object({
    allowLong: z.boolean().default(true),
    allowShort: z.boolean().default(true),
  }),
});

type FormValues = z.infer<typeof formSchema>; // ticker, name, priceConfig, logo, permissions

export function ListNewAssetButton() {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const { toast } = useToast();
  const { client } = useBasktClient();
  const { authenticated, login } = usePrivy();

  useEffect(() => {
    const checkPermission = async () => {
      if (!client || !authenticated) {
        setHasPermission(false);
        return;
      }

      try {
        const protocol = await client.getProtocolAccount();
        const userAddress = client.getPublicKey().toString();

        const hasPermission =
          protocol.owner === userAddress ||
          protocol.accessControl.entries.some(
            (entry) =>
              entry.account === userAddress &&
              (entry.role === 'AssetManager' || entry.role.toLowerCase() === 'owner'),
          );

        setHasPermission(hasPermission);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasPermission(false);
      }
    };

    checkPermission();
  }, [client, authenticated]);

  const createAsset = trpc.asset.createAsset.useMutation({
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
      priceConfig: {
        provider: {
          name: 'Dexscreener',
          id: '',
          chain: '',
        },
        twp: {
          seconds: 60,
        },
        updateFrequencySeconds: 60,
      },
      logo: '',
      permissions: {
        allowLong: true,
        allowShort: true,
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

    // Basic validation (all required fields already validated by Zod)
    try {
      setIsSubmitting(true);

      if (!client) {
        toast({
          title: 'Client Error',
          description: 'Client not initialized',
          variant: 'destructive',
        });
        return;
      }

      const { assetAddress, txSignature } = await client.addAsset(values.ticker, {
        allowLongs: values.permissions.allowLong,
        allowShorts: values.permissions.allowShort,
      });

      // Create asset input with the correct structure expected by the API
      const assetInput = {
        assetAddress: assetAddress.toString(),
        ticker: values.ticker,
        name: values.name,
        logo: values.logo,
        priceConfig: {
          provider: {
            id: values.priceConfig.provider.id,
            chain: values.priceConfig.provider.chain ?? '',
            name: values.priceConfig.provider.name,
          },
          twp: {
            seconds: values.priceConfig.twp.seconds,
          },
          updateFrequencySeconds: values.priceConfig.updateFrequencySeconds,
        },
      };
      await createAsset.mutateAsync(assetInput);

      showTransactionToast({
        title: 'Asset Listed',
        description: `The asset ${values.ticker} has been listed`,
        txSignature,
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

  if (!hasPermission) {
    return null;
  }

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

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex-1 overflow-y-auto space-y-6 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              <FormField
                control={form.control}
                name="ticker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticker</FormLabel>
                    <FormControl>
                      <Input placeholder="BTC" {...field} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-[#666]">
                      Enter the ticker for the asset (e.g., BTC, ETH)
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Bitcoin" {...field} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-[#666]">Enter the full name of the asset</p>
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Price Config</FormLabel>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <FormField
                      control={form.control}
                      name="priceConfig.provider.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provider Name</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Provider" />
                              </SelectTrigger>
                              <SelectContent>
                                {providerOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Choose the price provider source
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <FormField
                      control={form.control}
                      name="priceConfig.provider.id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provider ID</FormLabel>
                          <FormControl>
                            <Input className="text-xs" placeholder="e.g. BTCUSDT" {...field} />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            The asset ID for the provider
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <FormField
                      control={form.control}
                      name="priceConfig.provider.chain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provider Chain (optional)</FormLabel>
                          <FormControl>
                            <Input className="text-xs" placeholder="e.g. solana" {...field} />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">Chain (if applicable)</p>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <FormField
                      control={form.control}
                      name="priceConfig.twp.seconds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TWP Seconds</FormLabel>
                          <FormControl>
                            <Input className="text-xs" type="number" placeholder="60" {...field} />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Time-weighted period in seconds
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <FormField
                      control={form.control}
                      name="priceConfig.updateFrequencySeconds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Update Frequency (seconds)</FormLabel>
                          <FormControl>
                            <Input className="text-xs" type="number" placeholder="60" {...field} />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            How often price updates (seconds)
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-[#E5E7EB]/60">Logo URL for the asset (required)</p>
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Permissions</FormLabel>
                <div className="flex items-center space-x-4">
                  <FormField
                    control={form.control}
                    name="permissions.allowLong"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="accent-blue-500 h-5 w-5"
                          />
                        </FormControl>
                        <FormLabel className="text-white">Allow Long</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="permissions.allowShort"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="accent-blue-500 h-5 w-5"
                          />
                        </FormControl>
                        <FormLabel className="text-white">Allow Short</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/10">
                <Button
                  type="submit"
                  className="h-11 px-8 bg-blue-500 text-white hover:bg-blue-500/90 rounded-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding Asset...' : 'List New Asset'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
