import { PublicKey, Connection, AddressLookupTableProgram } from '@solana/web3.js';

/**
 * Create instructions for creating and extending a lookup table
 * @param connection Solana connection
 * @param authority Authority public key
 * @param payer Payer public key
 * @returns Object containing the lookup table address and instructions for creating and extending it
 */
export async function createLookupTableInstructions(
  connection: Connection,
  authority: PublicKey,
  payer: PublicKey,
) {
  // Get the current slot
  const slot = await connection.getSlot();

  // Create the lookup table instruction
  const [createInstruction, lookupTableAddress] = AddressLookupTableProgram.createLookupTable({
    authority,
    payer,
    recentSlot: slot - 1,
  });

  return {
    lookupTableAddress,
    createInstruction,
  };
}

export async function extendLookupTable(
  connection: Connection,
  lookupTableAddress: PublicKey,
  authority: PublicKey,
  payer: PublicKey,
  addresses: PublicKey[],
) {
  return AddressLookupTableProgram.extendLookupTable({
    payer,
    authority,
    lookupTable: lookupTableAddress,
    addresses,
  });
}
