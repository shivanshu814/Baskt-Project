'use client';

import { useState, useCallback } from 'react';
import {
  Button,
  useBasktClient,
  USDC_MINT,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@baskt/ui';
import { usePrivy } from '@privy-io/react-auth';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from '@solana/spl-token';
import { Keypair, PublicKey, Transaction, sendAndConfirmRawTransaction } from '@solana/web3.js';
import { useUSDCBalance } from '../../hooks/pool/useUSDCBalance';
import { Droplets, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

const MINT_AMOUNT = 10_000 * 1_000_000; // 10,000 USDC (1e6 decimals)

export default function Faucet() {
  const { authenticated } = usePrivy();
  const { client, wallet, connection } = useBasktClient();
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'loading' | 'idle';
    message: string | null;
  }>({ type: 'idle', message: null });
  const {
    balance,
    loading: balanceLoading,
    error: balanceError,
    refetch: refetchUSDCBalance,
  } = useUSDCBalance();

  const handleMint = useCallback(async () => {
    setStatus({ type: 'loading', message: 'Preparing transaction...' });
    if (!authenticated || !wallet?.address || !client) {
      setStatus({ type: 'error', message: 'Wallet not connected.' });
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

      setStatus({ type: 'loading', message: 'Please sign the transaction in your wallet.' });
      const tx = await wallet.signTransaction(transaction);

      if (!connection) {
        throw new Error('Connection not available');
      }

      setStatus({ type: 'loading', message: 'Confirming transaction...' });
      await sendAndConfirmRawTransaction(connection, Buffer.from(tx.serialize()));
      setStatus({ type: 'success', message: 'Successfully minted 10,000 USDC!' });
      await refetchUSDCBalance();

      // Dispatch single event to trigger balance refresh across the app
      window.dispatchEvent(new Event('token-received'));

      // eslint-disable-next-line
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || 'Mint failed' });
    }
  }, [authenticated, wallet, client, refetchUSDCBalance, connection]);

  const isLoading = status.type === 'loading' || balanceLoading;

  return (
    <div className="flex-grow w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-foreground/5 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Droplets className="text-primary h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-xl sm:text-2xl">USDC Faucet</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Get free testnet USDC to try out the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
          {!authenticated ? (
            <div className="text-center py-8 px-4">
              <p className="text-muted-foreground text-sm sm:text-base">
                Please connect your wallet to use the faucet.
              </p>
            </div>
          ) : (
            <>
              <div className="p-3 sm:p-4 rounded-lg bg-muted flex justify-between items-center">
                <span className="text-muted-foreground text-sm sm:text-base">Your Balance</span>
                <span className="font-mono text-base sm:text-lg font-semibold text-foreground">
                  {balanceLoading ? '...' : `${balance} USDC`}
                </span>
              </div>

              {balanceError && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">{balanceError}</span>
                </div>
              )}

              {status.type === 'success' && status.message && (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">{status.message}</span>
                </div>
              )}

              {status.type === 'error' && status.message && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">{status.message}</span>
                </div>
              )}

              <Button
                size="lg"
                className="w-full text-sm sm:text-base font-bold py-3"
                onClick={handleMint}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span className="text-xs sm:text-sm">{status.message || 'Loading...'}</span>
                  </div>
                ) : (
                  `Mint 10,000 USDC`
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
