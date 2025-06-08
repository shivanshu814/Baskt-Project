import { OnchainPosition, PositionStatus } from '@baskt/types';
import { trpc } from '../../../utils/trpc';
import { USDC_MINT, useBasktClient } from '@baskt/ui';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { useUSDCBalance } from '../../pool/useUSDCBalance';

export function useOpenPositions(basktId?: string, userAddress?: string) {
  const { client } = useBasktClient();
  const { account: userUSDCAccount } = useUSDCBalance();

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
  };

  const addCollateral = async (position: OnchainPosition, additionalCollateral: BN) => {
    if (!client || !userUSDCAccount) return;
    await client.addCollateral({
      position: new PublicKey(position.address),
      additionalCollateral,
      ownerTokenAccount: userUSDCAccount.address,
    });
  };

  const positionsByBasktAndUserQuery = trpc.position.getPositionsByUserAndBaskt.useQuery(
    { basktId: basktId || '', userId: userAddress || '' },
    {
      // Only enable the query when we have both basktId and userAddress
      enabled: !!basktId && !!userAddress,
    },
  );

  let positions = (positionsByBasktAndUserQuery.data as any)?.data;

  if (!positions) {
    return {
      positions: [],
      isLoading: false,
      isError: false,
      error: null,
      closePosition,
      addCollateral,
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
  };
}
