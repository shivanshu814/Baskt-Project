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
} from '../ui/dialog'; // Assuming path to shadcn/ui Dialog
import { Label } from '../ui/label'; // Assuming path to shadcn/ui Label
import { Input } from '../ui/input'; // Assuming path to shadcn/ui Input
import { Button } from '../ui/button'; // Assuming path to shadcn/ui Button
import { useBasktClient } from '@baskt/ui';
import { useToast } from '../../hooks/use-toast';
import { PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { OnchainOrder } from '@baskt/types';

interface FillPositionDialogProps {
    order: OnchainOrder | null;
    isOpen: boolean;
    onClose: () => void;
}

const FillPositionDialog: React.FC<FillPositionDialogProps> = ({ order, isOpen, onClose }) => {
    const [entryPrice, setEntryPrice] = useState('');
    const [oraclePrice, setOraclePrice] = useState('');
    const positionId = new BN(Date.now());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { client } = useBasktClient(); // Initialize your SDK client

    useEffect(() => {
        // Reset fields when a new order is selected or dialog is opened
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
            toast({
                title: 'Error',
                description: 'Client not initialized',
                variant: 'destructive',
            });
            console.error('Client not initialized');
            return;
        }

        if (!entryPrice || !oraclePrice || !positionId) {
            toast({
                title: 'Error',
                description: 'Please fill in all fields.',
                variant: 'destructive',
            });
            console.error('Please fill in all fields.');
            return;
        }

        // Convert prices to numeric values
        const entryPriceNum = parseFloat(entryPrice);
        const oraclePriceNum = parseFloat(oraclePrice);

        if (isNaN(entryPriceNum) || entryPriceNum <= 0) {
            toast({
                title: 'Error',
                description: 'Invalid entry price.',
                variant: 'destructive',
            });
            console.error('Invalid entry price.');
            return;
        }

        if (isNaN(oraclePriceNum) || oraclePriceNum <= 0) {
            toast({
                title: 'Error',
                description: 'Invalid oracle price.',
                variant: 'destructive',
            });
            console.error('Invalid oracle price.');
            return;
        }

        try {
            setIsSubmitting(true);

            const basktId = new PublicKey(order.basktId);
            const entryPriceBN = new BN(entryPriceNum);
            const oraclePriceBN = new BN(oraclePriceNum);

            // First update the oracle price (Oracle Address == BasktId)
            await client.updateOraclePrice(basktId, oraclePriceBN);

            // Then open the position
            await client.openPosition({
                order: await client.getOrderPDA(new BN(order.orderId), new PublicKey(order.owner)),
                positionId: positionId,
                entryPrice: entryPriceBN,
                baskt: basktId,
            });


            toast({
                title: 'Success',
                description: 'Position opened successfully!',
            });
            onClose();
        } catch (error) {
            console.error('Failed to open position:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : String(error),
                variant: 'destructive',
            });
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
                        <Input id="orderIdDisplay" value={order.orderId.toString()} readOnly className="col-span-3 bg-muted" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="basktIdDisplay" className="text-right col-span-1">
                            Baskt ID
                        </Label>
                        <Input id="basktIdDisplay" value={order.basktId.toBase58()} readOnly className="col-span-3 bg-muted" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="directionDisplay" className="text-right col-span-1">
                            Direction
                        </Label>
                        <Input id="directionDisplay" value={order.isLong ? 'Long' : 'Short'} readOnly className="col-span-3 bg-muted" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="sizeDisplay" className="text-right col-span-1">
                            Size
                        </Label>
                        <Input id="sizeDisplay" value={order.size.toString()} readOnly className="col-span-3 bg-muted" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="collateralDisplay" className="text-right col-span-1">
                            Collateral
                        </Label>
                        <Input id="collateralDisplay" value={order.collateral.toString()} readOnly className="col-span-3 bg-muted" />
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
