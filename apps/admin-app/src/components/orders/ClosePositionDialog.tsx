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
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useBasktClient } from '@baskt/ui';
import { useToast } from '../../hooks/use-toast';
import { PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { OnchainPosition } from '@baskt/types';
import { useProtocol } from '../../hooks/protocols/useProtocol';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { ClosePositionDialogProps } from '../../types/orders';
import { PRICE_PRECISION } from '@baskt/ui';

const ClosePositionDialog: React.FC<ClosePositionDialogProps> = ({ order, isOpen, onClose }) => {
    const [exitPrice, setExitPrice] = useState('');
    const [oraclePrice, setOraclePrice] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [position, setPosition] = useState<OnchainPosition | null>(null);
    const { protocol } = useProtocol();
    const { toast } = useToast();
    const { client } = useBasktClient();

    useEffect(() => {
        // Reset fields when a new order is selected or dialog is opened
        if (isOpen && order) {
            setExitPrice('');
            setOraclePrice('');
            fetchPosition();
        }
    }, [isOpen, order]);

    const fetchPosition = async () => {
        if (!client || !order?.targetPosition) return;

        try {
            const positionPDA = new PublicKey(order.targetPosition);
            const positionAccount = await client.program.account.position.fetch(positionPDA);
            setPosition({
                ...positionAccount,
                address: positionPDA,
            } as unknown as OnchainPosition);
        } catch (error) {
            // Log error to console for debugging
            toast({
                title: 'Error',
                description: 'Failed to fetch position details',
                variant: 'destructive',
            });
        }
    };

    if (!order || !order.targetPosition) {
        return null;
    }

    const handleSubmit = async () => {
        if (!client) {
            toast({
                title: 'Error',
                description: 'Client not initialized',
                variant: 'destructive',
            });
            return;
        }

        if (!exitPrice || !oraclePrice) {
            toast({
                title: 'Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        if (!protocol) {
            toast({
                title: 'Error',
                description: 'Protocol not initialized',
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsSubmitting(true);

            const basktId = new PublicKey(order.basktId);
            const exitPriceBN = new BN(parseFloat(exitPrice) * PRICE_PRECISION); // Convert to basis points
            const oraclePriceBN = new BN(parseFloat(oraclePrice) * PRICE_PRECISION); // Convert to basis points

            // Ensure targetPosition is not null or undefined before creating PublicKey
            if (!order.targetPosition) {
                throw new Error('Target position is required');
            }
            const positionPDA = new PublicKey(order.targetPosition);

            // First update the oracle price (Oracle Address == BasktId)
            await client.updateOraclePrice(basktId, oraclePriceBN);


            // Get treasury token account (USDC account owned by treasury)
            const treasuryTokenAccount = await getAssociatedTokenAddressSync(
                protocol.escrowMint,
                protocol.treasury,
            );

            // Get owner token account (we'll use the matcher's token account)
            const ownerTokenAccount = await getAssociatedTokenAddressSync(
                protocol.escrowMint,
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

            toast({
                title: 'Success',
                description: 'Position closed successfully',
            });

            onClose();
        } catch (error) {
            // Error handled in toast below
            toast({
                title: 'Error',
                description: `Failed to close position: ${error instanceof Error ? error.message : String(error)}`,
                variant: 'destructive',
            });
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
                        Enter the exit price and oracle price to close the position.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="orderIdDisplay" className="text-right col-span-1">
                            Order ID
                        </Label>
                        <Input id="orderIdDisplay" value={order.orderId.toString()} readOnly className="col-span-3 bg-muted" />
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
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="oraclePrice" className="text-right col-span-1">
                            Oracle Price*
                        </Label>
                        <Input
                            id="oraclePrice"
                            placeholder="e.g. 1500.00"
                            type="number"
                            value={oraclePrice}
                            onChange={(e) => setOraclePrice(e.target.value)}
                            className="col-span-3"
                            required
                        />
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !exitPrice || !oraclePrice}>
                        {isSubmitting ? 'Processing...' : 'Close Position'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ClosePositionDialog;