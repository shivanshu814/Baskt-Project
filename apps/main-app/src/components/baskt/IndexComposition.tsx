import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BasktAsset } from '../../types/baskt';

interface IndexCompositionProps {
  assets: BasktAsset[];
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
                <TableHead>Weight</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">24h Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{asset.symbol}</span>
                      <span className="text-xs text-muted-foreground">{asset.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{asset.weightage}%</TableCell>
                  <TableCell>${asset.price.toLocaleString()}</TableCell>
                  <TableCell
                    className={`text-right ${asset.change24h >= 0 ? 'text-[#16C784]' : 'text-[#EA3943]'}`}
                  >
                    {asset.change24h >= 0 ? '+' : ''}
                    {asset.change24h.toFixed(2)}%
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
