import { useEffect, useState } from 'react';
import { useBasktClient } from '@baskt/ui';
import { OnchainOrder } from '@baskt/types';

export const useOrders = () => {
  const { client } = useBasktClient();

  const [orders, setOrders] = useState<OnchainOrder[]>([]);

  useEffect(() => {
    if (!client) return;
    const fetchOrders = async () => {
      const orders = await client.getAllOrders();
      setOrders(orders || []);
    };
    fetchOrders();
  }, [client]);

  return {
    orders,
    isLoading: false,
    error: null,
  };
};
