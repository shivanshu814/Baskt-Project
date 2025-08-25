// apps/admin-app/src/components/orders/ClosePositionDialog.tsx
import { OnchainPosition } from '@baskt/types';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  PRICE_PRECISION,
  useBasktClient,
} from '@baskt/ui';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useProtocol } from '../../hooks/protocols/useProtocol';
import { ClosePositionDialogProps } from '../../types/orders';

const ClosePositionDialog: React.FC<ClosePositionDialogProps> = ({ order, isOpen, onClose }) => {
  const [exitPrice, setExitPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [position, setPosition] = useState<OnchainPosition | null>(null);
  const { protocol } = useProtocol();
  const { client } = useBasktClient();

  useEffect(() => {
    // Reset fields when a new order is selected or dialog is opened
    if (isOpen && order) {
      setExitPrice('');
      fetchPosition();
    }
  }, [isOpen, order]);

  const fetchPosition = async () => {
    if (!client || !order?.closeParams?.sizeAsContracts) return;

    try {
      // For now, we'll skip fetching position details since the new structure doesn't have targetPosition
      // This might need to be updated based on how positions are tracked in the new system
      setPosition(null);
    } catch (error) {
      toast.error('Failed to fetch position details');
    }
  };

  if (!order) {
    return null;
  }

  const handleSubmit = async () => {
    if (!client) {
      toast.error('Client not initialized');
      return;
    }

    if (!exitPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!protocol) {
      toast.error('Protocol not initialized');
      return;
    }

    try {
      setIsSubmitting(true);

      // Use the new API structure properties
      const basktId = new PublicKey(order.basktAddress);
      const exitPriceBN = new BN(parseFloat(exitPrice) * PRICE_PRECISION);

      // For now, we'll use the orderPDA from the order data
      const orderPDA = new PublicKey(order.orderPDA);

      // Get treasury token account (USDC account owned by treasury)
      const treasuryTokenAccount = await getAssociatedTokenAddressSync(
        protocol.collateralMint,
        protocol.treasury,
      );

      // Get owner token account (we'll use the matcher's token account)
      const ownerTokenAccount = await getAssociatedTokenAddressSync(
        protocol.collateralMint,
        position?.owner || client.getPublicKey(),
      );

      // Then close the position
      await client.closePosition({
        orderPDA: orderPDA,
        position: orderPDA, // Using orderPDA as position for now - this might need adjustment
        exitPrice: exitPriceBN,
        baskt: basktId,
        ownerTokenAccount,
        treasury: protocol.treasury,
        treasuryTokenAccount,
      });

      toast.success('Position closed successfully');

      onClose();
    } catch (error) {
      toast.error(
        `Failed to close position: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Close Position</DialogTitle>
          <DialogDescription>Enter the exit price to close the position.</DialogDescription>
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
              value={order.basktAddress}
              readOnly
              className="col-span-3 bg-muted"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="exitPrice" className="text-right col-span-1">
              Exit Price*
            </Label>
            <Input
              id="exitPrice"
              placeholder="e.g. 1500.00"
              type="number"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting || !exitPrice}>
            {isSubmitting ? 'Processing...' : 'Close Position'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClosePositionDialog;
