import { expect } from 'chai';
import { describe, it } from 'mocha';
import { TestClient } from '../utils/test-client';

describe('Custom Oracle Test', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  it('How many oracles can be updated in on tx ', async () => {
    const limit = 25;
    const oracles = Array.from({ length: limit }, async (_, i) => {
      return await client.createCustomOracle(
        client.protocolPDA,
        'BTC' + i,
        1000000,
        -6,
        //TODO no need to put the times anymore. Plus eponent can be all deperecated
        1000000,
        1000000,
        0,
      );
    });

    const oracleAddresses = await Promise.all(oracles);
    expect(oracleAddresses.length).to.equal(limit);

    const updateInstructions = oracleAddresses.map(async (oracle, index) => {
      return await client.oracleHelper.updateCustomOraclePriceItx(
        'BTC' + index,
        oracle.address,
        1000000,
        -6,
        1000000,
        1000000,
        0,
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
