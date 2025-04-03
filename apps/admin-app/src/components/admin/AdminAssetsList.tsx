'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';

type Asset = {
  id: string;
  ticker: string;
  oracleType: string;
  oracleAddress: string;
  allowLong: boolean;
  allowShort: boolean;
  status: 'active' | 'inactive';
};

const mockAssets: Asset[] = [
  {
    id: '1',
    ticker: 'BTC-USD',
    oracleType: 'Pyth',
    oracleAddress: '8ibFbzbAKTTQjECGDtjVfGEMwvQSKYARrm4FUcxbPPBW',
    allowLong: true,
    allowShort: true,
    status: 'active',
  },
  {
    id: '2',
    ticker: 'ETH-USD',
    oracleType: 'Switchboard',
    oracleAddress: 'CrZCEJdAkWvz2pv1gQ4HJ6Rvnm4N4NBBi2Q6mPC7PwEF',
    allowLong: true,
    allowShort: false,
    status: 'active',
  },
  {
    id: '3',
    ticker: 'SOL-USD',
    oracleType: 'Custom',
    oracleAddress: '5aBLm4P1L1qGhVnKMULwAKnTEcnwzd22x3HSFhoqwmJo',
    allowLong: true,
    allowShort: true,
    status: 'inactive',
  },
];

export function AdminAssetsList() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Oracle Type</TableHead>
            <TableHead>Oracle Address</TableHead>
            <TableHead>Allow Long</TableHead>
            <TableHead>Allow Short</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockAssets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="font-medium">{asset.ticker}</TableCell>
              <TableCell>{asset.oracleType}</TableCell>
              <TableCell
                className="font-mono text-xs truncate max-w-[150px]"
                title={asset.oracleAddress}
              >
                {asset.oracleAddress}
              </TableCell>
              <TableCell>
                <Switch checked={asset.allowLong} />
              </TableCell>
              <TableCell>
                <Switch checked={asset.allowShort} />
              </TableCell>
              <TableCell>
                <Badge
                  variant={asset.status === 'active' ? 'default' : 'outline'}
                  className={asset.status === 'active' ? 'bg-green-500' : ''}
                >
                  {asset.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                  >
                    Disable
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
