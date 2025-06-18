import { OnchainPosition, PositionStatus } from '@baskt/types';
import { trpc } from '../../../utils/trpc';
import { USDC_MINT, useBasktClient } from '@baskt/ui';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { useUSDCBalance } from '../../pool/useUSDCBalance';
import { useEffect } from 'react';

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
