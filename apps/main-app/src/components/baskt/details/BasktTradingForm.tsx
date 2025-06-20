import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Slider,
  NumberFormat,
  useBasktClient,
} from '@baskt/ui';
import { useState } from 'react';
import { toast } from 'sonner';
import { BasktTradingFormProps } from '../../../types/baskt';
import { useUSDCBalance } from '../../../hooks/pool/useUSDCBalance';
import { useOpenPosition } from '../../../hooks/baskt/trade/useOpenPositions';
import { BN } from '@coral-xyz/anchor';

export function BasktTradingForm({ baskt, className }: BasktTradingFormProps) {
  const [size, setSize] = useState<number>(0);
  const { isLoading, openPosition, getLiquidationPrice, collateral, usdcBalance } = useOpenPosition(
    {
      baskt,
      size,
    },
  );
  const { client } = useBasktClient();
  const publicKey = client?.wallet?.address;
  const { account: userUSDCAccount } = useUSDCBalance(publicKey);

  const handlesizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setSize(value);
    }
  };

  const handlesizeSliderChange = (value: number[]) => {
    setSize(value[0]);
  };

  const handleTrade = async (position: 'long' | 'short') => {
    if (!publicKey || !client || !userUSDCAccount) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!baskt.isActive) {
      toast.error('This baskt is not active yet. Please try again later.');
      return;
    }

    try {
      await openPosition(position, size);
      // eslint-disable-next-line
    } catch (error: any) {
      toast.error(error.message || 'Failed to open position');
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
          <TabsTrigger value="long">Long</TabsTrigger>
          <TabsTrigger value="short">Short</TabsTrigger>
        </TabsList>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Size</label>
              <span className="text-sm text-muted-foreground">Balance: ${usdcBalance}</span>
            </div>
            <Input
              type="number"
              value={size}
              onChange={handlesizeChange}
              className="mb-2"
              disabled={isLoading}
            />
            <Slider
              defaultValue={[1500]}
              min={100}
              max={parseFloat(usdcBalance)}
              step={100}
              value={[size]}
              onValueChange={handlesizeSliderChange}
              disabled={isLoading}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>$100</span>
              <span>${parseFloat(usdcBalance) / 2}</span>
              <span>${usdcBalance.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Price:</span>
              <span>
                <NumberFormat value={new BN(baskt.price).toNumber()} isPrice={true} />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Size:</span>
              <span>
                <NumberFormat value={new BN(size).toNumber()} />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Collateral:</span>
              <span>${collateral.toString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Liquidation Price:</span>
              <TabsContent value="long" className="m-0 p-0">
                <span className="text-[#EA3943]">
                  ${getLiquidationPrice(size, 'long').toFixed(2)}
                </span>
              </TabsContent>
              <TabsContent value="short" className="m-0 p-0">
                <span className="text-[#EA3943]">
                  ${getLiquidationPrice(size, 'short').toFixed(2)}
                </span>
              </TabsContent>
            </div>
          </div>
        </div>

        <TabsContent value="long" className="mt-4">
          <Button
            className="w-full bg-[#16C784] hover:bg-[#16C784]/90"
            onClick={() => handleTrade('long')}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Trade'}
          </Button>
        </TabsContent>

        <TabsContent value="short" className="mt-4">
          <Button
            className="w-full bg-[#EA3943] hover:bg-[#EA3943]/90"
            onClick={() => handleTrade('short')}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Trade'}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
