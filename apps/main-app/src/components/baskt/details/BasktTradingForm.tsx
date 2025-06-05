import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { Slider } from '../../ui/slider';
import { useState } from 'react';
import { toast } from '../../../hooks/common/use-toast';
import { BasktTradingFormProps } from '../../../types/baskt';

export function BasktTradingForm({ baskt, userPosition = null, className }: BasktTradingFormProps) {
  const [collateral, setCollateral] = useState<number>(1500);

  const handleCollateralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setCollateral(value);
    }
  };

  const handleCollateralSliderChange = (value: number[]) => {
    setCollateral(value[0]);
  };

  const getEstimatedShares = () => {
    return collateral / baskt.price / 1.5;
  };

  const getLiquidationPrice = (position: 'long' | 'short') => {
    const positionSize = collateral / 1.5;
    const ratio = collateral / positionSize;
    if (position === 'long') {
      return baskt.price * (1 - (ratio - 1));
    } else {
      return baskt.price * (1 + (ratio - 1));
    }
  };

  const handleTrade = (position: 'long' | 'short') => {
    toast({
      title: `${position === 'long' ? 'Long' : 'Short'} position opened`,
      description: `Your ${position} position with ${collateral.toLocaleString()} USDT collateral has been opened`,
    });
  };

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
            />
            <Slider
              defaultValue={[1500]}
              min={100}
              max={userPosition?.userBalance || 50000}
              step={100}
              value={[collateral]}
              onValueChange={handleCollateralSliderChange}
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
              <span>{getEstimatedShares().toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Liquidation Price:</span>
              <TabsContent value="long" className="m-0 p-0">
                <span className="text-[#EA3943]">${getLiquidationPrice('long').toFixed(2)}</span>
              </TabsContent>
              <TabsContent value="short" className="m-0 p-0">
                <span className="text-[#EA3943]">${getLiquidationPrice('short').toFixed(2)}</span>
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
          >
            Open Long Position
          </Button>
        </TabsContent>

        <TabsContent value="short" className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            You'll profit if {baskt.name} decreases in value
          </p>
          <Button
            className="w-full bg-[#EA3943] hover:bg-[#EA3943]/90"
            onClick={() => handleTrade('short')}
          >
            Open Short Position
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
