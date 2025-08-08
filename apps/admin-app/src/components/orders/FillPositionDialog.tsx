// apps/admin-app/src/components/orders/FillPositionDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Label,
  Input,
  Button,
  useBasktClient,
  PRICE_PRECISION,
} from '@baskt/ui';
import { toast } from 'sonner';
import { PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { FillPositionDialogProps } from '../../types/orders';

const FillPositionDialog: React.FC<FillPositionDialogProps> = ({ order, isOpen, onClose }) => {
  const [entryPrice, setEntryPrice] = useState('');
  const [oraclePrice, setOraclePrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { client } = useBasktClient();
  const positionId = client?.newUID();

  useEffect(() => {
    if (isOpen && order) {
      setEntryPrice('');
      setOraclePrice('');
    }
  }, [isOpen, order]);

  if (!order) {
    return null;
  }

  const handleSubmit = async () => {
    if (!client) {
      toast.error('Client not initialized');
      return;
    }

    if (!entryPrice || !oraclePrice || !positionId) {
      toast.error('Please fill in all fields.');
      return;
    }

    const entryPriceNum = parseFloat(entryPrice);
    const oraclePriceNum = parseFloat(oraclePrice);

    if (isNaN(entryPriceNum) || entryPriceNum <= 0) {
      toast.error('Invalid entry price.');
      return;
    }

    if (isNaN(oraclePriceNum) || oraclePriceNum <= 0) {
      toast.error('Invalid oracle price.');
      return;
    }

    try {
      setIsSubmitting(true);

      const basktId = new PublicKey(order.basktId);
      const entryPriceBN = new BN(entryPriceNum * PRICE_PRECISION);
      const oraclePriceBN = new BN(oraclePriceNum * PRICE_PRECISION);


      await client.openPosition({
        order: await client.getOrderPDA(order.orderId, new PublicKey(order.owner)),
        positionId: positionId,
        entryPrice: entryPriceBN,
        baskt: basktId,
      });

      toast.success('Position opened successfully!');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Fill Position for Order</DialogTitle>
          <DialogDescription>
            Review order details and provide the entry price and a new position ID.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="orderIdDisplay" className="text-right col-span-1">
              Order ID
            </Label>
            <Input
              id="orderIdDisplay"
              value={order.orderId.toString()}
              readOnly
              className="col-span-3 bg-muted"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="basktIdDisplay" className="text-right col-span-1">
              Baskt ID
            </Label>
            <Input
              id="basktIdDisplay"
              value={order.basktId.toBase58()}
              readOnly
              className="col-span-3 bg-muted"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="directionDisplay" className="text-right col-span-1">
              Direction
            </Label>
            <Input
              id="directionDisplay"
              value={order.openParams?.isLong ? 'Long' : 'Short'}
              readOnly
              className="col-span-3 bg-muted"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sizeDisplay" className="text-right col-span-1">
              Size
            </Label>
            <Input
              id="sizeDisplay"
              value={order.openParams?.notionalValue?.toString() || order.closeParams?.sizeAsContracts?.toString() || '0'}
              readOnly
              className="col-span-3 bg-muted"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="collateralDisplay" className="text-right col-span-1">
              Collateral
            </Label>
            <Input
              id="collateralDisplay"
              value={order.openParams?.collateral?.toString() || '0'}
              readOnly
              className="col-span-3 bg-muted"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="oraclePrice" className="text-right col-span-1">
              Oracle Price
            </Label>
            <Input
              id="oraclePrice"
              type="number"
              value={oraclePrice}
              onChange={(e) => setOraclePrice(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 150.50"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="entryPrice" className="text-right col-span-1">
              Entry Price
            </Label>
            <Input
              id="entryPrice"
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 150.75"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Filling...' : 'Fill Position'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FillPositionDialog;
