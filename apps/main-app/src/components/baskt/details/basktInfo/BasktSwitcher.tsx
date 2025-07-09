'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  NumberFormat,
} from '@baskt/ui';
import { useBasktList } from '../../../../hooks/baskt/useBasktList';
import { BasktInfo } from '@baskt/types';

interface BasktSwitcherProps {
  currentBaskt: BasktInfo;
}

export const BasktSwitcher = ({ currentBaskt }: BasktSwitcherProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { filteredBaskts } = useBasktList();

  const filteredBasktsForSwitcher = useMemo(() => {
    if (!searchQuery) return filteredBaskts;
    const query = searchQuery.trim().toLowerCase();
    return filteredBaskts.filter((baskt) => {
      const nameMatch = baskt.name?.toLowerCase().includes(query);
      const assetMatch = baskt.assets?.some((asset) => asset.name.toLowerCase().includes(query));
      return nameMatch || assetMatch;
    });
  }, [filteredBaskts, searchQuery]);

  const handleBasktSelect = (basktName: string) => {
    setOpen(false);
    setSearchQuery('');

    const encodedName = encodeURIComponent(basktName);
    router.push(`/baskts/${encodedName}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a baskt"
          className="flex items-center gap-2 px-3 py-2 h-auto bg-transparent hover:bg-muted/50 border-border border-2"
        >
          <div className="flex flex-row items-center">
            <span className="font-semibold text-lg sm:text-xl text-primary">
              {currentBaskt.name}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <div className="flex items-center py-2">
            <CommandInput
              placeholder="Search baskts..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="border-none focus:ring-0 w-96"
            />
          </div>
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No baskts found.</CommandEmpty>
            <CommandGroup>
              {filteredBasktsForSwitcher.map((baskt) => (
                <CommandItem
                  key={baskt.basktId?.toString()}
                  value={baskt.name}
                  onSelect={() => handleBasktSelect(baskt.name)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">{baskt.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {baskt.assets?.length || 0} assets
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">
                      <NumberFormat value={baskt.price} isPrice={true} />
                    </span>
                    <span
                      className={`text-xs ${
                        baskt?.performance?.day >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      <NumberFormat value={baskt?.performance?.day || 0} />%
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
