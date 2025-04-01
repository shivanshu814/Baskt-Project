'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/src/button';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/src/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/src/form';
import { Input } from '../../components/src/input';
import { Switch } from '../../components/src/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/src/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/src/collapsible';
import { useToast } from '../../hooks/use-toast';
import { AddOracleModal } from './AddOracleModal';

const formSchema = z.object({
  ticker: z.string().min(1, { message: 'Ticker is required' }),
  oracleType: z.enum(['Pyth', 'Switchboard', 'Custom']),
  oracleAddress: z.string().min(32, { message: 'Valid oracle address required' }),
  // Asset permissions
  permissions: z.object({
    allowLong: z.boolean().default(true),
    allowShort: z.boolean().default(true),
  }),
  // Oracle parameters
  maxPriceError: z.string(),
  maxPriceAgeSec: z.string(),
  // Fee structure
  fees: z.object({
    openFee: z.string().default('0.1'),
    closeFee: z.string().default('0.1'),
    fundingFee: z.string().default('0.01'),
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function ListNewAssetButton() {
  const [open, setOpen] = useState(false);
  const [showAddOracleModal, setShowAddOracleModal] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [feesOpen, setFeesOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticker: '',
      oracleType: 'Pyth',
      oracleAddress: '',
      permissions: {
        allowLong: true,
        allowShort: true,
      },
      maxPriceError: '100',
      maxPriceAgeSec: '60',
      fees: {
        openFee: '0.1',
        closeFee: '0.1',
        fundingFee: '0.01',
      },
    },
  });

  const onSubmit = (values: FormValues) => {
    toast({
      title: 'Asset Listed Successfully',
      description: `The asset ${values.ticker} has been listed and is now available for basket creation.`,
    });

    setOpen(false);
    form.reset();
  };

  const handleAddNewOracle = () => {
    setShowAddOracleModal(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> List New Asset
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>List New Asset</DialogTitle>
            <DialogDescription>
              Add a new asset to make it available for user baskets.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="ticker"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Ticker</FormLabel>
                      <FormControl>
                        <Input placeholder="BTC-USD" {...field} />
                      </FormControl>
                      <FormDescription>Specify a ticker for the asset</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="oracleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oracle Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select oracle type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pyth">Pyth</SelectItem>
                          <SelectItem value="Switchboard">Switchboard</SelectItem>
                          <SelectItem value="Custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Select the oracle feed type</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="oracleAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Oracle Address</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Enter oracle address" {...field} />
                        </FormControl>
                        <Button type="button" variant="outline" onClick={handleAddNewOracle}>
                          New Oracle
                        </Button>
                      </div>
                      <FormDescription>
                        Specify the oracle account address or create a new one
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxPriceError"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Price Error</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Maximum allowed price error</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxPriceAgeSec"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Price Age (seconds)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Maximum age of price in seconds</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Asset Permissions Collapsible */}
                <div className="md:col-span-2">
                  <Collapsible
                    open={permissionsOpen}
                    onOpenChange={setPermissionsOpen}
                    className="border rounded-md p-2"
                  >
                    <div className="flex items-center justify-between px-4">
                      <h4 className="text-sm font-semibold">Asset Permissions</h4>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                          {permissionsOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent className="pt-2 px-4 space-y-2">
                      <FormField
                        control={form.control}
                        name="permissions.allowLong"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Allow Long</FormLabel>
                              <FormDescription>
                                Allow users to go long on this asset
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="permissions.allowShort"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Allow Short</FormLabel>
                              <FormDescription>
                                Allow users to go short on this asset
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Fee Structure Collapsible */}
                <div className="md:col-span-2">
                  <Collapsible
                    open={feesOpen}
                    onOpenChange={setFeesOpen}
                    className="border rounded-md p-2"
                  >
                    <div className="flex items-center justify-between px-4">
                      <h4 className="text-sm font-semibold">Fee Structure</h4>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                          {feesOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent className="pt-2 px-4 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="fees.openFee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Open Fee (%)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormDescription>Fee charged when opening positions</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="fees.closeFee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Close Fee (%)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormDescription>Fee charged when closing positions</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="fees.fundingFee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Funding Fee (%)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormDescription>Recurring funding fee</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">List Asset</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AddOracleModal
        open={showAddOracleModal}
        onOpenChange={setShowAddOracleModal}
        onOracleAdded={(address) => {
          if (address) {
            form.setValue('oracleAddress', address);
          }
          setShowAddOracleModal(false);
        }}
      />
    </>
  );
}
