import { Card, CardHeader, CardTitle, CardContent } from '@baskt/ui';
import { Activity } from 'lucide-react';

interface ActivityItem {
  type: 'position' | 'order' | 'history';
  action: string;
  amount: number;
  timestamp: number;
  basktName: string;
  isPositive: boolean;
}

interface RecentActivityProps {
  recentActivity: ActivityItem[];
}

const RecentActivity = ({ recentActivity }: RecentActivityProps) => (
  <Card className="bg-background border border-border rounded-xl shadow-none bg-white/5">
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <span className="text-xl font-bold">Recent Activity</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      {recentActivity.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentActivity.slice(0, 5).map((activity, idx) => (
            <div key={idx} className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-muted text-muted-foreground">
                <Activity className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.action}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.basktName} • {new Date(activity.timestamp).toLocaleDateString()}
                </p>
              </div>
              <div className="text-sm font-medium text-foreground">
                {activity.amount > 0 ? '+' : ''}
                {activity.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default RecentActivity;
