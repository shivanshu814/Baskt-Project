import { OnchainPosition, PositionStatus } from '@baskt/types';
import { trpc } from '../../../utils/trpc';
import { USDC_MINT, useBasktClient } from '@baskt/ui';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { useUSDCBalance } from '../../pool/useUSDCBalance';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UseOpenPositionProps } from '../../../types/baskt';
import {
  calculateCollateralAmount,
  calculateLiquidationPrice,
} from '../../../utils/baskt/trade/calculate';
import { PRICE_PRECISION } from '@baskt/ui';

export function useOpenPositions(basktId?: string, userAddress?: string) {
  const { client } = useBasktClient();
  const { account: userUSDCAccount, refetch: refetchUSDCBalance } = useUSDCBalance();

  const positionsByBasktAndUserQuery = trpc.position.getPositions.useQuery(
    { basktId: basktId || '', userId: userAddress || '' },
    {
      enabled: !!basktId && !!userAddress,
      refetchInterval: 10 * 1000,
    },
  );

  useEffect(() => {
    const handlePositionOpened = () => {
      positionsByBasktAndUserQuery.refetch();
    };

    window.addEventListener('position-opened', handlePositionOpened);
    return () => {
      window.removeEventListener('position-opened', handlePositionOpened);
    };
  }, [positionsByBasktAndUserQuery]);

  const closePosition = async (position: OnchainPosition) => {
    if (!client || !userUSDCAccount || !basktId) return;
    await client.createOrderTx(
      new BN(Date.now()),
      new BN(1),
      new BN(0),
      position.isLong,
      { close: {} },
      new PublicKey(position.address),
      new PublicKey(basktId),
      userUSDCAccount.address,
      USDC_MINT,
    );
    refetchUSDCBalance();
    positionsByBasktAndUserQuery.refetch();
  };

  const addCollateral = async (position: OnchainPosition, additionalCollateral: BN) => {
    if (!client || !userUSDCAccount) return;
    await client.addCollateral({
      position: new PublicKey(position.address),
      additionalCollateral,
      ownerTokenAccount: userUSDCAccount.address,
    });
    refetchUSDCBalance();
    positionsByBasktAndUserQuery.refetch();
  };

  let positions = (positionsByBasktAndUserQuery.data as any)?.data; //eslint-disable-line

  if (!positions) {
    return {
      positions: [],
      isLoading: false,
      isError: false,
      error: null,
      closePosition,
      addCollateral,
      refetch: positionsByBasktAndUserQuery.refetch,
    };
  }

  positions = positions.filter(
    (position: OnchainPosition) => position.status === PositionStatus.OPEN,
  );

  return {
    positions,
    closePosition,
    addCollateral,
    isLoading: positionsByBasktAndUserQuery.isLoading,
    isError: positionsByBasktAndUserQuery.isError,
    error: positionsByBasktAndUserQuery.error,
    refetch: positionsByBasktAndUserQuery.refetch,
  };
}

export function useOpenPosition({ baskt, size }: UseOpenPositionProps) {
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
      toast.error('Please connect your wallet first');
      return;
    }

    if (!baskt.isActive) {
      toast.error('This baskt is not active yet. Please try again later.');
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

      toast.success(
        `${
          position === 'long' ? 'Long' : 'Short'
        } position opened with ${collateral.toLocaleString()} USDT collateral`,
      );

      if (window.dispatchEvent) {
        window.dispatchEvent(new Event('position-opened'));
      }

      return true;
      // eslint-disable-next-line
    } catch (error: any) {
      toast.error(error.message || 'Failed to open position');
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
}
