export interface WithdrawQueueItem {
  id: string;
  poolId: string;
  providerAddress: string;
  lpAmount: string;
  remainingLp: string;
  providerTokenAccount: string;
  queuePosition: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  requestedAt: string;
  processedAt?: string;
  amountProcessed?: string;
  feeCollected?: string;
  tx: string;
  processedTx?: string;
}

export interface WithdrawQueueStats {
  totalQueueItems: number;
  averageProcessingTime: number;
  queueProcessingRate: number;
  estimatedWaitTime?: number;
  userQueuePosition?: number;
  nextProcessingTime?: string;
  processingInterval?: number;
  isProcessingNow?: boolean;
}

export interface WithdrawQueueProcessingResult {
  success: boolean;
  processedAmount: string;
  feeCollected: string;
  tx: string;
}
