import { client } from '../../client';

const updateFeatureFlags = async (args: string[]) => {
  try {
    if (args.length < 1) {
      throw new Error('Usage: update-feature-flags <flag1> <value1> [flag2] [value2] ...');
    }

    const featureFlags: {
      allowAddLiquidity: boolean;
      allowRemoveLiquidity: boolean;
      allowOpenPosition: boolean;
      allowClosePosition: boolean;
      allowPnlWithdrawal: boolean;
      allowCollateralWithdrawal: boolean;
      allowBasktCreation: boolean;
      allowBasktUpdate: boolean;
      allowTrading: boolean;
      allowLiquidations: boolean;
      allowAddCollateral: boolean;
    } = {
      allowAddLiquidity: true,
      allowRemoveLiquidity: true,
      allowOpenPosition: true,
      allowClosePosition: true,
      allowPnlWithdrawal: true,
      allowCollateralWithdrawal: true,
      allowBasktCreation: true,
      allowBasktUpdate: true,
      allowTrading: true,
      allowLiquidations: true,
      allowAddCollateral: true,
    };

    // Parse feature flags from arguments
    for (let i = 0; i < args.length; i += 2) {
      if (i + 1 >= args.length) {
        throw new Error('Invalid number of arguments. Each flag needs both name and value.');
      }

      const flagName = args[i];
      const flagValue = args[i + 1] === 'true';

      if (flagName in featureFlags) {
        (featureFlags as any)[flagName] = flagValue;
      } else {
        console.warn(`Unknown feature flag: ${flagName}`);
      }
    }

    console.log('Updating feature flags:', featureFlags);

    const updateTx = await client.updateFeatureFlags(featureFlags);
    console.log('Feature flags updated successfully! Transaction:', updateTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

updateFeatureFlags.description = 'Updates protocol feature flags. Usage: update-feature-flags <flag1> <value1> [flag2] [value2] ...';
updateFeatureFlags.aliases = ['uff'];

export default updateFeatureFlags; 