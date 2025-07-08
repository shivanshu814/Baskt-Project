import { OnchainPosition, PositionStatus } from '@baskt/types';
import { trpc } from '../../../utils/trpc';
import { USDC_MINT, useBasktClient } from '@baskt/ui';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { useUSDCBalance } from '../../pool/useUSDCBalance';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UseOpenPositionProps } from '../../../types/baskt';
import { calculateCollateralAmount, calculateLiquidationPrice } from '@baskt/sdk';
import { PRICE_PRECISION, STANDARD_SLIPPAGE_BPS } from '@baskt/ui';
import { parseSolanaError } from '../../../utils/error-handling';

export function useOpenPositions(basktId?: string, userAddress?: string, navPrice?: BN) {
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

  // Listen for blockchain interaction events
  useEffect(() => {
    const handleBlockchainInteraction = () => {
      positionsByBasktAndUserQuery.refetch();
    };

    // Listen for various blockchain interaction events
    window.addEventListener('order-cancelled', handleBlockchainInteraction);
    window.addEventListener('order-created', handleBlockchainInteraction);
    window.addEventListener('position-closed', handleBlockchainInteraction);
    window.addEventListener('collateral-added', handleBlockchainInteraction);

    return () => {
      window.removeEventListener('order-cancelled', handleBlockchainInteraction);
      window.removeEventListener('order-created', handleBlockchainInteraction);
      window.removeEventListener('position-closed', handleBlockchainInteraction);
      window.removeEventListener('collateral-added', handleBlockchainInteraction);
    };
  }, [positionsByBasktAndUserQuery]);

  // eslint-disable-next-line
  const closePosition = async (position: any) => {
    if (!client || !userUSDCAccount) {
      toast.error('Missing required parameters for closing position');
      return;
    }

    if (!basktId) {
      toast.error('Missing baskt ID for closing position');
      return;
    }

    if (!navPrice) {
      toast.error('Missing NAV price for closing position');
      return;
    }

    try {
      console.log(USDC_MINT.toBase58());
      const tx = await client.createOrderTx(
        new BN(Date.now()),
        new BN(0),
        new BN(position.usdcSize || '0'),
        position.isLong,
        { close: {} },
        new PublicKey(position.positionPDA),
        navPrice,
        new BN(STANDARD_SLIPPAGE_BPS),
        new PublicKey(basktId),
        userUSDCAccount.address,
        USDC_MINT,
        new BN(10000), // leverageBps: 1x leverage
        { market: {} }, // orderType: market order
      );

      // Wait for transaction confirmation
      const confirmation = await client.connection.confirmTransaction(tx);

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      // Refetch data after successful transaction
      await Promise.all([refetchUSDCBalance(), positionsByBasktAndUserQuery.refetch()]);

      // Dispatch event for other components to listen to
      window.dispatchEvent(new Event('position-closed'));

      toast.success('Position closed successfully');
    } catch (error) {
      const parsedError = parseSolanaError(error);
      toast.error(parsedError.message);
    }
  };

  const addCollateral = async (position: OnchainPosition, additionalCollateral: BN) => {
    if (!client || !userUSDCAccount) {
      toast.error('Missing required parameters for adding collateral');
      return;
    }

    try {
      const tx = await client.addCollateral({
        position: new PublicKey(position.positionPDA),
        additionalCollateral,
        ownerTokenAccount: userUSDCAccount.address,
      });

      // Wait for transaction confirmation
      const confirmation = await client.connection.confirmTransaction(tx);

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      // Refetch data after successful transaction
      await Promise.all([refetchUSDCBalance(), positionsByBasktAndUserQuery.refetch()]);

      // Dispatch event for other components to listen to
      window.dispatchEvent(new Event('collateral-added'));

      toast.success('Collateral added successfully');
    } catch (error) {
      console.error(error);
      const parsedError = parseSolanaError(error);
      toast.error(parsedError.message);
    }
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

export function useOpenPosition({ baskt, usdcSize, navPrice }: UseOpenPositionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { client } = useBasktClient();
  const publicKey = client?.wallet?.address;
  const {
    balance: usdcBalance,
    account: userUSDCAccount,
    refetch: refetchUSDCBalance,
  } = useUSDCBalance(publicKey);

  console.log(USDC_MINT.toBase58())


  const collateral = calculateCollateralAmount(new BN(usdcSize));

  const getLiquidationPrice = (collateral: number, position: 'long' | 'short') => {
    return calculateLiquidationPrice({
      collateral,
      price: baskt.price,
      leverage: 1, // Always 1x leverage
      position,
    });
  };

  // const getLiquidationPrice = (collateral: number, position: 'long' | 'short') => {
  //   return new BN(0);
  // };

  const openPosition = async (position: 'long' | 'short', userInputSize: number) => {
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
        new BN(0),
        new BN(userInputSize).mul(new BN(PRICE_PRECISION)),
        position === 'long',
        { open: {} },
        null,
        navPrice,
        new BN(STANDARD_SLIPPAGE_BPS),
        new PublicKey(baskt.basktId),
        userUSDCAccount?.address,
        USDC_MINT,
        new BN(10000), // leverageBps: 1x leverage
        { market: {} }, // orderType: market order
      );

      const confirmation = await client.connection.confirmTransaction(tx);

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      refetchUSDCBalance();

      // Dispatch events for other components to listen to
      window.dispatchEvent(new Event('position-opened'));
      window.dispatchEvent(new Event('order-created'));

      toast.success(
        `${
          position === 'long' ? 'Long' : 'Short'
        } position opened with ${collateral.toLocaleString()} USDT collateral`,
      );

      return true;
      // eslint-disable-next-line
    } catch (error: any) {
      const parsedError = parseSolanaError(error);
      toast.error(parsedError.message);
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
