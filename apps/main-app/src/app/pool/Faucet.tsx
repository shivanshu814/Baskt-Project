"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "../../components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { useBasktClient, USDC_MINT } from "@baskt/ui";
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, createMintToInstruction } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

const MINT_AMOUNT = 10_000 * 1_000_000; // 10,000 USDC (1e6 decimals)

export default function Faucet() {
  const { authenticated } = usePrivy();
  const { client, wallet } = useBasktClient();
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check and set ATA and balance
  useEffect(() => {
    if (!authenticated || !wallet?.address || !client) {
      setBalance("0");
      return;
    }
    const userPubkey = new PublicKey(wallet.address);
    (async () => {
      try {
        const acc = await client?.getUSDCAccount(userPubkey);
        console.log(acc);
        setBalance((Number(acc?.amount) / 1e6).toLocaleString());
      } catch {
        setBalance("0");
      }
    })();
  }, [authenticated, wallet, client]);

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
      const userPubkey = new PublicKey(wallet.address);
      const instructions = [];
      // Check if ATA exists
      const ataInfo = await client?.getUSDCAccount(userPubkey);
      const ataAddr = getAssociatedTokenAddressSync(USDC_MINT, userPubkey);
      if (!ataInfo) {
        // Create ATA
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
          userPubkey, // authority
          MINT_AMOUNT
        )
      );
      // Ask user to sign and send
      const txSig = await client?.sendAndConfirm(instructions);
      setSuccess(`Minted successfully! Tx: ${txSig}`);
      // Refresh balance
      const acc = await client?.getUserTokenAccount(userPubkey, ataAddr);
      setBalance((Number(acc?.amount) / 1_000_000).toLocaleString());
    } catch (e: any) {
      setError(e.message || "Mint failed");
    } finally {
      setLoading(false);
    }
  }, [authenticated, wallet, client]);

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
