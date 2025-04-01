'use client';

import { Transaction } from '../components/payments/TransactionList';
import { useState } from 'react';

export function useTransactionData() {
  const [transactions] = useState<Transaction[]>([
    {
      id: 'tx1',
      type: 'deposit',
      amount: 500,
      currency: 'USD',
      date: '2023-11-25 14:30',
      status: 'completed',
      description: 'Deposit via Bank Transfer',
    },
    {
      id: 'tx2',
      type: 'purchase',
      amount: 0.05,
      currency: 'BTC',
      date: '2023-11-23 09:15',
      status: 'completed',
      description: 'Buy Bitcoin',
    },
    {
      id: 'tx3',
      type: 'transfer',
      amount: 20,
      currency: 'ETH',
      date: '2023-11-20 16:45',
      status: 'completed',
      description: 'Transfer to External Wallet',
    },
    {
      id: 'tx4',
      type: 'withdrawal',
      amount: 1000,
      currency: 'USD',
      date: '2023-11-18 11:30',
      status: 'pending',
      description: 'Withdrawal to Bank Account',
    },
    {
      id: 'tx5',
      type: 'purchase',
      amount: 100,
      currency: 'SOL',
      date: '2023-11-15 13:20',
      status: 'completed',
      description: 'Buy Solana',
    },
    {
      id: 'tx6',
      type: 'deposit',
      amount: 2500,
      currency: 'USD',
      date: '2023-11-10 10:00',
      status: 'completed',
      description: 'Deposit via Credit Card',
    },
    {
      id: 'tx7',
      type: 'withdrawal',
      amount: 750,
      currency: 'USD',
      date: '2023-11-05 17:10',
      status: 'failed',
      description: 'Withdrawal to Bank Account',
    },
  ]);

  const recentTransactions = transactions.slice(0, 3);

  return {
    transactions,
    recentTransactions,
  };
}
