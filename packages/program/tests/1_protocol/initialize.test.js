"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const test_client_1 = require("../utils/test-client");
(0, mocha_1.describe)("protocol", () => {
    // Get the test client instance
    const client = test_client_1.TestClient.getInstance();
    (0, mocha_1.it)("Successfully initializes the protocol", async () => {
        // Initialize the protocol
        await client.initializeProtocol();
        // Fetch the protocol account to verify it was initialized correctly
        const protocolAccount = await client.getProtocolAccount();
        // Verify the protocol is initialized
        (0, chai_1.expect)(protocolAccount.isInitialized).to.be.true;
        // Verify the payer is set as the owner
        (0, chai_1.expect)(protocolAccount.owner.toString()).to.equal(client.wallet.publicKey.toString());
    });
});
