'use client';

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@baskt/ui';
import { Clock, History, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useGetRebalanceHistory } from '../../../../hooks/trade/action/rebalance/getRebalanceHistory';
import { RebalanceHistoryModalProps } from '../../../../types/baskt/rebalance';
import { RebalanceItem } from './rebalanceHistory/RebalanceItem';

export function RebalanceHistoryModal({ isOpen, onClose, basktId }: RebalanceHistoryModalProps) {
  const { rebalanceHistory, loading, error } = useGetRebalanceHistory(basktId);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (rebalanceHistory.length > 0 && expandedItems.size === 0) {
      const firstId = rebalanceHistory[0]._id;
      if (firstId) setExpandedItems(new Set([firstId]));
    }
  }, [rebalanceHistory]);

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      newSet.has(itemId) ? newSet.delete(itemId) : newSet.add(itemId);
      return newSet;
    });
  };

  const expandAll = () =>
    setExpandedItems(new Set(rebalanceHistory.filter((item) => item._id).map((item) => item._id!)));
  const collapseAll = () => setExpandedItems(new Set());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-w-[98vw] w-full h-[90vh] max-h-[800px] p-0 rounded-sm overflow-hidden shadow-2xl border border-border/50 bg-zinc-900/95 backdrop-blur-sm flex flex-col">
        <DialogHeader className="p-6 pb-4 flex-shrink-0 bg-gradient-to-r from-zinc-900/90 to-zinc-800/90 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-sm bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center border border-primary/20 shadow-lg">
                <History className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Rebalance History
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  View detailed rebalance history for this baskt ({rebalanceHistory.length}{' '}
                  rebalances)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {rebalanceHistory.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={expandAll}
                    className="text-xs bg-zinc-800/50 border-border/50 hover:bg-zinc-700/50 hover:border-border text-muted-foreground hover:text-white transition-all duration-200"
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={collapseAll}
                    className="text-xs bg-zinc-800/50 border-border/50 hover:bg-zinc-700/50 hover:border-border text-muted-foreground hover:text-white transition-all duration-200"
                  >
                    Collapse All
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-10 w-10 p-0 hover:bg-zinc-800/50 rounded-sm transition-all duration-200 group"
              >
                <X className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 flex-1 overflow-y-auto">
          {loading && (
            <div className="flex justify-center items-center h-32">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/20 border-t-primary"></div>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/40 animate-pulse"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-6 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <span className="text-red-400 text-sm">!</span>
                </div>
                <p className="text-red-400 font-medium">{error.message}</p>
              </div>
            </div>
          )}

          {!loading && !error && rebalanceHistory.length === 0 && (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-sm bg-zinc-800/50 flex items-center justify-center mx-auto mb-4 border border-border/30">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg font-medium">
                No rebalance history available
              </p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                This baskt hasn't been rebalanced yet
              </p>
            </div>
          )}

          {!loading && !error && rebalanceHistory.length > 0 && (
            <div className="space-y-3 pb-4">
              {rebalanceHistory.map((item) =>
                item._id ? (
                  <RebalanceItem
                    key={item._id}
                    item={item}
                    isExpanded={expandedItems.has(item._id)}
                    onToggle={() => toggleItem(item._id!)}
                  />
                ) : null,
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
