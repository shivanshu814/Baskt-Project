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
} from "../ui/dropdown-menu"; // Added DropdownMenu components
import { formatDate } from '../../utils/pool';
import { Copy, Check, MoreHorizontal } from 'lucide-react'; // Added MoreHorizontal
import { useCopyWithTimeout } from '../../hooks/useCopyWithTimeout';
import { getStatusColor, getActionColor } from '../../utils/orderUtils';
import FillPositionDialog from './FillPositionDialog'; // Import the dialog

// Define a more specific type for your order object if you have one
// This is a placeholder based on usage in the component.
interface Order {
    orderId: string;
    owner: string;
    basktId: string;
    isLong: boolean;
    action: string; // e.g., 'Open', 'Close'
    size: number;
    collateral: number;
    status: string; // e.g., 'Pending', 'Filled', 'Cancelled'
    timestamp: number;
    // Add other fields as necessary
}

const OrderList = () => {
    const { orders = [], isLoading, error } = useOrders();
    const { copiedKey, handleCopy } = useCopyWithTimeout();

    const [isFillDialogOpen, setIsFillDialogOpen] = useState(false);
    const [selectedOrderForFill, setSelectedOrderForFill] = useState<Order | null>(null);

    const openFillDialog = (order: Order) => {
        setSelectedOrderForFill(order);
        setIsFillDialogOpen(true);
    };

    const closeFillDialog = () => {
        setSelectedOrderForFill(null);
        setIsFillDialogOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error instanceof Error) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-red-500">Error loading orders: {error.message}</p>
            </div>
        );
    }

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
                        <TableHead className="text-right">Actions</TableHead> {/* Added Actions header */}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.length === 0 ? (
                        <TableRow>
                            {/* Updated colSpan to 9 */}
                            <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                                No orders found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        orders.map((order: Order) => (
                            <TableRow key={order.orderId}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-gray-200 truncate cursor-pointer" onClick={() => handleCopy(order.orderId, `orderId-${order.orderId}`)}>
                                            {order.orderId}
                                        </p>
                                        <button
                                            className="p-1 hover:bg-gray-700 rounded"
                                            onClick={() => handleCopy(order.orderId, `orderId-${order.orderId}`)}
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
                                        <p className="text-sm text-gray-500 cursor-pointer" onClick={() => handleCopy(order.owner, `owner-${order.orderId}`)}>
                                            {order.owner.slice(0, 8)}...{order.owner.slice(-8)}
                                        </p>
                                        <button
                                            className="p-1 hover:bg-gray-700 rounded"
                                            onClick={() => handleCopy(order.owner, `owner-${order.orderId}`)}
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
                                    <p className="text-sm text-gray-200">{order.basktId.slice(0, 8)}...{order.basktId.slice(-8)}</p>
                                </TableCell>
                                <TableCell>
                                    <p className={`text-sm font-medium ${getActionColor(order.isLong)}`}>{order.isLong ? 'Long' : 'Short'}</p>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-gray-200">{order.action}</p>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-gray-200">{order.size.toFixed(2)}</p>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-gray-200">${order.collateral.toFixed(2)}</p>
                                </TableCell>
                                <TableCell>
                                    <p className={`text-sm font-medium ${getStatusColor(order.status)}`}>{order.status}</p>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-gray-500">{formatDate(order.timestamp)}</p>
                                </TableCell>
                                <TableCell className="text-right"> {/* Added Actions cell */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-1 rounded hover:bg-gray-700 focus:outline-none">
                                                <MoreHorizontal className="w-5 h-5 text-gray-400" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => openFillDialog(order)}
                                                disabled={!(order.action === 'Open' && order.status === 'Pending')}
                                            >
                                                Fill Position
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
        </div>
    );
};

export default OrderList;