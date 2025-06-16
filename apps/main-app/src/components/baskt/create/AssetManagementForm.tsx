import { Plus, Search, Trash2 } from 'lucide-react';
import { cn, NumberFormat } from '@baskt/ui';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { AssetManagementFormProps } from '../../../types/baskt';

export const AssetManagementForm = ({
  formData,
  totalWeightage,
  onAddAsset,
  onRemoveAsset,
  onAssetPositionChange,
  onAssetWeightChange,
}: AssetManagementFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Assets</span>
          <div className="flex items-center text-sm font-normal gap-2">
            <span className={cn(totalWeightage === 100 ? 'text-success' : 'text-destructive')}>
              Total: {totalWeightage}%
            </span>
            {totalWeightage !== 100 && <span className="text-destructive">(Must equal 100%)</span>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-[1fr_auto] items-center">
          <p className="text-muted-foreground">
            Add assets to your Baskt and set their allocation weights.
          </p>

          <Button onClick={onAddAsset}>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>

        {formData.assets.length === 0 ? (
          <div className="grid place-items-center py-8 border border-dashed rounded-lg">
            <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              No assets added yet. Click "Add Asset" to start building your Baskt.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Weight (%)</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.assets.map((asset) => (
                  <TableRow key={asset.ticker}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 h-8 w-8 rounded-full flex items-center justify-center overflow-hidden">
                          {asset.logo ? (
                            <img
                              src={asset.logo}
                              alt={asset.ticker}
                              className="w-6 h-6 object-contain"
                            />
                          ) : (
                            <span className="font-medium text-primary text-xs">
                              {asset.ticker.substring(0, 2)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{asset.ticker}</div>
                          <div className="text-xs text-muted-foreground">{asset.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><NumberFormat value={asset.price} isPrice={true} /></TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={asset.weight > 0 ? asset.weight.toString() : ''}
                        onChange={(e) => onAssetWeightChange(asset.ticker, e.target.value)}
                        className="w-20"
                      />
                      {asset.weight < 5 && <p className="text-xs text-destructive">Min 5%</p>}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={asset.direction ? 'long' : 'short'}
                        onValueChange={(value: 'long' | 'short') =>
                          onAssetPositionChange(asset.ticker, value)
                        }
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="long">Long</SelectItem>
                          <SelectItem value="short">Short</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveAsset(asset.ticker)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
