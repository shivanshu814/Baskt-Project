import { Button } from '../../components/src/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/src/card';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  Filter,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type Transaction = {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'purchase';
  amount: number;
  currency: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
};

interface TransactionListProps {
  transactions: Transaction[];
  title?: string;
  showFilters?: boolean;
  className?: string;
}

export function TransactionList({
  transactions,
  title = 'Recent Transactions',
  showFilters = true,
  className,
}: TransactionListProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          {showFilters && (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground opacity-50 mb-2" />
            <h3 className="text-lg font-medium">No transactions yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your transaction history will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-full',
                      transaction.type === 'deposit' ||
                        (transaction.type === 'transfer' &&
                          parseFloat(transaction.amount.toString()) > 0)
                        ? 'bg-success/20 text-success'
                        : 'bg-destructive/20 text-destructive',
                    )}
                  >
                    {transaction.type === 'deposit' ||
                    (transaction.type === 'transfer' &&
                      parseFloat(transaction.amount.toString()) > 0) ? (
                      <ArrowDownCircle className="h-5 w-5" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-muted-foreground">{transaction.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div
                      className={cn(
                        'font-medium',
                        transaction.type === 'deposit' ||
                          (transaction.type === 'transfer' &&
                            parseFloat(transaction.amount.toString()) > 0)
                          ? 'text-success'
                          : 'text-destructive',
                      )}
                    >
                      {transaction.type === 'deposit' ||
                      (transaction.type === 'transfer' &&
                        parseFloat(transaction.amount.toString()) > 0)
                        ? '+'
                        : '-'}{' '}
                      {Math.abs(transaction.amount)} {transaction.currency}
                    </div>
                    <div
                      className={cn(
                        'text-xs',
                        transaction.status === 'completed'
                          ? 'text-success'
                          : transaction.status === 'pending'
                            ? 'text-warning'
                            : 'text-destructive',
                      )}
                    >
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
