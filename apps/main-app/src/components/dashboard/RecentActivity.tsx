import { Card, CardHeader, CardTitle, CardContent, Button } from '@baskt/ui';
import { ClipboardList, ExternalLink } from 'lucide-react';
import { NumberFormat } from '@baskt/ui';
import Link from 'next/link';

interface ActivityItem {
  type: 'position' | 'order' | 'history';
  action: string;
  amount: number;
  timestamp: number;
  basktName: string;
  basktId?: string;
  isPositive: boolean;
}

interface RecentActivityProps {
  recentActivity: ActivityItem[];
}

const RecentActivity = ({ recentActivity }: RecentActivityProps) => {
  const hasValidData = recentActivity && recentActivity.length > 0;

  return (
    <Card className="bg-background border border-border rounded-xl shadow-none bg-white/5">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-xl font-bold">Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasValidData ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-muted-foreground text-center">
              <ClipboardList className="w-10 h-10 mb-2 mx-auto" />
              <p className="text-lg font-medium mb-1">No Activity Yet</p>
              <p className="text-sm text-muted-foreground">
                Your recent trading activity will appear here once you start trading.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.slice(0, 5).map((activity, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-muted text-muted-foreground">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.basktName} • {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium text-foreground">
                    {activity.amount > 0 ? '+' : ''}
                    <NumberFormat value={activity.amount * 1e6} isPrice={true} />
                  </div>
                  {activity.type === 'position' && activity.basktName && (
                    <Link href={`/baskts/${encodeURIComponent(activity.basktName)}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-primary hover:bg-primary/10 bg-primary/5"
                      >
                        View
                        <ExternalLink className="h-3 w-3 mr-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
