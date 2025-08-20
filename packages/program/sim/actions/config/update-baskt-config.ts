import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';

const updateBasktConfig = async (args: string[]) => {
  try {
    if (args.length < 2) {
      throw new Error('Usage: update-baskt-config <basktId> <openingFeeBps> [closingFeeBps] [liquidationFeeBps] [minCollateralRatioBps] [liquidationThresholdBps]');
    }

    const basktId = new PublicKey(args[0]);

    const currentConfig = (await client.getBaskt(basktId)).config;

    const openingFeeBps = args[1] !== 'null' ? parseInt(args[1]) : Number(currentConfig.openingFeeBps);
    const closingFeeBps = args[2] !== 'null' ? parseInt(args[2]) : Number(currentConfig.closingFeeBps);
    const liquidationFeeBps = args[3] !== 'null' ? parseInt(args[3]) : Number(currentConfig.liquidationFeeBps);
    const minCollateralRatioBps = args[4] !== 'null' ? parseInt(args[4]) : Number(currentConfig.minCollateralRatioBps);
    const liquidationThresholdBps = args[5] !== 'null' ? parseInt(args[5]) : Number(currentConfig.liquidationThresholdBps);

    // Validate fee parameters
    if (openingFeeBps !== null && (openingFeeBps < 0 || openingFeeBps > 500)) {
      throw new Error('Opening fee must be between 0 and 500 basis points');
    }
    if (closingFeeBps !== null && (closingFeeBps < 0 || closingFeeBps > 500)) {
      throw new Error('Closing fee must be between 0 and 500 basis points');
    }
    if (liquidationFeeBps !== null && (liquidationFeeBps < 0 || liquidationFeeBps > 500)) {
      throw new Error('Liquidation fee must be between 0 and 500 basis points');
    }
    if (minCollateralRatioBps !== null && minCollateralRatioBps < 11000) {
      throw new Error('Minimum collateral ratio must be at least 11000 basis points (110%)');
    }
    if (liquidationThresholdBps !== null && liquidationThresholdBps < 0) {
      throw new Error('Liquidation threshold must be non-negative');
    }

    console.log('Updating baskt configuration for:', basktId.toString());
    console.log('Opening fee (BPS):', openingFeeBps);
    console.log('Closing fee (BPS):', closingFeeBps);
    console.log('Liquidation fee (BPS):', liquidationFeeBps);
    console.log('Min collateral ratio (BPS):', minCollateralRatioBps);
    console.log('Liquidation threshold (BPS):', liquidationThresholdBps);

    const updateTx = await client.updateBasktConfig(basktId, {
      openingFeeBps,
      closingFeeBps,
      liquidationFeeBps,
      minCollateralRatioBps,
      liquidationThresholdBps,
    });

    console.log('Baskt configuration updated successfully! Transaction:', updateTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

updateBasktConfig.description = 'Updates baskt configuration parameters. Usage: update-baskt-config <basktId> <openingFeeBps> [closingFeeBps] [liquidationFeeBps] [minCollateralRatioBps] [liquidationThresholdBps]';
updateBasktConfig.aliases = ['ubc'];

export default updateBasktConfig; 