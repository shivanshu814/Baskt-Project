'use client';

import { z } from 'zod';
import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import { useToast } from '../../hooks/use-toast';
import { Plus, ChevronDown } from 'lucide-react';
import { AddOracleModal } from './AddOracleModal';
import { zodResolver } from '@hookform/resolvers/zod';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';

const formSchema = z.object({
  ticker: z.string().min(1, { message: 'Ticker is required' }),
  oracleType: z.enum(['Pyth', 'Switchboard', 'Custom']),
  oracleAddress: z.string().min(32, { message: 'Valid oracle address required' }),

  permissions: z.object({
    allowLong: z.boolean().default(true),
    allowShort: z.boolean().default(true),
  }),

  maxPriceError: z.string(),
  maxPriceAgeSec: z.string(),

  fees: z.object({
    openFee: z.string().default('0.1'),
    closeFee: z.string().default('0.1'),
    fundingFee: z.string().default('0.01'),
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function ListNewAssetButton() {
  const [showModal, setShowModal] = useState(false);
  const [showAddOracleModal, setShowAddOracleModal] = useState(false);
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

    setShowModal(false);
    form.reset();
  };

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        <Plus className="mr-2 h-4 w-4" /> List New Asset
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#010b1d] border-white/10 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">List New Asset</DialogTitle>
            <DialogDescription className="text-[#E5E7EB]">
              Add a new asset to make it available for user baskets.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-base font-medium text-white">Asset Name</label>
                <Input
                  placeholder="Bitcoin"
                  className="h-12 bg-[#0d1117] border-0 ring-1 ring-white/5 text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0"
                />
                <p className="text-sm text-[#666]">Enter the name of the asset</p>
              </div>
              <div className="space-y-2">
                <label className="text-base font-medium text-white">Asset Type</label>
                <Select>
                  <SelectTrigger className="h-12 bg-[#0d1117] border-0 ring-[0.5px] ring-white/5 text-white text-base rounded-2xl focus-visible:ring-[0.5px] focus-visible:ring-white/10 focus-visible:ring-offset-0 data-[value]:ring-[0.5px] data-[value]:ring-white/5">
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1117] border-0 ring-[0.5px] ring-white/5 rounded-2xl max-h-[200px] overflow-y-auto">
                    <SelectItem
                      value="crypto"
                      className="text-white hover:bg-white/5 data-[state=checked]:bg-white/10"
                    >
                      Cryptocurrency
                    </SelectItem>
                    <SelectItem
                      value="forex"
                      className="text-white hover:bg-white/5 data-[state=checked]:bg-white/10"
                    >
                      Forex
                    </SelectItem>
                    <SelectItem
                      value="commodity"
                      className="text-white hover:bg-white/5 data-[state=checked]:bg-white/10"
                    >
                      Commodity
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-[#666]">Select the type of asset</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Oracle Type</label>
              <Select>
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
                    value="chainlink"
                    className="text-white hover:bg-white/5 data-[state=checked]:bg-white/10"
                  >
                    Chainlink
                  </SelectItem>
                  <SelectItem
                    value="custom"
                    className="text-white hover:bg-white/5 data-[state=checked]:bg-white/10"
                  >
                    Custom
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[#E5E7EB]/60">Select the oracle feed type</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Oracle Address</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter oracle address"
                  className="h-12 bg-[#0d1117] border-0 ring-1 ring-white/5 text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0"
                />
                <Button
                  variant="outline"
                  className="h-12 bg-[#0d1117] text-white hover:bg-[#1a1f2e] hover:text-white border-0 ring-1 ring-white/5 rounded-2xl"
                >
                  New Oracle
                </Button>
              </div>
              <p className="text-xs text-[#E5E7EB]/60">
                Specify the oracle account address or create a new one
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Max Price Error</label>
                <Input
                  type="number"
                  placeholder="100"
                  className="h-12 bg-[#0d1117] border-0 ring-1 ring-white/5 text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0"
                />
                <p className="text-xs text-[#E5E7EB]/60">Maximum allowed price error</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Max Price Age (seconds)</label>
                <Input
                  type="number"
                  placeholder="60"
                  className="h-12 bg-[#0d1117] border-0 ring-1 ring-white/5 text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0"
                />
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
                <div className="rounded-md border border-white/10 p-4 bg-[#0d1117]">
                  <p className="text-sm text-[#E5E7EB]/60">Configure asset permissions here</p>
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

          <div className="flex justify-end">
            <Button
              type="submit"
              className="h-11 px-8 bg-blue-500 text-white hover:bg-blue-500/90 rounded-full"
              onClick={() => onSubmit(form.getValues())}
            >
              List New Asset
            </Button>
          </div>
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
