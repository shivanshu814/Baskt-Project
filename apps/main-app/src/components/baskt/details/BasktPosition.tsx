import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { useOpenPositions } from '../../../hooks/baskt/trade/useOpenPositions';
import { NumberFormat, PublicKeyText, useBasktClient } from '@baskt/ui';
import { OnchainPosition, PositionStatus } from '@baskt/types';
import { BN } from 'bn.js';
import AddCollateralDialog from './AddCollateralDialog';

export const BasktPosition = ({ basktId }: { basktId: string }) => {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();
  const { positions = [], closePosition, addCollateral } = useOpenPositions(basktId, userAddress);
  const [isAddCollateralDialogOpen, setIsAddCollateralDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<OnchainPosition | null>(null);

  const openAddCollateralDialog = (position: OnchainPosition) => {
    setSelectedPosition(position);
    setIsAddCollateralDialogOpen(true);
  };

  const closeAddCollateralDialog = () => {
    setSelectedPosition(null);
    setIsAddCollateralDialogOpen(false);
  };

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Your Positions</CardTitle>
      </CardHeader>
      <CardContent>
        {positions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position ID</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Collateral</TableHead>
                  <TableHead>Entry Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Open Date</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!positions || positions.length === 0 ? (
                  <TableRow>
                    {[...Array(7)].map((_, i) => (
                      <TableCell key={i} className="py-8" />
                    ))}
                  </TableRow>
                ) : (
                  positions.map((position: OnchainPosition) => (
                    <TableRow key={position.address.toString()}>
                      <TableCell className="font-medium">
                        <PublicKeyText publicKey={position.address.toString()} isCopy={true} />
                      </TableCell>
                      <TableCell>
                        {position.size ? <NumberFormat value={new BN(position.size).toNumber()} isPrice={true} /> : '-'}
                      </TableCell>
                      <TableCell>
                        {position.collateral ? <NumberFormat value={new BN(position.collateral).toNumber()} isPrice={true} /> : '-'}
                      </TableCell>
                      <TableCell>
                        {position.entryPrice ? <NumberFormat value={new BN(position.entryPrice).toNumber()} isPrice={true} /> : '-'}
                      </TableCell>
                      <TableCell className="text-[#16C784]">
                        {position.status === PositionStatus.OPEN ? 'Open' : position.status === PositionStatus.CLOSED ? 'Closed' : 'Liquidated'}
                      </TableCell>
                      <TableCell className="text-right">
                        {position.timestampOpen
                          ? new Date(new BN(position.timestampOpen).toNumber() * 1000).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="px-2 py-1 h-auto text-xs"
                            onClick={() => openAddCollateralDialog(position)}>
                            Add Collateral
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="px-2 py-1 h-auto text-xs"
                            onClick={() => closePosition(position)}
                          >
                            Close
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="text-center py-2">
              <p className="text-muted-foreground mb-2">
                You don't have any positions in this Baskt yet.
              </p>
            </div>
          </div>
        )}

        {/* Add Collateral Dialog */}
        {isAddCollateralDialogOpen && selectedPosition && (
          <AddCollateralDialog
            position={selectedPosition}
            isOpen={isAddCollateralDialogOpen}
            onClose={closeAddCollateralDialog}
            onAddCollateral={addCollateral}
          />
        )}
      </CardContent>
    </Card>
  );
};
