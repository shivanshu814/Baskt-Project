import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  NumberFormat,
  useBasktClient,
} from '@baskt/ui';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { BasktTradingFormProps } from '../../../types/baskt';
import { useUSDCBalance } from '../../../hooks/pool/useUSDCBalance';
import { useOpenPosition } from '../../../hooks/baskt/trade/useOpenPositions';
import { BN } from '@coral-xyz/anchor';

export function BasktTradingForm({ baskt }: BasktTradingFormProps) {
  const [size, setSize] = useState<number>(0);
  const [sizeInput, setSizeInput] = useState<string>('');

  const prevPriceRef = useRef<number | null>(null);
  const [priceColor, setPriceColor] = useState('text-foreground');
  const [currentPrice, setCurrentPrice] = useState<number>(new BN(baskt.price).toNumber());

  const { isLoading, openPosition, collateral, getLiquidationPrice, usdcBalance } = useOpenPosition(
    {
      baskt,
      navPrice: new BN(currentPrice),
      usdcSize: size,
    },
  );
  const { client } = useBasktClient();
  const publicKey = client?.wallet?.address;
  const { account: userUSDCAccount } = useUSDCBalance(publicKey);

  useEffect(() => {
    if (prevPriceRef.current !== null) {
      if (currentPrice > prevPriceRef.current) {
        setPriceColor('text-green-500');
      } else if (currentPrice < prevPriceRef.current) {
        setPriceColor('text-red-500');
      } else {
        setPriceColor('text-foreground');
      }
    }
    prevPriceRef.current = currentPrice;
  }, [currentPrice]);

  const handlesizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setSize(value);
      setSizeInput(value.toString());
    } else {
      setSizeInput(e.target.value);
    }
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

  return (
    <div className="h-full border-l border-muted-foreground/20 pl-4 p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg sm:text-xl font-semibold">Trade {baskt.name}</span>
        <span className={`text-lg font-bold sm:text-xl ml-2 ${priceColor}`}>
          <NumberFormat value={currentPrice} isPrice={true} showCurrency={true} />
        </span>
      </div>
      {!baskt.isActive ? (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-500 text-xs sm:text-sm">
            This baskt is not active yet. Please try again later.
          </p>
        </div>
      ) : (
        <Tabs defaultValue="long" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="long">Long</TabsTrigger>
            <TabsTrigger value="short">Short</TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs sm:text-sm font-medium">Size</label>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Balance: <NumberFormat value={Number(usdcBalance) * 1e6} isPrice={true} />
                </span>
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={sizeInput}
                onChange={handlesizeChange}
                className="mb-2"
                disabled={isLoading}
                min="0.00001"
                onKeyDown={(e) => {
                  if (e.key === '-') {
                    e.preventDefault();
                  }
                }}
              />
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Current Price:</span>
                <span>
                  <NumberFormat value={currentPrice} isPrice={true} showCurrency={true} />
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Collateral:</span>
                <span>${collateral.toString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Liquidation Price:</span>
                <TabsContent value="long" className="m-0 p-0">
                  <span>---</span>
                </TabsContent>
                <TabsContent value="short" className="m-0 p-0">
                  <span>
                    {getLiquidationPrice(size, 'short') !== null &&
                    getLiquidationPrice(size, 'short') !== undefined &&
                    !isNaN(getLiquidationPrice(size, 'short')) ? (
                      <span className="text-[#EA3943]">
                        <NumberFormat
                          value={getLiquidationPrice(size, 'short')}
                          isPrice={true}
                          showCurrency={true}
                        />
                      </span>
                    ) : (
                      '---'
                    )}
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
              {isLoading ? 'Confirming...' : 'Place Order'}
            </Button>
          </TabsContent>

          <TabsContent value="short" className="mt-4">
            <Button
              className="w-full bg-[#EA3943] hover:bg-[#EA3943]/90"
              onClick={() => handleTrade('short')}
              disabled={isLoading}
            >
              {isLoading ? 'Confirming...' : 'Place Order'}
            </Button>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
