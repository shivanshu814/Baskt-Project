import { BasktAssetInfo } from '@baskt/types';
import { IndexCompositionProps } from '../../../types/baskt';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  NumberFormat,
} from '@baskt/ui';

export function changeFromCurrentPrice(asset: BasktAssetInfo) {
  const change = asset.price - (asset.baselinePrice || asset.price);
  const changePercentage = (change / (asset.baselinePrice || asset.price)) * 100;
  return changePercentage;
}

export function IndexComposition({ assets }: IndexCompositionProps) {
  return (
    <Card className="rounded-none">
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
                    <div className="flex items-center gap-3">
                      {asset.logo && (
                        <img src={asset.logo} alt={asset.ticker} className="h-8 w-8 rounded-none" />
                      )}
                      <div className="flex flex-col">
                        <span>{asset.ticker}</span>
                        <span className="text-xs text-muted-foreground">{asset.name}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{asset.direction ? 'long' : 'short'}</TableCell>
                  <TableCell>
                    <NumberFormat value={asset.weight} />%
                  </TableCell>
                  <TableCell>
                    {asset.baselinePrice !== undefined ? (
                      <NumberFormat value={asset.baselinePrice} isPrice={true} />
                    ) : (
                      'Price Unavailable'
                    )}
                  </TableCell>
                  <TableCell>
                    {asset.price !== undefined ? (
                      <NumberFormat value={asset.price} isPrice={true} />
                    ) : (
                      'Price Unavailable'
                    )}
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      changeFromCurrentPrice(asset) >= 0 ? 'text-[#16C784]' : 'text-[#EA3943]'
                    }`}
                  >
                    <NumberFormat value={changeFromCurrentPrice(asset)} />%
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
