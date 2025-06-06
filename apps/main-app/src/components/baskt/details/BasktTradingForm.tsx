import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { Slider } from '../../ui/slider';
import { useState } from 'react';
import { toast } from '../../../hooks/common/use-toast';
import { BasktTradingFormProps } from '../../../types/baskt';
import { useBasktClient } from '@baskt/ui';
import { useUSDCBalance } from '../../../hooks/pool/useUSDCBalance';
import { useOpenPosition } from '../../../hooks/baskt/trade/openPosition';

export function BasktTradingForm({ baskt, userPosition = null, className }: BasktTradingFormProps) {
  const [collateral, setCollateral] = useState<number>(1500);
  const { isLoading, openPosition, getEstimatedShares, getLiquidationPrice } = useOpenPosition({ baskt });
  const { client } = useBasktClient();
  const publicKey = client?.wallet?.address;
  const { account: userUSDCAccount } = useUSDCBalance(publicKey);

  const handleCollateralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setCollateral(value);
    }
  };

  const handleCollateralSliderChange = (value: number[]) => {
    setCollateral(value[0]);
  };

  const handleTrade = async (position: 'long' | 'short') => {
    if (!publicKey || !client || !userUSDCAccount) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    if (!baskt.isActive) {
      toast({
        title: 'Error',
        description: 'This baskt is not active yet. Please try again later.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await openPosition(position, collateral);
      // eslint-disable-next-line 
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to open position',
        variant: 'destructive',
      });
    }
  };

  if (!baskt.isActive) {
    return (
      <div className={`w-full ${className}`}>
        <h2 className="text-xl font-bold mb-4">Trade {baskt.name}</h2>
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-500 text-sm">
            This baskt is not active yet. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <h2 className="text-xl font-bold mb-4">Trade {baskt.name}</h2>

      <Tabs defaultValue="long" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="long">Buy/Long</TabsTrigger>
          <TabsTrigger value="short">Sell/Short</TabsTrigger>
        </TabsList>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Collateral (USDT)</label>
              <span className="text-sm text-muted-foreground">
                Balance: ${userPosition?.userBalance.toLocaleString() || 50000}
              </span>
            </div>
            <Input
              type="number"
              value={collateral}
              onChange={handleCollateralChange}
              className="mb-2"
              disabled={isLoading}
            />
            <Slider
              defaultValue={[1500]}
              min={100}
              max={userPosition?.userBalance || 50000}
              step={100}
              value={[collateral]}
              onValueChange={handleCollateralSliderChange}
              disabled={isLoading}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>$100</span>
              <span>${((userPosition?.userBalance || 50000) / 2).toLocaleString()}</span>
              <span>${(userPosition?.userBalance || 50000).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Price:</span>
              <span>${baskt.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Estimated Shares:</span>
              <span>{getEstimatedShares(collateral).toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Liquidation Price:</span>
              <TabsContent value="long" className="m-0 p-0">
                <span className="text-[#EA3943]">${getLiquidationPrice(collateral, 'long').toFixed(2)}</span>
              </TabsContent>
              <TabsContent value="short" className="m-0 p-0">
                <span className="text-[#EA3943]">${getLiquidationPrice(collateral, 'short').toFixed(2)}</span>
              </TabsContent>
            </div>
          </div>
        </div>

        <TabsContent value="long" className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            You'll profit if {baskt.name} increases in value
          </p>
          <Button
            className="w-full bg-[#16C784] hover:bg-[#16C784]/90"
            onClick={() => handleTrade('long')}
            disabled={isLoading}
          >
            {isLoading ? 'Opening Position...' : 'Open Long Position'}
          </Button>
        </TabsContent>

        <TabsContent value="short" className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            You'll profit if {baskt.name} decreases in value
          </p>
          <Button
            className="w-full bg-[#EA3943] hover:bg-[#EA3943]/90"
            onClick={() => handleTrade('short')}
            disabled={isLoading}
          >
            {isLoading ? 'Opening Position...' : 'Open Short Position'}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
