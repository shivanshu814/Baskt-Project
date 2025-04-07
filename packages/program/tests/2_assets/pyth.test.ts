import { expect } from 'chai';
import { describe, it } from 'mocha';
import { TestClient } from '../utils/test-client';
import { AssetPermissions, OracleParams } from '@baskt/sdk';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

describe('Pyth Asset', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  it('Works with BTC Price From Pyth', async () => {
    const pythAccount = '4cSM2e6rvbGQUFiJbqytoVMi5GgghSMr8LwVrT9VPSPo';

    const { assetAddress } = await client.addAsset({
      ticker: 'BTC-P',
      oracle: {
        oracleType: { pyth: {} },
        priceFeedId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
        maxPriceError: new anchor.BN(100),
        maxPriceAgeSec: 600,
        oracleAccount: new PublicKey(pythAccount),
      } as OracleParams,
      permissions: {
        allowLongs: true,
        allowShorts: true,
      } as AssetPermissions,
    });

    const price = await client.getAssetPrice(assetAddress, new PublicKey(pythAccount));

    expect(price).to.not.equal(0);
  });
});
