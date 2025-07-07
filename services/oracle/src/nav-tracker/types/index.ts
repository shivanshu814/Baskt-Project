export interface BasktInfo {
  _id: string;
  basktId: string;
  name: string;
  price: number;
  assets: any[];
  account: any;
}

export interface BasktResponse {
  result: {
    data: {
      success: boolean;
      data: BasktInfo[];
      message?: string;
    };
  };
}

export interface NavResponse {
  result: {
    data: {
      success: boolean;
      data: {
        price: number;
      };
      message?: string;
    };
  };
}

export interface AssetPriceData {
  asset_id: string;
  price: number;
  time: Date;
}
