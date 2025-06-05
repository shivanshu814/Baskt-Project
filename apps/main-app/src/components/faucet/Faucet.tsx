'use client';

import { useState, useCallback } from 'react';
import { USDC_MINT } from '@baskt/ui';
import { Button } from '../ui/button';
import { usePrivy } from '@privy-io/react-auth';
import { useBasktClient } from '@baskt/ui';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from '@solana/spl-token';
import { Keypair, PublicKey, Transaction, sendAndConfirmRawTransaction } from '@solana/web3.js';
import { useUSDCBalance } from '../../hooks/pool/useUSDCBalance';

const MINT_AMOUNT = 10_000 * 1_000_000; // 10,000 USDC (1e6 decimals)

export default function Faucet() {
  const { authenticated } = usePrivy();
  const { client, wallet, connection } = useBasktClient();
  const [success, setSuccess] = useState<string | null>(null);
  const {
    balance,
    loading: balanceLoading,
    error: balanceError,
    refetch: refetchUSDCBalance,
  } = useUSDCBalance();

  const handleMint = useCallback(async () => {
    setSuccess(null);
    if (!authenticated || !wallet?.address || !client) {
      setSuccess(null);
      return;
    }
    try {
      const mintAuthorityKeypair = Keypair.fromSecretKey(
        Buffer.from(
          'VaRGq1AFa5RE3fNLTPyccv4P+TxcGAdBIgnFels/9QAmgragKEoiByXnTP/diVXlNlnga0bjRQI7XtXkkMgXDQ==',
          'base64',
        ),
      );
      const userPubkey = new PublicKey(wallet.address);
      const ataAddr = getAssociatedTokenAddressSync(USDC_MINT, userPubkey);

      // Check if ATA exists and create if needed
      const ataInfo = await refetchUSDCBalance();
      const instructions = [];
      if (!ataInfo) {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            userPubkey, // payer
            ataAddr, // ata
            userPubkey, // owner
            USDC_MINT,
          ),
        );
      }
      // Mint tokens
      instructions.push(
        createMintToInstruction(
          USDC_MINT,
          ataAddr,
          mintAuthorityKeypair.publicKey, // authority
          MINT_AMOUNT,
        ),
      );

      const transaction = new Transaction().add(...instructions);
      transaction.recentBlockhash = (await connection?.getLatestBlockhash())?.blockhash;
      transaction.feePayer = userPubkey;
      transaction.sign(mintAuthorityKeypair);
      const tx = await wallet.signTransaction(transaction);

      if (!connection) {
        throw new Error('Connection not available');
      }

      await sendAndConfirmRawTransaction(connection, Buffer.from(tx.serialize()));
      setSuccess(`Minted successfully!`);
      await refetchUSDCBalance();
      // eslint-disable-next-line
    } catch (e: any) {
      setSuccess(e.message || 'Mint failed');
    }
  }, [authenticated, wallet, client, refetchUSDCBalance, connection]);

  if (!authenticated) {
    return (
      <div className="rounded-xl p-6 bg-white/5 border border-white/10 text-center">
        <div className="text-lg font-semibold mb-2">Faucet</div>
        <div className="text-white/70">Connect your wallet to use the faucet.</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-6 bg-white/5 border border-white/10 flex flex-col items-center gap-4">
      <div className="text-lg font-semibold">Faucet</div>
      <div className="text-white/70">
        USDC Balance: <span className="font-mono">{balanceLoading ? 'Loading...' : balance}</span>
      </div>
      {balanceError && <div className="text-red-400">{balanceError}</div>}
      {success && <div className="text-green-400">{success}</div>}
      <Button
        size="lg"
        className="mt-2 w-full text-lg font-bold py-4"
        onClick={handleMint}
        disabled={balanceLoading}
      >
        {balanceLoading ? 'Loading...' : `Mint 10,000 USDC`}
      </Button>
    </div>
  );
}
