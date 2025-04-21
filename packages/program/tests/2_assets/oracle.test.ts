import { expect } from 'chai';
import { describe, it } from 'mocha';
import { TestClient } from '../utils/test-client';
import * as anchor from '@coral-xyz/anchor';

describe('Custom Oracle Test', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  it('How many oracles can be updated in on tx ', async () => {
    const limit = 25;
    const oracles = Array.from({ length: limit }, async (_, i) => {
      return await client.createOracle(
        'TBT' + i,
        new anchor.BN(1000000),
        -6,
        new anchor.BN(1000000),
        new anchor.BN(1000000),
      );
    });

    const oracleAddresses = await Promise.all(oracles);
    expect(oracleAddresses.length).to.equal(limit);

    const updateInstructions = oracleAddresses.map(async (oracle: any) => {
      return await client.oracleHelper.updateCustomOraclePriceItx(
        oracle.address,
        new anchor.BN(1000000),
        new anchor.BN(1000000),
        new anchor.BN(100000),
      );
    });

    await client.waitForBlocks();

    const versionedTx = await client.getVersionTransaction(
      (await Promise.all(updateInstructions)).flat(),
    );

    const txSignature = await client.provider.sendAndConfirmV0(versionedTx);
    expect(txSignature).to.be.a('string');
  });
});
