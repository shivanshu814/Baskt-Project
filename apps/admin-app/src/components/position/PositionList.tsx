import { usePositions } from '../../hooks/usePositions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { formatDate } from '../../utils/date';

const PositionList = () => {
    const { data: positions = [], isLoading, error } = usePositions();

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
                <p className="text-red-500">Error loading positions: {error.message}</p>
            </div>
        );
    }
    console.log(positions)

    return (
        <div className="mt-6 rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Position ID</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Baskt ID</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Collateral</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Opened</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {positions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                                No positions found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        positions.map((position) => (
                            <TableRow key={position.publicKey.toString()}>
                                <TableCell>
                                    <p className="text-sm font-medium text-gray-200 truncate cursor-pointer">
                                        {position.positionId.toString()}
                                    </p>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-gray-500 cursor-pointer">
                                        {position.owner.toString().slice(0, 8)}...{position.owner.toString().slice(-8)}
                                    </p>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-gray-200">
                                        {position.basktId.toString().slice(0, 8)}...{position.basktId.toString().slice(-8)}
                                    </p>
                                </TableCell>
                                <TableCell>
                                    <p className={`text-sm font-medium ${position.isLong ? 'text-green-500' : 'text-red-500'}`}>{position.isLong ? 'Long' : 'Short'}</p>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-gray-200">{position.size.toString()}</p>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-gray-200">{position.collateral.toString()}</p>
                                </TableCell>
                                <TableCell>
                                    <p className={`text-sm font-medium ${position.status === 'open'
                                        ? 'text-green-500'
                                        : position.status === 'closed'
                                            ? 'text-gray-400'
                                            : 'text-red-500'
                                        }`}>
                                        {JSON.stringify(position.status)}
                                    </p>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-gray-500">{formatDate(position.timestampOpen)}</p>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default PositionList;