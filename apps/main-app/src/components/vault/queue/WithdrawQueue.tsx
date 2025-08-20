import { Button, Card, CardContent, NumberFormat } from '@baskt/ui';
import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import { WithdrawQueueProps } from '../../../types/vault';

export const WithdrawQueue: React.FC<WithdrawQueueProps> = React.memo(({ withdrawData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalInQueue = withdrawData?.totalWithdrawalsInQueue || 0;
  const totalCompleted = withdrawData?.totalWithdrawalsInCompleted || 0;
  const userRequests = withdrawData?.withdrawRequests || [];

  const userLpInQueue = userRequests
    .filter((req) => req.status === 'pending')
    .reduce((total, req) => total + req.amount, 0);

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
            <span className="text-muted-foreground">Total Completed: </span>
            <span className="font-medium text-green-500">{totalCompleted}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Current Amount: </span>
            <span className="font-medium text-orange-500">
              <NumberFormat value={userLpInQueue * 1e6} isPrice={true} /> BLP
            </span>
          </div>
        </div>

        {isExpanded && userRequests.length > 0 && (
          <div className="space-y-3">
            {userRequests.map((request, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div>
                    <div className="font-medium">
                      <NumberFormat value={request.amount} isPrice={false} /> BLP
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      request.status === 'pending'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

WithdrawQueue.displayName = 'WithdrawQueue';
