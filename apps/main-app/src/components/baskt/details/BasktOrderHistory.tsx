import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@baskt/ui';

export const BasktOrderHistory = () => {
  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Order History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Market Buy</TableCell>
                <TableCell>$1,150.00</TableCell>
                <TableCell>1.0 Baskt</TableCell>
                <TableCell className="text-[#16C784]">Completed</TableCell>
                <TableCell className="text-right">2024-03-15</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Limit Sell</TableCell>
                <TableCell>$1,250.00</TableCell>
                <TableCell>0.75 Baskt</TableCell>
                <TableCell className="text-[#16C784]">Completed</TableCell>
                <TableCell className="text-right">2024-03-14</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
