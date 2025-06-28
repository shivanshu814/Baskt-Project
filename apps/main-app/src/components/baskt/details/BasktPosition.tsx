import React, { useState } from 'react';
import { useOpenPositions } from '../../../hooks/baskt/trade/useOpenPositions';
import {
  NumberFormat,
  useBasktClient,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
} from '@baskt/ui';
import { OnchainPosition } from '@baskt/types';
import BN from 'bn.js';
import AddCollateralDialog from './AddCollateralDialog';
import { PositionData } from '../../../types/position';

const calculatePnL = (position: PositionData, currentPrice: BN): number => {
  if (!position.entryPrice) return 0;

  const entryPrice = new BN(position.entryPrice);
  const size = new BN(position.usdcSize || '0');
  const diff = currentPrice.sub(entryPrice).abs();
  const pnl = diff.mul(size).div(entryPrice).toNumber();
  return pnl;
};

// eslint-disable-next-line
const calculateFees = (position: PositionData): number => {
  return 0;
};

export const BasktPosition = ({ basktId, navPrice }: { basktId: string; navPrice?: BN }) => {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();
  const {
    positions = [],
    closePosition,
    addCollateral,
  } = useOpenPositions(basktId, userAddress, navPrice);
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
    <Card className="rounded-none border-0 shadow-none">
      <CardHeader className="p-0 mb-2">
        <CardTitle className="text-base sm:text-lg font-medium">Your Positions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {positions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Long/Short</TableHead>
                  <TableHead className="text-xs sm:text-sm">Size</TableHead>
                  <TableHead className="text-xs sm:text-sm">Collateral</TableHead>
                  <TableHead className="text-xs sm:text-sm">Entry Price</TableHead>
                  <TableHead className="text-xs sm:text-sm">Current Price</TableHead>
                  <TableHead className="text-xs sm:text-sm">PnL</TableHead>
                  <TableHead className="text-xs sm:text-sm">Fees</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position: PositionData) => (
                  <TableRow key={position.positionPDA}>
                    <TableCell className="font-medium text-xs sm:text-sm">
                      <span className={`${position.isLong ? 'text-green-500' : 'text-red-500'}`}>
                        {position.isLong ? 'Long' : 'Short'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {position.size ? (
                        <NumberFormat value={new BN(position.size).toNumber() / 1e6} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {position.collateral ? (
                        <NumberFormat
                          value={new BN(position.collateral).toNumber()}
                          isPrice={true}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {position.entryPrice ? (
                        <NumberFormat
                          value={new BN(position.entryPrice).toNumber()}
                          isPrice={true}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {navPrice ? (
                        <NumberFormat
                          value={new BN(navPrice.toNumber()).toNumber()}
                          isPrice={true}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {navPrice && (
                        <span
                          className={`${
                            position.isLong
                              ? navPrice.gt(new BN(position.entryPrice))
                                ? 'text-green-500'
                                : 'text-red-500'
                              : navPrice.lt(new BN(position.entryPrice))
                              ? 'text-green-500'
                              : 'text-red-500'
                          }`}
                        >
                          <NumberFormat value={calculatePnL(position, navPrice)} isPrice={true} />
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {calculateFees(position) > 0 ? (
                        <NumberFormat value={calculateFees(position)} isPrice={true} />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col sm:flex-row justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-2 py-1 h-auto text-xs"
                          onClick={() =>
                            openAddCollateralDialog(position as unknown as OnchainPosition)
                          }
                        >
                          Add Collateral
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="px-2 py-1 h-auto text-xs"
                          onClick={() => closePosition(position as unknown as OnchainPosition)}
                        >
                          Close
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="text-center py-2">
              <p className="text-muted-foreground mb-2 text-sm">
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
