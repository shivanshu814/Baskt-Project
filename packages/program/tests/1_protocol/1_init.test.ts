import { expect } from 'chai';
import { describe, it } from 'mocha';
import { TestClient } from '../utils/test-client';

describe('protocol', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  it('Successfully initializes the protocol', async () => {
    await client.initializeProtocol();

    // Fetch the protocol account to verify it was initialized correctly
    const protocolAccount = await client.getProtocolAccount();

    // Verify the protocol is initialized
    expect(protocolAccount.isInitialized).to.be.true;

    // Verify the payer is set as the owner
    expect(protocolAccount.owner.toString()).to.equal(client.getPublicKey().toString());
  });
});
