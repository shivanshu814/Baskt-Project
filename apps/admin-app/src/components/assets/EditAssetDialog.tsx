'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Input,
} from '@baskt/ui';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { providerOptions, EditAssetDialogProps } from '../../types/assets';

const editAssetSchema = z.object({
  name: z.string().optional(),
  logo: z.string().url('Please enter a valid logo URL').optional().or(z.literal('')),
  priceConfig: z
    .object({
      provider: z
        .object({
          name: z
            .enum(providerOptions.map((o) => o.toLowerCase()) as [string, ...string[]])
            .optional(),
          id: z.string().optional(),
          chain: z.string().optional(),
        })
        .optional(),
      twp: z
        .object({
          seconds: z.coerce.number().int().min(1, 'TWP seconds required').optional(),
        })
        .optional(),
      updateFrequencySeconds: z.coerce
        .number()
        .int()
        .min(1, 'Update frequency required')
        .optional(),
      units: z.coerce.number().positive('Units must be positive').optional(),
    })
    .optional(),
  coingeckoId: z.string().optional(),
});

type EditAssetFormValues = z.infer<typeof editAssetSchema>;

export function EditAssetDialog({ isOpen, onClose, onSave, asset }: EditAssetDialogProps) {
  const form = useForm<EditAssetFormValues>({
    resolver: zodResolver(editAssetSchema),
    defaultValues: {
      name: '',
      logo: '',
      priceConfig: {
        provider: {
          name: '',
          id: '',
          chain: '',
        },
        twp: {
          seconds: 60,
        },
        updateFrequencySeconds: 60,
        units: 1,
      },
      coingeckoId: '',
    },
  });

  const isPopulating = isOpen && !form.watch('name') && !!asset;

  useEffect(() => {
    if (asset) {
      form.reset({
        name: asset.name || '',
        logo: asset.logo || '',
        priceConfig: {
          provider: {
            name: asset.config?.provider?.name?.toLowerCase() || '',
            id: asset.config?.provider?.id || '',
            chain: asset.config?.provider?.chain || '',
          },
          twp: {
            seconds: asset.config?.twp?.seconds || 60,
          },
          updateFrequencySeconds: asset.config?.updateFrequencySeconds || 60,
          units: asset.config?.units || 1,
        },
        coingeckoId: asset.config?.coingeckoId || '',
      });
    }
  }, [asset, form, isOpen]);

  const onSubmit = (data: EditAssetFormValues) => {
    if (asset) {
      // Only include fields that have been changed (not empty)
      // eslint-disable-next-line
      const updateData: any = {};

      if (data.name && data.name.trim() !== '') {
        updateData.name = data.name;
      }

      if (data.logo && data.logo.trim() !== '') {
        updateData.logo = data.logo;
      }

      if (data.coingeckoId) {
        updateData.coingeckoId = data.coingeckoId;
      }

      if (data.priceConfig) {
        updateData.priceConfig = {};

        if (data.priceConfig.provider) {
          updateData.priceConfig.provider = {};
          if (data.priceConfig.provider.name)
            updateData.priceConfig.provider.name = data.priceConfig.provider.name;
          if (data.priceConfig.provider.id)
            updateData.priceConfig.provider.id = data.priceConfig.provider.id;
          if (data.priceConfig.provider.chain)
            updateData.priceConfig.provider.chain = data.priceConfig.provider.chain;
        }

        if (data.priceConfig.twp?.seconds) {
          updateData.priceConfig.twp = { seconds: data.priceConfig.twp.seconds };
        }

        if (data.priceConfig.updateFrequencySeconds) {
          updateData.priceConfig.updateFrequencySeconds = data.priceConfig.updateFrequencySeconds;
        }

        if (data.priceConfig.units) {
          updateData.priceConfig.units = data.priceConfig.units;
        }
      }

      onSave(asset._id, updateData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Name (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder={isPopulating ? 'Loading...' : 'e.g. Bitcoin'}
                        disabled={isPopulating}
                      />
                      {isPopulating && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">Leave empty to keep current value</p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder={isPopulating ? 'Loading...' : 'https://example.com/logo.png'}
                        disabled={isPopulating}
                      />
                      {isPopulating && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">Leave empty to keep current value</p>
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Price Configuration (Optional)</FormLabel>
              <p className="text-xs text-muted-foreground mb-4">
                Only fill in the fields you want to change
              </p>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="priceConfig.provider.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Name (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isPopulating}
                      >
                        <FormControl>
                          <SelectTrigger>
                            {isPopulating ? (
                              <div className="flex items-center text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                              </div>
                            ) : (
                              <SelectValue placeholder="Select a provider (optional)" />
                            )}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {providerOptions.map((option) => (
                            <SelectItem key={option} value={option.toLowerCase()}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priceConfig.provider.id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider ID (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            placeholder={isPopulating ? 'Loading...' : 'eg. BTCUSDT'}
                            disabled={isPopulating}
                          />
                          {isPopulating && (
                            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priceConfig.provider.chain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Chain (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            placeholder={isPopulating ? 'Loading...' : 'e.g. solana'}
                            disabled={isPopulating}
                          />
                          {isPopulating && (
                            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priceConfig.twp.seconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TWP Seconds (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="number"
                              placeholder={isPopulating ? 'Loading...' : '60'}
                              disabled={isPopulating}
                            />
                            {isPopulating && (
                              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priceConfig.updateFrequencySeconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Update Frequency (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="number"
                              placeholder={isPopulating ? 'Loading...' : '60'}
                              disabled={isPopulating}
                            />
                            {isPopulating && (
                              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="priceConfig.units"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Units (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="number"
                            placeholder={isPopulating ? 'Loading...' : '1'}
                            disabled={isPopulating}
                          />
                          {isPopulating && (
                            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">Price multiplier (default: 1)</p>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="coingeckoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CoinGecko ID (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder={isPopulating ? 'Loading...' : 'bitcoin'}
                        disabled={isPopulating}
                      />
                      {isPopulating && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    CoinGecko ID for historical data (e.g., bitcoin, ethereum)
                  </p>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting || isPopulating}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
