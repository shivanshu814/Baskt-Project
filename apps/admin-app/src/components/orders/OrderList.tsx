import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  NumberFormat,
  PublicKeyText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@baskt/ui';
import { MoreHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useOrders } from '../../hooks/orders/useOrders';
import { useCopyWithTimeout } from '../../hooks/useCopyWithTimeout';
import { order } from '../../types/orders';
import { getActionColor, getStatusColor } from '../../utils/orderUtils';
import { formatDate } from '../../utils/pool';
import ClosePositionDialog from './ClosePositionDialog';
import FillPositionDialog from './FillPositionDialog';

const OrderList = () => {
  const { orders = [] } = useOrders();
  const { handleCopy } = useCopyWithTimeout();

  const [isFillDialogOpen, setIsFillDialogOpen] = useState(false);
  const [selectedOrderForFill, setSelectedOrderForFill] = useState<order | null>(null);

  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [selectedOrderForClose, setSelectedOrderForClose] = useState<order | null>(null);

  const orderCounts = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((order: order) => order.orderStatus === 'PENDING').length;
    return { total, pending };
  }, [orders]);

  const openFillDialog = (order: order) => {
    setSelectedOrderForFill(order);
    setIsFillDialogOpen(true);
  };

  const closeFillDialog = () => {
    setSelectedOrderForFill(null);
    setIsFillDialogOpen(false);
  };

  const openCloseDialog = (order: order) => {
    setSelectedOrderForClose(order);
    setIsCloseDialogOpen(true);
  };

  const closeCloseDialog = () => {
    setSelectedOrderForClose(null);
    setIsCloseDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mt-2 text-2xl font-bold text-white">Orders ({orderCounts.total})</h2>
          <p className="text-white/60 mt-1">Manage and monitor all orders in the system</p>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID / Owner</TableHead>
              <TableHead>Baskt ID</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Collateral</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Order Type</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order: order) => (
                <TableRow key={order.orderId.toString()}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="text-sm font-medium text-gray-200 truncate cursor-pointer"
                        onClick={() =>
                          handleCopy(order.orderId.toString(), `orderId-${order.orderId}`)
                        }
                      >
                        <PublicKeyText
                          publicKey={order.orderId.toString()}
                          isCopy={true}
                          noFormat={true}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="text-sm text-gray-500 cursor-pointer"
                        onClick={() => handleCopy(order.owner, `owner-${order.orderId}`)}
                      >
                        <PublicKeyText publicKey={order.owner} isCopy={true} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-200">
                      <PublicKeyText publicKey={order.basktAddress} isCopy={true} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className={`text-sm font-medium ${getActionColor(
                        order.openParams?.isLong ?? false,
                      )}`}
                    >
                      {order.openParams?.isLong ? 'Long' : 'Short'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-200">{order.orderAction}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-200">
                      <NumberFormat
                        value={parseFloat(order.openParams?.collateral || '0')}
                        isPrice={true}
                        showCurrency={true}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {formatDate(Math.floor(new Date(order.createdAt).getTime() / 1000))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">{order.orderType}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded hover:bg-gray-700 focus:outline-none">
                          <MoreHorizontal className="w-5 h-5 text-gray-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openFillDialog(order)}
                          disabled={
                            !(order.orderAction === 'OPEN' && order.orderStatus === 'PENDING')
                          }
                        >
                          Fill Position
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openCloseDialog(order)}
                          disabled={
                            !(order.orderAction === 'CLOSE' && order.orderStatus === 'PENDING')
                          }
                        >
                          Close Position
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {isFillDialogOpen && selectedOrderForFill && (
        <FillPositionDialog
          order={selectedOrderForFill as any}
          isOpen={isFillDialogOpen}
          onClose={closeFillDialog}
        />
      )}
      {isCloseDialogOpen && selectedOrderForClose && (
        <ClosePositionDialog
          order={selectedOrderForClose as any}
          isOpen={isCloseDialogOpen}
          onClose={closeCloseDialog}
        />
      )}
    </div>
  );
};

export default OrderList;
