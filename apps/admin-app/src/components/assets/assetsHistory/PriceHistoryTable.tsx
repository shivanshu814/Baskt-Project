import React from 'react';
import { Card } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Loading } from '../../ui/loading';
import { formatDate } from '../../../utils/date';
import { formatTableValue, getTableRowKey } from '../../../utils/table';
import { PriceHistoryTableProps } from '../../../types/assets';
import { BASIS_POINT } from '../../../constants/pool';

export const PriceHistoryTable: React.FC<PriceHistoryTableProps> = ({ data, isLoading, error }) => {
  return (
    <Card className="bg-[#010b1d] border-white/10">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10">
            <TableHead className="text-[#E5E7EB]">Time</TableHead>
            <TableHead className="text-[#E5E7EB]">Price</TableHead>
            <TableHead className="text-[#E5E7EB]">Raw Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} className="h-32">
                <div className="flex items-center justify-center">
                  <Loading />
                </div>
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-red-500">
                {error.message}
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-[#E5E7EB]/60">
                No price data available
              </TableCell>
            </TableRow>
          ) : (
            // eslint-disable-next-line
            data.map((row: any, i: number) => (
              <TableRow key={getTableRowKey(i)} className="border-white/10">
                <TableCell className="text-[#E5E7EB]">{formatDate(row.time)}</TableCell>
                <TableCell className="text-[#E5E7EB]">{formatTableValue(row.price / BASIS_POINT)}</TableCell>
                <TableCell className="text-[#E5E7EB]">{formatTableValue(row.rawPrice / BASIS_POINT)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
};
