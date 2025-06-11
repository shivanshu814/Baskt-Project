import React, { useState } from 'react'; // Added React and useState
import { useOrders } from '../../hooks/orders/useOrders';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { formatDate } from '../../utils/pool';
import { Copy, Check, MoreHorizontal } from 'lucide-react';
import { useCopyWithTimeout } from '../../hooks/useCopyWithTimeout';
import { getStatusColor, getActionColor } from '../../utils/orderUtils';
import FillPositionDialog from './FillPositionDialog';
import ClosePositionDialog from './ClosePositionDialog';
import { OnchainOrder, OrderAction, OrderStatus } from '@baskt/types';

const OrderList = () => {
    const { orders = [] } = useOrders();
    const { copiedKey, handleCopy } = useCopyWithTimeout();

    const [isFillDialogOpen, setIsFillDialogOpen] = useState(false);
    const [selectedOrderForFill, setSelectedOrderForFill] = useState<OnchainOrder | null>(null);

    const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
    const [selectedOrderForClose, setSelectedOrderForClose] = useState<OnchainOrder | null>(null);

    const openFillDialog = (order: OnchainOrder) => {
        setSelectedOrderForFill(order);
        setIsFillDialogOpen(true);
    };

    const closeFillDialog = () => {
        setSelectedOrderForFill(null);
        setIsFillDialogOpen(false);
    };

    const openCloseDialog = (order: OnchainOrder) => {
        setSelectedOrderForClose(order);
        setIsCloseDialogOpen(true);
    };

    const closeCloseDialog = () => {
        setSelectedOrderForClose(null);
        setIsCloseDialogOpen(false);
    };



    return (
        <div className="mt-6 rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Order ID / Owner</TableHead>
                        <TableHead>Baskt ID</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Collateral</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                        orders.map((order: OnchainOrder) => (
                            <TableRow key={order.orderId.toString()}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-gray-200 truncate cursor-pointer" onClick={() => handleCopy(order.orderId.toString(), `orderId-${order.orderId}`)}>
                                            {order.orderId.toString()}
                                        </p>
                                        <button
                                            className="p-1 hover:bg-gray-700 rounded"
                                            onClick={() => handleCopy(order.orderId.toString(), `orderId-${order.orderId}`)}
                                            title={copiedKey === `orderId-${order.orderId}` ? 'Copied!' : 'Copy Order ID'}
                                        >
                                            {copiedKey === `orderId-${order.orderId}` ? (
                                                <Check size={14} className="text-green-400" />
                                            ) : (
                                                <Copy size={14} className="text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-sm text-gray-500 cursor-pointer" onClick={() => handleCopy(order.owner.toBase58(), `owner-${order.orderId}`)}>
                                            {order.owner.toBase58().slice(0, 8)}...{order.owner.toBase58().slice(-8)}
                                        </p>
                                        <button
                                            className="p-1 hover:bg-gray-700 rounded"
                                            onClick={() => handleCopy(order.owner.toBase58(), `owner-${order.orderId}`)}
                                            title={copiedKey === `owner-${order.orderId}` ? 'Copied!' : 'Copy Owner'}
                                        >
                                            {copiedKey === `owner-${order.orderId}` ? (
                                                <Check size={14} className="text-green-400" />
                                            ) : (
                                                <Copy size={14} className="text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-gray-200">{order.basktId.toBase58().slice(0, 8)}...{order.basktId.toBase58().slice(-8)}</p>
                                </TableCell>
                                <TableCell>
                                    <p className={`text-sm font-medium ${getActionColor(order.isLong)}`}>{order.isLong ? 'Long' : 'Short'}</p>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-gray-200">{order.action}</p>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-gray-200">{order.size.toString()}</p>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-gray-200">${order.collateral.toString()}</p>
                                </TableCell>
                                <TableCell>
                                    <p className={`text-sm font-medium ${getStatusColor(order.status)}`}>{order.status}</p>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-gray-500">{formatDate(order.timestamp.toNumber())}</p>
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
                                                disabled={!(order.action === OrderAction.Open && order.status === OrderStatus.PENDING)}
                                            >
                                                Fill Position
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => openCloseDialog(order)}
                                                disabled={!(order.action === OrderAction.Close && order.status === OrderStatus.PENDING)}
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
            {isFillDialogOpen && selectedOrderForFill && (
                <FillPositionDialog
                    order={selectedOrderForFill}
                    isOpen={isFillDialogOpen}
                    onClose={closeFillDialog}
                />
            )}
            {isCloseDialogOpen && selectedOrderForClose && (
                <ClosePositionDialog
                    order={selectedOrderForClose}
                    isOpen={isCloseDialogOpen}
                    onClose={closeCloseDialog}
                />
            )}
        </div>
    );
};

export default OrderList;