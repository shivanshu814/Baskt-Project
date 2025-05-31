import { TableCell, TableRow } from '../ui/table';
import { Loading } from '../ui/loading';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { ASSET_TABLE_CONFIG } from '../../config/assets';
import { AssetTableCell } from './AssetTableCell';
import { AssetTableProps } from '../../types/assets';

export function AssetTable({ assets, isLoading, onViewPrices }: AssetTableProps) {
  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={ASSET_TABLE_CONFIG.length + 1} className="h-32">
          <div className="flex items-center justify-center">
            <Loading />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (assets.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={ASSET_TABLE_CONFIG.length + 1} className="h-32">
          <div className="flex items-center justify-center">
            <Loading />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {assets.map((asset) => (
        <TableRow key={asset.account.address.toString()}>
          {ASSET_TABLE_CONFIG.map((header) => (
            <AssetTableCell key={header.id} asset={asset} id={header.id} />
          ))}
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                  <MoreHorizontal size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewPrices(asset)}>View Prices</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
