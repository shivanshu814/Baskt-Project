import { Card, CardContent, CardHeader, CardTitle } from '@baskt/ui';
import { Package, Clock } from 'lucide-react';

const PositionsOrdersCard = ({
  openPositions,
  openOrders,
}: {
  openPositions: number;
  openOrders: number;
}) => (
  <Card className="bg-background border border-border rounded-xl shadow-none bg-white/5">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-xl font-bold">Activity</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-muted/40 p-4 flex items-center justify-center">
            <Package className="h-7 w-7 text-foreground" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground mb-1">Open Positions</span>
            <span className="text-2xl font-bold text-foreground">{openPositions}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-muted/40 p-4 flex items-center justify-center">
            <Clock className="h-7 w-7 text-foreground" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground mb-1">Active Orders</span>
            <span className="text-2xl font-bold text-foreground">{openOrders}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
export default PositionsOrdersCard;
