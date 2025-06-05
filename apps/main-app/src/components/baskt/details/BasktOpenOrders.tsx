import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

export const BasktOpenOrders = () => {
  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Open Orders</CardTitle>
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
                <TableCell className="font-medium">Limit Buy</TableCell>
                <TableCell>$1,200.00</TableCell>
                <TableCell>0.5 Baskt</TableCell>
                <TableCell className="text-[#16C784]">Active</TableCell>
                <TableCell className="text-right">2024-03-15</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Market Sell</TableCell>
                <TableCell>$1,150.00</TableCell>
                <TableCell>1.0 Baskt</TableCell>
                <TableCell className="text-[#16C784]">Active</TableCell>
                <TableCell className="text-right">2024-03-15</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
