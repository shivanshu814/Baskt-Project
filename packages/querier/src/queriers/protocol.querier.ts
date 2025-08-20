import { BaseClient, stringToRole } from "@baskt/sdk";
import { ProtocolMetadata } from "../types/models/ProtocolMetadata";
import { ProtocolMetadataModel } from "../models/mongodb";
import mongoose from "mongoose";
import { AccessControlRole } from "@baskt/types";


export class ProtocolQuerier {
  public basktClient: BaseClient;
  private static instance: ProtocolQuerier;

  public static getInstance(basktClient: BaseClient): ProtocolQuerier {
    if (!ProtocolQuerier.instance) {
      ProtocolQuerier.instance = new ProtocolQuerier(basktClient);
    }
    return ProtocolQuerier.instance;
  }

  constructor(basktClient: BaseClient) {
    this.basktClient = basktClient;
  }

  async getProtocolMetadata(): Promise<ProtocolMetadata | null> {
    const protocolMetadata = await ProtocolMetadataModel.findOne({})
      .sort({ CreatedAt: -1 })
      .limit(1)
      .lean<ProtocolMetadata>();
    return protocolMetadata;
  }
  
  async resyncProtocolMetadata(): Promise<void> {
    const protocolAccount = await this.basktClient.getProtocolAccount();
    const protocolAddress = this.basktClient.protocolPDA.toString();
    
    await ProtocolMetadataModel.findOneAndUpdate(
      { protocolAddress: protocolAddress },
      {
        isInitialized: protocolAccount.isInitialized,
        owner: protocolAccount.owner.toString(),
        accessControl: protocolAccount.accessControl.entries.map((entry) => ({
          account: entry.account.toString(),
          role: stringToRole(entry.role),
        })),
        featureFlags: {
          allowAddLiquidity: protocolAccount.featureFlags.allowAddLiquidity,
          allowRemoveLiquidity: protocolAccount.featureFlags.allowRemoveLiquidity,
          allowOpenPosition: protocolAccount.featureFlags.allowOpenPosition,
          allowClosePosition: protocolAccount.featureFlags.allowClosePosition,
          allowPnlWithdrawal: protocolAccount.featureFlags.allowPnlWithdrawal,
          allowCollateralWithdrawal: protocolAccount.featureFlags.allowCollateralWithdrawal,
          allowAddCollateral: protocolAccount.featureFlags.allowAddCollateral,
          allowBasktCreation: protocolAccount.featureFlags.allowBasktCreation,
          allowBasktUpdate: protocolAccount.featureFlags.allowBasktUpdate,
          allowTrading: protocolAccount.featureFlags.allowTrading,
          allowLiquidations: protocolAccount.featureFlags.allowLiquidations,
        },
        treasury: protocolAccount.treasury.toString(),
        collateralMint: protocolAccount.collateralMint.toString(),
        config: {
          openingFeeBps: protocolAccount.config.openingFeeBps.toNumber(),
          closingFeeBps: protocolAccount.config.closingFeeBps.toNumber(),
          liquidationFeeBps: protocolAccount.config.liquidationFeeBps.toNumber(),
          fundingCutBps: protocolAccount.config.fundingCutBps.toNumber(),
          treasuryCutBps: protocolAccount.config.treasuryCutBps.toNumber(),
          maxFundingRateBps: protocolAccount.config.maxFundingRateBps.toNumber(),
          fundingIntervalSeconds: protocolAccount.config.fundingIntervalSeconds.toNumber(),
          minCollateralRatioBps: protocolAccount.config.minCollateralRatioBps.toNumber(),
          liquidationThresholdBps: protocolAccount.config.liquidationThresholdBps.toNumber(),
          minLiquidity: protocolAccount.config.minLiquidity.toNumber(),
          rebalanceRequestFeeLamports: protocolAccount.config.rebalanceRequestFeeLamports.toNumber(),
          basktCreationFeeLamports: protocolAccount.config.basktCreationFeeLamports.toNumber(),
          lastUpdated: protocolAccount.config.lastUpdated.toNumber(),
          lastUpdatedBy: protocolAccount.config.lastUpdatedBy,
        },
        protocolAddress: protocolAddress,
      } as ProtocolMetadata,
      { upsert: true, new: true }
    );
  }
}