import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { BasktPositionProps } from '../../../types/baskt';

export const BasktPosition = ({ userPosition }: BasktPositionProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Your Position</CardTitle>
      </CardHeader>
      <CardContent>
        {userPosition ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Collateral</span>
              <span className="font-medium">
                ${(userPosition.collateral || userPosition.positionSize * 1.5).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Position Type</span>
              <span
                className={`font-medium ${
                  (userPosition.type || 'long') === 'long' ? 'text-[#16c784]' : 'text-[#ea3943]'
                }`}
              >
                {userPosition.type
                  ? userPosition.type.charAt(0).toUpperCase() + userPosition.type.slice(1)
                  : 'Long'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Entry Price</span>
              <span className="font-medium">${userPosition.entryPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Current Value</span>
              <span className="font-medium">${userPosition.currentValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">P&L</span>
              <span
                className={`font-medium ${
                  userPosition.pnl >= 0 ? 'text-[#16c784]' : 'text-[#ea3943]'
                }`}
              >
                {userPosition.pnl >= 0 ? '+' : ''}
                {userPosition.pnl.toFixed(2)} USD ({userPosition.pnl >= 0 ? '+' : ''}
                {userPosition.pnlPercentage.toFixed(2)}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Open Date</span>
              <span className="font-medium">{userPosition.openDate}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button variant="outline" size="sm">
                Increase
              </Button>
              <Button variant="destructive" size="sm">
                Close Position
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-2">
              <p className="text-muted-foreground mb-2">
                You don't have a position in this Baskt yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Get started by opening a long or short position.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button variant="outline" size="sm" className="w-full">
                <span className="text-[#16c784]">Long</span>
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                <span className="text-[#ea3943]">Short</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
