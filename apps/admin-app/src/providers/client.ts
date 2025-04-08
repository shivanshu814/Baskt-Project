import { PublicKey, Connection, sendAndConfirmRawTransaction, Transaction } from '@solana/web3.js';
import { BaseClient } from '@baskt/sdk';
import { ConnectedSolanaWallet } from '@privy-io/react-auth';
import * as anchor from '@coral-xyz/anchor';

/**
 * Singleton test client for the Baskt protocol
 * Provides utility methods for interacting with the protocol in tests
 * This extends the BaseClient directly instead of wrapping BasktClient
 */
export class PrivyClient extends BaseClient {
  public wallet: ConnectedSolanaWallet;

  public constructor(connection: Connection, wallet: ConnectedSolanaWallet) {
    anchor.setProvider(
      new anchor.AnchorProvider(
        connection,
        {
          publicKey: new PublicKey(wallet.address),
          signTransaction: (tx) => wallet.signTransaction(tx),
          signAllTransactions: (txs) => wallet.signAllTransactions(txs),
        },
        anchor.AnchorProvider.defaultOptions(),
      ),
    );

    const sendAndConfirm = async (tx: Transaction) => {
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = new PublicKey(wallet.address);
      const sign = await wallet.signTransaction(tx);
      return sendAndConfirmRawTransaction(connection, Buffer.from(sign.serialize()), {
        commitment: 'confirmed',
      });
    };

    super(
      connection,
      {
        sendAndConfirmLegacy: async (tx) => {
          return sendAndConfirm(tx);
        },
        sendAndConfirmV0: async (tx) => {
          return wallet.sendTransaction(tx, connection);
        },
      },
      new PublicKey(wallet.address),
    );
    this.wallet = wallet;
  }

  public getPublicKey() {
    return new PublicKey(this.wallet.address);
  }
}
