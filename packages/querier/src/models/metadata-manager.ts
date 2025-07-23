import {
  AssetMetadataModel,
  BasktMetadataModel,
  OrderMetadataModel,
  PositionMetadataModel,
  AccessCodeModel,
  AuthorizedWalletModel,
} from './mongodb';

/**
 * Metadata Manager
 *
 * This class provides methods to manage the metadata for the baskt, asset, order, position, access code, and authorized wallet models.
 * It is a singleton class and can be accessed using the getInstance method.
 *
 */

export class MetadataManager {
  private static instance: MetadataManager;

  private constructor() {}

  public static getInstance(): MetadataManager {
    if (!MetadataManager.instance) {
      MetadataManager.instance = new MetadataManager();
    }
    return MetadataManager.instance;
  }

  /**
   * Asset
   * getall, find by address, find by id, create, update, delete
   */

  // get all assets
  async getAllAssets(): Promise<any[]> {
    try {
      return await AssetMetadataModel.find().sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to get all assets: ${error}`);
    }
  }

  // find asset by address
  async findAssetByAddress(assetAddress: string): Promise<any> {
    try {
      return await AssetMetadataModel.findOne({ assetAddress }).exec();
    } catch (error) {
      throw new Error(`Failed to find asset by address: ${error}`);
    }
  }

  // find asset by id
  async findAssetById(assetId: string): Promise<any> {
    try {
      return await AssetMetadataModel.findById(assetId).exec();
    } catch (error) {
      throw new Error(`Failed to find asset by ID: ${error}`);
    }
  }

  // create asset
  async createAsset(assetData: any): Promise<any> {
    try {
      const asset = new AssetMetadataModel(assetData);
      return await asset.save();
    } catch (error) {
      throw new Error(`Failed to create asset: ${error}`);
    }
  }

  // update asset
  async updateAsset(assetId: string, updateData: any): Promise<any> {
    try {
      return await AssetMetadataModel.findByIdAndUpdate(assetId, updateData, { new: true });
    } catch (error) {
      throw new Error(`Failed to update asset: ${error}`);
    }
  }

  // delete asset
  async deleteAsset(assetId: string): Promise<any> {
    try {
      return await AssetMetadataModel.findByIdAndDelete(assetId);
    } catch (error) {
      throw new Error(`Failed to delete asset: ${error}`);
    }
  }

  /**
   * Baskt
   * getall, find by id, find by name, create, update
   */

  // get all baskts
  async getAllBaskts(): Promise<any[]> {
    try {
      return await BasktMetadataModel.find().sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to get all baskts: ${error}`);
    }
  }

  // find baskt by id
  async findBasktById(basktId: string): Promise<any> {
    try {
      return await BasktMetadataModel.findOne({ basktId }).exec();
    } catch (error) {
      throw new Error(`Failed to find baskt by ID: ${error}`);
    }
  }

  // find baskt by name
  async findBasktByName(name: string): Promise<any> {
    try {
      return await BasktMetadataModel.findOne({ name }).exec();
    } catch (error) {
      throw new Error(`Failed to find baskt by name: ${error}`);
    }
  }

  // create baskt
  async createBaskt(basktData: any): Promise<any> {
    try {
      const baskt = new BasktMetadataModel(basktData);
      return await baskt.save();
    } catch (error) {
      throw new Error(`Failed to create baskt: ${error}`);
    }
  }

  // update baskt
  async updateBaskt(basktId: string, updateData: any): Promise<any> {
    try {
      return await BasktMetadataModel.findOneAndUpdate({ basktId }, updateData, { new: true });
    } catch (error) {
      throw new Error(`Failed to update baskt: ${error}`);
    }
  }

  /**
   * Order
   * getall, find by id, find by baskt id, create, update
   */

  // get all orders
  async getAllOrders(): Promise<any[]> {
    try {
      return await OrderMetadataModel.find().sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to get all orders: ${error}`);
    }
  }

  // find order by id
  async findOrderById(orderId: string): Promise<any> {
    try {
      return await OrderMetadataModel.findOne({ orderId }).exec();
    } catch (error) {
      throw new Error(`Failed to find order by ID: ${error}`);
    }
  }

  // find orders by baskt id
  async findOrdersByBasktId(basktId: string): Promise<any[]> {
    try {
      return await OrderMetadataModel.find({ basktId }).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to find orders by baskt ID: ${error}`);
    }
  }

  // create order
  async createOrder(orderData: any): Promise<any> {
    try {
      const order = new OrderMetadataModel(orderData);
      return await order.save();
    } catch (error) {
      throw new Error(`Failed to create order: ${error}`);
    }
  }

  // update order
  async updateOrder(orderPDA: string, updateData: any): Promise<any> {
    try {
      return await OrderMetadataModel.findOneAndUpdate({ orderPDA: orderPDA }, updateData, { new: true });
    } catch (error) {
      throw new Error(`Failed to update order: ${error}`);
    }
  }

  /**
   * Position
   * getall, find by id, find by baskt id, create, update
   */

  // get all positions
  async getAllPositions(): Promise<any[]> {
    try {
      return await PositionMetadataModel.find().sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to get all positions: ${error}`);
    }
  }

  // find position by id
  async findPositionById(positionId: string): Promise<any> {
    try {
      return await PositionMetadataModel.findOne({ positionId }).exec();
    } catch (error) {
      throw new Error(`Failed to find position by ID: ${error}`);
    }
  }

  // find positions by baskt id
  async findPositionsByBasktId(basktId: string): Promise<any[]> {
    try {
      return await PositionMetadataModel.find({ basktId }).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to find positions by baskt ID: ${error}`);
    }
  }

  // create position
  async createPosition(positionData: any): Promise<any> {
    try {
      const position = new PositionMetadataModel(positionData);
      return await position.save();
    } catch (error) {
      throw new Error(`Failed to create position: ${error}`);
    }
  }

  // update position
  async updatePosition(positionId: string, updateData: any): Promise<any> {
    try {
      return await PositionMetadataModel.findOneAndUpdate({ positionId }, updateData, {
        new: true,
      });
    } catch (error) {
      throw new Error(`Failed to update position: ${error}`);
    }
  }

  /**
   * Access Code
   * getall, find by code, create, update, delete
   */

  // get all access codes
  async getAllAccessCodes(): Promise<any[]> {
    try {
      return await AccessCodeModel.find().exec();
    } catch (error) {
      throw new Error(`Failed to get all access codes: ${error}`);
    }
  }

  // find access code by code
  async findAccessCode(code: string): Promise<any> {
    try {
      return await AccessCodeModel.findOne({ code }).exec();
    } catch (error) {
      throw new Error(`Failed to find access code: ${error}`);
    }
  }

  // create access code
  async createAccessCode(accessCodeData: any): Promise<any> {
    try {
      const accessCode = new AccessCodeModel(accessCodeData);
      return await accessCode.save();
    } catch (error) {
      throw new Error(`Failed to create access code: ${error}`);
    }
  }

  // update access code
  async updateAccessCode(code: string, updateData: any): Promise<any> {
    try {
      return await AccessCodeModel.findOneAndUpdate({ code }, updateData, { new: true });
    } catch (error) {
      throw new Error(`Failed to update access code: ${error}`);
    }
  }

  // delete access code
  async deleteAccessCode(code: string): Promise<any> {
    try {
      return await AccessCodeModel.findOneAndDelete({ code });
    } catch (error) {
      throw new Error(`Failed to delete access code: ${error}`);
    }
  }

  /**
   * Authorized Wallet
   * getall, find by address, create, update
   */

  // get all authorized wallets
  async getAllAuthorizedWallets(): Promise<any[]> {
    try {
      return await AuthorizedWalletModel.find().exec();
    } catch (error) {
      throw new Error(`Failed to get all authorized wallets: ${error}`);
    }
  }

  // find authorized wallet by address
  async findAuthorizedWallet(address: string): Promise<any> {
    try {
      return await AuthorizedWalletModel.findOne({ walletAddress: address }).exec();
    } catch (error) {
      throw new Error(`Failed to find authorized wallet: ${error}`);
    }
  }

  // create authorized wallet
  async createAuthorizedWallet(walletData: any): Promise<any> {
    try {
      const existingWallet = await AuthorizedWalletModel.findOne({
        walletAddress: walletData.walletAddress,
      }).exec();

      if (existingWallet) {
        return await AuthorizedWalletModel.findOneAndUpdate(
          { walletAddress: walletData.walletAddress },
          {
            ...walletData,
            lastLoginAt: new Date(),
            isActive: true,
          },
          { new: true },
        );
      }

      const wallet = new AuthorizedWalletModel(walletData);
      return await wallet.save();
    } catch (error) {
      throw new Error(`Failed to create authorized wallet: ${error}`);
    }
  }

  // update authorized wallet
  async updateAuthorizedWallet(address: string, updateData: any): Promise<any> {
    try {
      return await AuthorizedWalletModel.findOneAndUpdate({ walletAddress: address }, updateData, {
        new: true,
      });
    } catch (error) {
      throw new Error(`Failed to update authorized wallet: ${error}`);
    }
  }

  // use access code
  async useAccessCode(
    code: string,
    walletAddress: string,
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const accessCode = await this.findAccessCode(code);

      if (!accessCode) {
        return {
          success: false,
          error: 'Access code not found',
        };
      }

      if (accessCode.isUsed) {
        return {
          success: false,
          error: 'Access code already used',
        };
      }

      if (accessCode.expiresAt && new Date() > accessCode.expiresAt) {
        return {
          success: false,
          error: 'Access code expired',
        };
      }

      // Check if wallet is already authorized
      const existingWallet = await this.findAuthorizedWallet(walletAddress);
      if (existingWallet) {
        return {
          success: false,
          error: 'Wallet already authorized',
        };
      }

      // Mark access code as used
      await this.updateAccessCode(code, {
        isUsed: true,
        usedBy: walletAddress,
        usedAt: new Date(),
      });

      // Create authorized wallet
      const authorizedWallet = await this.createAuthorizedWallet({
        walletAddress: walletAddress.toLowerCase(),
        accessCodeUsed: code,
        authorizedAt: new Date(),
        isActive: true,
      });

      return {
        success: true,
        data: authorizedWallet,
      };
    } catch (error) {
      console.error('Error using access code:', error);
      return {
        success: false,
        error: 'Failed to use access code',
      };
    }
  }
}

export const metadataManager = MetadataManager.getInstance();
