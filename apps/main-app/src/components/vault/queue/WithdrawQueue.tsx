import { Button, Card, CardContent, CardTitle, NumberFormat } from '@baskt/ui';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { useWithdrawQueue } from '../../../hooks/vault/use-withdrawal-queue';
import { WithdrawQueueProps } from '../../../types/vault';

export const WithdrawQueue: React.FC<WithdrawQueueProps> = ({ poolId, userAddress }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { userQueueItems, isLoading } = useWithdrawQueue({ poolId, userAddress });

  const userLpInQueue = userQueueItems.reduce(
    (total, item) => total + parseFloat(item.remainingLp || '0'),
    0,
  );

  const totalProcessed = userQueueItems.filter((item) => item.status === 'completed').length;
  const totalInQueue = userQueueItems.filter((item) => item.status === 'pending').length;

  if (isLoading) {
    return (
      <Card className="border border-primary/10">
        <CardTitle className="flex items-center gap-2 p-4">
          <Loader2 className="h-5 w-5 animate-spin" />
          Withdrawals
        </CardTitle>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userAddress || (userLpInQueue === 0 && totalProcessed === 0)) return null;

  return (
    <Card className="border border-primary/10">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Withdrawals</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mb-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total in Queue: </span>
            <span className="font-medium text-blue-500">{totalInQueue}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Processed: </span>
            <span className="font-medium text-green-500">{totalProcessed}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Current Amount: </span>
            <span className="font-medium text-orange-500">
              <NumberFormat value={userLpInQueue} isPrice={true} /> BLP
            </span>
          </div>
        </div>

        {isExpanded && userQueueItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Position</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Amount (BLP)</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Requested</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Processed</th>
                </tr>
              </thead>
              <tbody>
                {userQueueItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-3 font-medium">#{item.queuePosition}</td>
                    <td className="py-3">
                      <NumberFormat value={parseFloat(item.remainingLp)} isPrice={true} />
                    </td>
                    <td className="py-3">
                      <span
                        className={`font-medium ${
                          item.status === 'completed'
                            ? 'text-green-500'
                            : item.status === 'processing'
                            ? 'text-yellow-500'
                            : 'text-blue-500'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(item.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {item.processedAt ? new Date(item.processedAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
