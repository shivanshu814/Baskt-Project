import { useState } from 'react';
import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { useBasktClient } from '@baskt/ui';
import { toast } from '../../common/use-toast';
import { UseOpenPositionProps } from '../../../types/baskt';
import {
  calculateCollateralAmount,
  calculateLiquidationPrice,
} from '../../../utils/baskt/trade/calculate';
import { PRICE_PRECISION } from '@baskt/ui';
import { useUSDCBalance } from '../../pool/useUSDCBalance';

export const useOpenPosition = ({ baskt, size }: UseOpenPositionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { client } = useBasktClient();
  const publicKey = client?.wallet?.address;
  const {
    balance: usdcBalance,
    account: userUSDCAccount,
    refetch: refetchUSDCBalance,
  } = useUSDCBalance(publicKey);
  const collateral = calculateCollateralAmount(new BN(size));

  const getLiquidationPrice = (collateral: number, position: 'long' | 'short') => {
    return calculateLiquidationPrice({
      collateral,
      price: baskt.price,
      leverage: 1.5,
      position,
    });
  };

  const openPosition = async (position: 'long' | 'short', size: number) => {
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
      setIsLoading(true);

      const orderId = new BN(Date.now());

      if (collateral.lte(new BN(0))) {
        throw new Error('Collateral amount must be greater than 0');
      }

      const tx = await client.createOrderTx(
        orderId,
        new BN(size).mul(new BN(PRICE_PRECISION)),
        collateral.mul(new BN(PRICE_PRECISION)),
        position === 'long',
        { open: {} },
        null,
        new PublicKey(baskt.basktId),
        userUSDCAccount?.address,
        new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT || ''),
      );

      const confirmation = await client.connection.confirmTransaction(tx);

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      refetchUSDCBalance();

      toast({
        title: `${position === 'long' ? 'Long' : 'Short'} position opened`,
        description: `Your ${position} position with ${collateral.toLocaleString()} USDT collateral has been opened`,
      });

      return true;
      // eslint-disable-next-line
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to open position',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    openPosition,
    getLiquidationPrice,
    usdcBalance,
    userUSDCAccount,
    collateral,
  };
};
