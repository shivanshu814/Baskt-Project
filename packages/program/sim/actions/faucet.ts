import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../client';
import { requestAirdrop } from '../../tests/utils/test-client';

const USDC_DECIMALS = 6;
const SOL_DECIMALS = 9;

const faucet = async (args: string[]) => {
  if (args.length < 3) {
    throw new Error('Usage: faucet <usdc|sol> <recipient> <amount>');
  }

  const [token, recipientStr, amountStr] = args;
  let recipient: PublicKey;
  if (recipientStr === 'me') {
    recipient = client.getPublicKey();
  } else {
    recipient = new PublicKey(recipientStr);
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }

  if (token.toLowerCase() === 'usdc') {
    const userTokenAccount = await client.getOrCreateUSDCAccount(recipient);
    const mintAmount = new BN(amount * 10 ** USDC_DECIMALS);
    console.log(`Minting ${mintAmount.toString()} USDC to ${userTokenAccount.toBase58()}`);
    await client.mintUSDC(userTokenAccount, mintAmount);
    console.log('USDC faucet complete!');
  } else if (token.toLowerCase() === 'sol') {
    const lamports = amount * 10 ** SOL_DECIMALS;
    console.log(`Airdropping ${lamports} lamports (${amount} SOL) to ${recipient.toBase58()}`);
    await requestAirdrop(recipient, client.connection);
    console.log('SOL faucet complete!');
  } else {
    throw new Error('Token must be either usdc or sol');
  }
};

faucet.description = 'Faucet for USDC or SOL. Usage: faucet <usdc|sol> <recipient> <amount>';
faucet.aliases = ['ft'];

export default faucet;
