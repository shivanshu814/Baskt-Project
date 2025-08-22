import { OnchainPosition, PositionStatus } from '@baskt/types';
import { PRICE_PRECISION, useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '../../../lib/api/trpc';
import { parseTradingError } from '../../../utils/error/error';
import { useUSDCBalance } from '../../pool/use-usdc-balance';

export function useOpenPositions(
  basktId?: string,
  userAddress?: string,
  baskt?: any,
  usdcSize?: number,
  navPrice?: BN,
) {
  const [isLoading, setIsLoading] = useState(false);
  const { client } = useBasktClient();
  const publicKey = client?.wallet?.address;
  const {
    balance: usdcBalance,
    account: userUSDCAccount,
    refetch: refetchUSDCBalance,
  } = useUSDCBalance(publicKey);

  const positionsByBasktAndUserQuery = trpc.position.getPositions.useQuery(
    { basktId: basktId || '', userId: userAddress || '' },
    {
      enabled: !!basktId && !!userAddress,
      refetchInterval: 10 * 1000,
      staleTime: 0,
      cacheTime: 0,
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

  useEffect(() => {
    const handleBlockchainInteraction = () => {
      positionsByBasktAndUserQuery.refetch();
    };

    window.addEventListener('order-cancelled', handleBlockchainInteraction);
    window.addEventListener('order-created', handleBlockchainInteraction);
    window.addEventListener('position-closed', handleBlockchainInteraction);
    window.addEventListener('collateral-added', handleBlockchainInteraction);
    window.addEventListener('position-partially-closed', handleBlockchainInteraction);

    return () => {
      window.removeEventListener('order-cancelled', handleBlockchainInteraction);
      window.removeEventListener('order-created', handleBlockchainInteraction);
      window.removeEventListener('position-closed', handleBlockchainInteraction);
      window.removeEventListener('collateral-added', handleBlockchainInteraction);
      window.removeEventListener('position-partially-closed', handleBlockchainInteraction);
    };
  }, [positionsByBasktAndUserQuery]);

  let positions = (positionsByBasktAndUserQuery.data as any)?.data;

  if (!positions) {
    positions = [];
  } else {
    positions = positions.filter(
      (position: OnchainPosition) => position.status === PositionStatus.OPEN,
    );
  }

  const collateral =
    usdcSize && navPrice ? new BN(usdcSize).mul(new BN(PRICE_PRECISION)).muln(1.05) : new BN(0);

  const getLiquidationPrice = (collateral: number, position: 'long' | 'short') => {
    if (!navPrice) return null;
    const price = navPrice.toNumber();
    const leverage = 1;
    return position === 'long' ? price * (1 - 1 / leverage) : price * (1 + 1 / leverage);
  };

  const openPosition = async (position: 'long' | 'short', userInputSize: number) => {
    if (!publicKey || !client || !userUSDCAccount) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!baskt?.baskt?.status) {
      toast.error('This baskt is not active yet. Please try again later.');
      return;
    }

    const toastId = `open-position-${Date.now()}-${Math.random()}`;

    try {
      setIsLoading(true);
      const positionType = position === 'long' ? 'Long' : 'Short';

      toast.loading(
        `Opening ${positionType.toLowerCase()} position with ${userInputSize.toLocaleString()} USDC...`,
        {
          id: toastId,
        },
      );

      const orderId = client.newUID();

      if (collateral.lte(new BN(0))) {
        toast.dismiss(toastId);
        throw new Error('Collateral amount must be greater than 0');
      }

      const collateralAmount = new BN(userInputSize).mul(new BN(PRICE_PRECISION)).muln(1.05);
      const tx = await client.createMarketOpenOrder({
        orderId,
        basktId: new PublicKey(baskt.baskt?.basktId),
        notionalValue: new BN(userInputSize).mul(new BN(PRICE_PRECISION)),
        collateral: collateralAmount,
        isLong: position === 'long',
        leverageBps: new BN(10000),
        ownerTokenAccount: userUSDCAccount?.address,
      });

      const confirmation = await client.connection.confirmTransaction(tx);

      if (confirmation.value.err) {
        toast.dismiss(toastId);
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      refetchUSDCBalance();

      window.dispatchEvent(new Event('position-opened'));
      window.dispatchEvent(new Event('order-created'));
      window.dispatchEvent(new Event('balance-updated'));

      const positionSize = navPrice
        ? (Number(userInputSize) / Number(navPrice.toNumber() / 1e6)).toLocaleString(undefined, {
            maximumFractionDigits: 6,
          })
        : '0';
      toast.success(`${positionType} position opened successfully!`, {
        id: toastId,
        description: `Size: ${positionSize} units`,
      });

      return true;
    } catch (error: any) {
      const parsedError = parseTradingError(error);
      toast.error(`Failed to open position: ${parsedError}`, { id: toastId });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    positions,
    isLoading: isLoading || positionsByBasktAndUserQuery.isLoading,
    isError: positionsByBasktAndUserQuery.isError,
    error: positionsByBasktAndUserQuery.error,
    refetch: positionsByBasktAndUserQuery.refetch,
    openPosition,
    getLiquidationPrice,
    usdcBalance,
    userUSDCAccount,
    collateral,
  };
}
