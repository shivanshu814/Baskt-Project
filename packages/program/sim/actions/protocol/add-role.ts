import { stringToRole } from '@baskt/sdk';
import { waitForTx } from '../../../tests/utils/chain-helpers';
import { client } from '../../client';
import { AccessControlRole } from '@baskt/types';

const addRole = async (args: string[]) => {
  try {
    if (args.length < 2) {
      throw new Error('Usage: add-role <account> <role>');
    }

    const account = args[0];
    const roleName = args[1];

    // Validate role
    if (!(roleName in AccessControlRole)) {
      throw new Error(`Invalid role: ${roleName}. Valid roles: ${Object.keys(AccessControlRole).join(', ')}`);
    }

    const role = stringToRole(roleName);
    const accountPubkey = new (await import('@solana/web3.js')).PublicKey(account);

    console.log(`Adding role ${roleName} to account ${account}...`);

    const tx = await client.addRole(accountPubkey, role);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

addRole.description = 'Adds a role to an account. Usage: add-role <account> <role>';
addRole.aliases = ['ar'];

export default addRole;
