import { Connection, PublicKey } from "@solana/web3.js";
import { expect } from "chai";


export async function expectAccountNotFound(connection: Connection, account: PublicKey) {
    const accountInfo = await connection.getAccountInfo(account);
    if(accountInfo) {
        expect.fail(`Account should not exist: ${accountInfo.toString()}, ${accountInfo.data.toString()}, ${accountInfo.owner.toString()}, ${accountInfo.lamports?.toString()}`);
    }
}
