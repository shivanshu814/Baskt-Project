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

const editProviderSchema = z.object({
  name: z.enum(providerOptions.map((o) => o.toLowerCase()) as [string, ...string[]]),
  id: z.string().min(1, 'Provider ID is required'),
  chain: z.string().optional(),
});

type EditProviderFormValues = z.infer<typeof editProviderSchema>;

export function EditAssetDialog({ isOpen, onClose, onSave, asset }: EditAssetDialogProps) {
  const form = useForm<EditProviderFormValues>({
    resolver: zodResolver(editProviderSchema),
    defaultValues: {
      name: '',
      id: '',
      chain: '',
    },
  });

  const isPopulating = isOpen && !form.watch('id') && !!asset;

  useEffect(() => {
    if (asset?.config?.provider) {
      form.reset({
        name: asset.config.provider.name.toLowerCase(),
        id: asset.config.provider.id,
        chain: asset.config.provider.chain || '',
      });
    }
  }, [asset, form, isOpen]);

  const onSubmit = (data: EditProviderFormValues) => {
    if (asset) {
      onSave(asset._id, { ...data, chain: data.chain || '' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Asset Price Provider</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider Name</FormLabel>
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
                          <SelectValue placeholder="Select a provider" />
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
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider ID</FormLabel>
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
              name="chain"
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
