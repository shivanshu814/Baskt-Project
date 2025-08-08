// apps/admin-app/src/components/orders/ClosePositionDialog.tsx
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
import { OnchainPosition } from '@baskt/types';
import { useProtocol } from '../../hooks/protocols/useProtocol';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
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
    if (!client || !order?.closeParams?.targetPosition) return;

    try {
      const positionPDA = new PublicKey(order.closeParams!.targetPosition!);
      const positionAccount = await client.program.account.position.fetch(positionPDA);
      setPosition({
        ...positionAccount,
        address: positionPDA,
      } as unknown as OnchainPosition);
    } catch (error) {
      // Log error to console for debugging
      toast.error('Failed to fetch position details');
    }
  };

  if (!order || !order.closeParams?.targetPosition) {
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

      const basktId = new PublicKey(order.basktId);
      const exitPriceBN = new BN(parseFloat(exitPrice) * PRICE_PRECISION); // Convert to basis points

      // Ensure targetPosition is not null or undefined before creating PublicKey
      if (!order.closeParams?.targetPosition) {
        throw new Error('Target position is required');
      }
      const positionPDA = new PublicKey(order.closeParams!.targetPosition!);


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
        orderPDA: new PublicKey(order.address),
        position: positionPDA,
        exitPrice: exitPriceBN,
        baskt: basktId,
        ownerTokenAccount,
        treasury: protocol.treasury,
        treasuryTokenAccount,
      });

      toast.success('Position closed successfully');

      onClose();
    } catch (error) {
      // Error handled in toast below
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
          <DialogDescription>
            Enter the exit price to close the position.
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
            <Label htmlFor="positionIdDisplay" className="text-right col-span-1">
              Position ID
            </Label>
            <Input
              id="positionIdDisplay"
              value={position?.positionId?.toString() || 'Loading...'}
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
