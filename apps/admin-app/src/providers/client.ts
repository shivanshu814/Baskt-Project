import { PublicKey, Connection } from '@solana/web3.js';
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
    console.log('PrivyClient constructor', connection, wallet);
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
    super(
      connection,
      {
        sendAndConfirmLegacy: (tx) => wallet.sendTransaction(tx, connection),
        sendAndConfirmV0: (tx) => wallet.sendTransaction(tx, connection),
      },
      new PublicKey(wallet.address),
    );
    this.wallet = wallet;
  }

  public getPublicKey() {
    return new PublicKey(this.wallet.address);
  }
}
