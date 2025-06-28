import { Card, CardContent, CardHeader, CardTitle } from '@baskt/ui';
import { Wallet, DollarSign } from 'lucide-react';
import { NumberFormat } from '@baskt/ui';

const UsdcCollateralCard = ({
  usdcBalance,
  totalCollateral,
}: {
  usdcBalance: number;
  totalCollateral: number;
}) => (
  <Card className="bg-background border border-border rounded-xl shadow-none bg-white/5">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-xl font-bold">Funds</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-muted/40 p-4 flex items-center justify-center">
            <Wallet className="h-7 w-7 text-foreground" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground mb-1">USDC Balance</span>
            <span className="text-2xl font-bold text-foreground">
              $<NumberFormat value={usdcBalance} />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-muted/40 p-4 flex items-center justify-center">
            <DollarSign className="h-7 w-7 text-foreground" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground mb-1">Total Collateral</span>
            <span className="text-2xl font-bold text-foreground">
              <NumberFormat value={totalCollateral} isPrice={true} />
            </span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
export default UsdcCollateralCard;
