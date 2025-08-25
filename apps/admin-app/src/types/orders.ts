export interface order {
  _id: string;
  owner: string;
  orderPDA: string;
  orderId: number;
  baskt: string;
  basktAddress: string;
  orderStatus: string;
  orderAction: string;
  orderType: string;
  openParams: {
    notionalValue: string;
    leverageBps: number;
    collateral: string;
    isLong: boolean;
  };
  closeParams: {
    sizeAsContracts: string;
  };
  createOrder: {
    tx: string;
    ts: string;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface FillPositionDialogProps {
  order: order | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface ClosePositionDialogProps {
  order: order | null;
  isOpen: boolean;
  onClose: () => void;
}
