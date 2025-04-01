import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/src/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/src/card';

export function IndexComposition() {
  // Mock data for assets in the index - in a real app, this would come from the baskt data
  const assets = [
    { symbol: 'BTC', name: 'Bitcoin', weight: '35%', price: '$50,432.21', change24h: '+2.34%' },
    { symbol: 'ETH', name: 'Ethereum', weight: '25%', price: '$3,240.65', change24h: '+1.87%' },
    { symbol: 'SOL', name: 'Solana', weight: '15%', price: '$102.34', change24h: '-0.54%' },
    { symbol: 'AVAX', name: 'Avalanche', weight: '10%', price: '$35.78', change24h: '+3.21%' },
    { symbol: 'LINK', name: 'Chainlink', weight: '8%', price: '$16.32', change24h: '+0.89%' },
    { symbol: 'AAVE', name: 'Aave', weight: '7%', price: '$95.67', change24h: '-1.23%' },
  ];

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
                <TableRow key={asset.symbol}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{asset.symbol}</span>
                      <span className="text-xs text-muted-foreground">{asset.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{asset.weight}</TableCell>
                  <TableCell>{asset.price}</TableCell>
                  <TableCell
                    className={`text-right ${asset.change24h.startsWith('+') ? 'text-success' : 'text-destructive'}`}
                  >
                    {asset.change24h}
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
