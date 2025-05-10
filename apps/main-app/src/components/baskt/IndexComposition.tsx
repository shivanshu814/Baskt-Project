import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BasktAssetInfo } from '@baskt/types';

interface IndexCompositionProps {
  assets: BasktAssetInfo[];
}

export function IndexComposition({ assets }: IndexCompositionProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Index Composition</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">24h Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.assetAddress}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{asset.ticker}</span>
                      <span className="text-xs text-muted-foreground">{asset.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{asset.direction ? 'long' : 'short'}</TableCell>
                  <TableCell>{asset.weight}%</TableCell>
                  <TableCell>
                    {asset.price ? `$${asset.price.toLocaleString()}` : 'Price Unavailable'}
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      asset.change24h !== undefined
                        ? asset.change24h >= 0
                          ? 'text-[#16C784]'
                          : 'text-[#EA3943]'
                        : ''
                    }`}
                  >
                    {asset.change24h !== undefined ? (
                      <>
                        {asset.change24h >= 0 ? '+' : ''}
                        {asset.change24h.toFixed(2)}%
                      </>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
