import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BasktAssetInfo } from '@baskt/types';

interface IndexCompositionProps {
  assets: BasktAssetInfo[];
}

export function changeFromCurrentPrice(asset: BasktAssetInfo) {
  const change = asset.price - (asset.baselinePrice || asset.price);
  const changePercentage = (change / (asset.baselinePrice || asset.price)) * 100;
  return changePercentage;
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
                <TableHead>Baseline Price</TableHead>
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
                    {asset.baselinePrice !== undefined ? `$${(asset.baselinePrice / 1e9).toFixed(8)}` : 'Price Unavailable'}
                  </TableCell>
                  <TableCell>
                    {asset.price !== undefined ? `$${asset.price.toFixed(asset.price < 0.0001 ? 8 : 4)}` : 'Price Unavailable'}
                  </TableCell>
                  <TableCell
                    className={`text-right ${changeFromCurrentPrice(asset) >= 0
                      ? 'text-[#16C784]'
                      : 'text-[#EA3943]'
                      }`}
                  >
                    {changeFromCurrentPrice(asset) !== undefined ? (
                      <>
                        {changeFromCurrentPrice(asset).toFixed(2)}%
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
