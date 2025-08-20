import { client } from '../../client';
import { AccessControlRole } from '@baskt/types';

const removeRole = async (args: string[]) => {
  try {
    if (args.length < 2) {
      throw new Error('Usage: remove-role <account> <role>');
    }

    const account = args[0];
    const roleName = args[1].toUpperCase();

    // Validate role
    if (!(roleName in AccessControlRole)) {
      throw new Error(`Invalid role: ${roleName}. Valid roles: ${Object.keys(AccessControlRole).join(', ')}`);
    }

    const role = AccessControlRole[roleName as keyof typeof AccessControlRole];
    const accountPubkey = new (await import('@solana/web3.js')).PublicKey(account);

    console.log(`Removing role ${roleName} from account ${account}...`);

    const tx = await client.removeRole(accountPubkey, role);
    console.log('Role removed successfully! Transaction:', tx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

removeRole.description = 'Removes a role from an account. Usage: remove-role <account> <role>';
removeRole.aliases = ['rr'];

export default removeRole;
