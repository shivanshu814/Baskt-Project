"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "../../components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { useBasktClient, USDC_MINT } from "@baskt/ui";
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, createMintToInstruction } from "@solana/spl-token";
import { Keypair, PublicKey, Transaction, sendAndConfirmRawTransaction } from "@solana/web3.js";

const MINT_AMOUNT = 10_000 * 1_000_000; // 10,000 USDC (1e6 decimals)

export default function Faucet() {
  const { authenticated } = usePrivy();
  const { client, wallet, connection } = useBasktClient();
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helper to fetch the user's USDC token account and balance
  const fetchUserUSDCBalance = useCallback(async () => {
    if (!authenticated || !wallet?.address || !client) {
      setBalance("0");
      return;
    }
    try {
      const userPubkey = new PublicKey(wallet.address);
      const acc = await client.getUserTokenAccount(userPubkey, USDC_MINT);
      setBalance((Number(acc?.amount) / 1e6).toLocaleString());
      return acc;
    } catch (e: any) {
      setBalance("0");
      return null;
    }
  }, [authenticated, wallet, client]);

  // Fetch balance on mount and when dependencies change
  useEffect(() => {
    fetchUserUSDCBalance();
  }, [fetchUserUSDCBalance]);

  const handleMint = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    if (!authenticated || !wallet?.address || !client) {
      setError("Not connected");
      setLoading(false);
      return;
    }
    try {
      const mintAuthorityKeypair = Keypair.fromSecretKey(
        Buffer.from("VaRGq1AFa5RE3fNLTPyccv4P+TxcGAdBIgnFels/9QAmgragKEoiByXnTP/diVXlNlnga0bjRQI7XtXkkMgXDQ==", "base64")
      );
      const userPubkey = new PublicKey(wallet.address);
      const ataAddr = getAssociatedTokenAddressSync(USDC_MINT, userPubkey);

      // Check if ATA exists and create if needed
      const ataInfo = await fetchUserUSDCBalance();
      const instructions = [];
      if (!ataInfo) {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            userPubkey, // payer
            ataAddr,    // ata
            userPubkey, // owner
            USDC_MINT
          )
        );
      }
      // Mint tokens
      instructions.push(
        createMintToInstruction(
          USDC_MINT,
          ataAddr,
          mintAuthorityKeypair.publicKey, // authority
          MINT_AMOUNT
        )
      );

      const transaction = new Transaction().add(...instructions);
      transaction.recentBlockhash = (await connection?.getLatestBlockhash())?.blockhash;
      transaction.feePayer = userPubkey;
      transaction.sign(mintAuthorityKeypair);
      const tx = await wallet.signTransaction(transaction);

      if (!connection) {
        throw new Error("Connection not available");
      }

      await sendAndConfirmRawTransaction(connection, Buffer.from(tx.serialize()));
      setSuccess(`Minted successfully!`);
      await fetchUserUSDCBalance();
    } catch (e: any) {
      setError(e.message || "Mint failed");
    } finally {
      setLoading(false);
    }
  }, [authenticated, wallet, client, fetchUserUSDCBalance, connection]);

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
      <div className="text-white/70">USDC Balance: <span className="font-mono">{balance}</span></div>
      {error && <div className="text-red-400">{error}</div>}
      {success && <div className="text-green-400">{success}</div>}
      <Button size="lg" className="mt-2 w-full text-lg font-bold py-4" onClick={handleMint} disabled={loading}>
        {loading ? "Minting..." : `Mint 10,000 USDC`}
      </Button>
    </div>
  );
}
