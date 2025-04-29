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
    const sendAndConfirm = async (tx: Transaction) => {
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = new PublicKey(wallet.address);
      const sign = await wallet.signTransaction(tx);
      // eslint-disable-next-line no-undef
      return await sendAndConfirmRawTransaction(connection, Buffer.from(sign.serialize()), {
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
          const sign = await wallet.signTransaction(tx);
          // eslint-disable-next-line no-undef
          return await sendAndConfirmRawTransaction(connection, Buffer.from(sign.serialize()), {
            commitment: 'confirmed',
          });
        },
      },
      new PublicKey(wallet.address),
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
    this.wallet = wallet;
  }

  public getPublicKey() {
    return new PublicKey(this.wallet.address);
  }
}
