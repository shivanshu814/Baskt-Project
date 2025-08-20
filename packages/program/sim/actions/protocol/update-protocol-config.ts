import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';

const updateProtocolConfig = async (args: string[]) => {
  try {
    if (args.length < 2) {
      throw new Error('Usage: update-protocol-config <parameter> <value> [additionalParams...]');
    }

    const parameter = args[0];
    const value = args[1];

    console.log('Updating protocol configuration parameter:', parameter);
    console.log('New value:', value);

    let txSignature: string;

    switch (parameter.toLowerCase()) {
      case 'openingfeebps':
        txSignature = await client.setOpeningFeeBps(parseInt(value));
        break;
      case 'closingfeebps':
        txSignature = await client.setClosingFeeBps(parseInt(value));
        break;
      case 'liquidationfeebps':
        txSignature = await client.setLiquidationFeeBps(parseInt(value));
        break;
      case 'mincollateralratiobps':
        txSignature = await client.setMinCollateralRatioBps(parseInt(value));
        break;
      case 'liquidationthresholdbps':
        txSignature = await client.setLiquidationThresholdBps(parseInt(value));
        break;
      case 'minliquidity':
        txSignature = await client.setMinLiquidity(parseInt(value));
        break;
      case 'rebalancerequestfee':
        txSignature = await client.setRebalanceRequestFee(parseInt(value));
        break;
      case 'basktcreationfee':
        txSignature = await client.setBasktCreationFee(parseInt(value));
        break;
      case 'treasury':
        if (args.length < 2) {
          throw new Error('Treasury parameter requires a public key');
        }
        txSignature = await client.updateTreasury(new PublicKey(value));
        break;
      default:
        throw new Error(`Unknown parameter: ${parameter}. Available parameters: openingfeebps, closingfeebps, liquidationfeebps, mincollateralratiobps, liquidationthresholdbps, minliquidity, rebalancerequestfee, basktcreationfee, treasury`);
    }

    console.log('Protocol configuration updated successfully! Transaction:', txSignature);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

updateProtocolConfig.description = 'Updates protocol configuration parameters. Usage: update-protocol-config <parameter> <value> [additionalParams...]';
updateProtocolConfig.aliases = ['upc'];

export default updateProtocolConfig; 