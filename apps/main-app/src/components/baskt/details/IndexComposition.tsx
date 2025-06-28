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

  // For short positions, invert the change percentage
  // If direction is false, it's a short position
  return asset.direction ? changePercentage : -changePercentage;
}

export function IndexComposition({ assets }: IndexCompositionProps) {
  return (
    <Card className="rounded-none border-0 shadow-none">
      <CardHeader className="p-0 mb-2">
        <CardTitle className="text-base sm:text-lg font-medium">Index Composition</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">Asset</TableHead>
                <TableHead className="text-xs sm:text-sm">Direction</TableHead>
                <TableHead className="text-xs sm:text-sm">Weight</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap">
                  Baseline Price
                </TableHead>
                <TableHead className="text-xs sm:text-sm">Price</TableHead>
                <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">
                  Change (%)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.assetAddress}>
                  <TableCell className="font-medium text-xs sm:text-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {asset.logo && (
                        <img
                          src={asset.logo}
                          alt={asset.ticker}
                          className="h-6 w-6 sm:h-8 sm:w-8 rounded-full"
                        />
                      )}
                      <div className="flex flex-col">
                        <span>{asset.ticker}</span>
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {asset.name}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize text-xs sm:text-sm">
                    {asset.direction ? 'long' : 'short'}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    <NumberFormat value={asset.weight} />%
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    {asset.baselinePrice !== undefined ? (
                      <NumberFormat value={asset.baselinePrice} isPrice={true} />
                    ) : (
                      'Price Unavailable'
                    )}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    {asset.price !== undefined ? (
                      <NumberFormat value={asset.price} isPrice={true} />
                    ) : (
                      'Price Unavailable'
                    )}
                  </TableCell>
                  <TableCell
                    className={`text-right text-xs sm:text-sm ${
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
