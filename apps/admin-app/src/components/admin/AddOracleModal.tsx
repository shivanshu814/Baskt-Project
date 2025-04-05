'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AddOracleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOracleAdded: (address: string) => void;
}

export function AddOracleModal({ open, onOpenChange, onOracleAdded }: AddOracleModalProps) {
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
                className="h-12 bg-[#0d1117] border-0 ring-1 ring-white/5 text-white text-base placeholder:text-[#666] rounded-2xl focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0"
              />
              <p className="text-sm text-[#666]">A descriptive name for this oracle</p>
            </div>
            <div className="space-y-2">
              <label className="text-base font-medium text-white">Oracle Type</label>
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
              <p className="text-sm text-[#666]">Select the oracle type to use</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="h-11 px-8 bg-blue-500 text-white hover:bg-blue-500/90 rounded-full"
            onClick={() => onOracleAdded('mock-address')}
          >
            Add Oracle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
