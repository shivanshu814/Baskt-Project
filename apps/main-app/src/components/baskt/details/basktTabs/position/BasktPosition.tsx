import React, { useState } from 'react';
import { useOpenPositions } from '../../../../../hooks/baskt/trade/useOpenPositions';
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
import { Pencil } from 'lucide-react';
import { OnchainPosition } from '@baskt/types';
import BN from 'bn.js';
import AddCollateralDialog from './AddCollateralDialog';
import { PositionData } from '../../../../../types/position';

const calculatePnL = (
  position: PositionData,
  currentPrice: BN,
): { value: number; percentage: number } => {
  if (!position.entryPrice) return { value: 0, percentage: 0 };

  const entryPrice = new BN(position.entryPrice);
  const size = new BN(position.usdcSize || '0');
  const diff = currentPrice.sub(entryPrice).abs();
  const pnlValue = diff.mul(size).div(entryPrice).toNumber();
  const collateral = new BN(position.collateral || '0');
  const percentage = collateral.gt(new BN(0)) ? (pnlValue / collateral.toNumber()) * 100 : 0;

  return { value: pnlValue, percentage };
};

const calculateFees = (position: PositionData): number => {
  const OPENING_FEE_BPS = 10;
  const CLOSING_FEE_BPS = 10;
  const BPS_DIVISOR = 10000;
  const totalFeeBps = OPENING_FEE_BPS + CLOSING_FEE_BPS;
  const feeRate = totalFeeBps / BPS_DIVISOR;

  const positionValue = new BN(position.usdcSize || '0').toNumber();
  return positionValue * feeRate;
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
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Long/Short</TableHead>
                  <TableHead className="text-xs sm:text-sm">Size</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">
                    Position Value
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">
                    Entry Price
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap underline decoration-dashed underline-offset-4 decoration-1">
                    Current Price
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap underline decoration-dashed underline-offset-4 decoration-1">
                    PNL (ROE) %
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm underline decoration-dashed underline-offset-4 decoration-1">
                    Collateral
                  </TableHead>
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
                        '---'
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {position.usdcSize ? (
                        <NumberFormat value={new BN(position.usdcSize).toNumber()} isPrice={true} />
                      ) : (
                        '---'
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {position.entryPrice ? (
                        <NumberFormat
                          value={new BN(position.entryPrice).toNumber()}
                          isPrice={true}
                        />
                      ) : (
                        '---'
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {navPrice ? (
                        <NumberFormat
                          value={new BN(navPrice.toNumber()).toNumber()}
                          isPrice={true}
                        />
                      ) : (
                        '---'
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
                          {(() => {
                            const pnl = calculatePnL(position, navPrice);
                            const isPositive = position.isLong
                              ? navPrice.gt(new BN(position.entryPrice))
                              : navPrice.lt(new BN(position.entryPrice));
                            return (
                              <>
                                <span>{isPositive ? '+' : '-'}</span>
                                <NumberFormat value={pnl.value} isPrice={true} />
                                <span className="ml-1">
                                  ({isPositive ? '+' : '-'}
                                  {pnl.percentage.toFixed(2)}%)
                                </span>
                              </>
                            );
                          })()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        {position.collateral ? (
                          <NumberFormat
                            value={new BN(position.collateral).toNumber()}
                            isPrice={true}
                          />
                        ) : (
                          '---'
                        )}
                        <Pencil
                          className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-foreground"
                          onClick={() =>
                            openAddCollateralDialog(position as unknown as OnchainPosition)
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {calculateFees(position) > 0 ? (
                        <NumberFormat value={calculateFees(position)} isPrice={true} />
                      ) : (
                        <span className="text-text">{'---'}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3 py-1.5 h-auto text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                        onClick={() => closePosition(position as unknown as OnchainPosition)}
                      >
                        Close
                      </Button>
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
