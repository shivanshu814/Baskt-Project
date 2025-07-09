import { Clock, Plus, Search, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  NumberFormat,
} from '@baskt/ui';
import { BasktFormProps } from '../../../types/baskt';

export const BasktForm = ({
  formData,
  errors,
  onNameChange,
  onRebalancePeriodChange,
  onVisibilityChange,
  onAddAsset,
  onRemoveAsset,
  onAssetPositionChange,
  onAssetWeightChange,
  title,
}: BasktFormProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-lg sm:text-xl">{title || 'Create Baskt'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[450px_auto_auto] items-start lg:items-center gap-4 lg:gap-[6rem]">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center justify-between">
              <span className="text-sm sm:text-base">Baskt Name</span>
              <span className="text-xs text-muted-foreground">{formData.name.length}/10</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. DeFi Index"
              value={formData.name}
              onChange={(e) => onNameChange(e.target.value)}
              maxLength={10}
              className="text-sm sm:text-base"
            />
            {errors['name'] && <p className="text-xs text-destructive">{errors['name']}</p>}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-sm sm:text-base" htmlFor="rebalancing">
              Rebalancing Period
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="rebalance-value"
                type="number"
                min={1}
                max={formData.rebalancePeriod.unit === 'day' ? 30 : 24}
                value={formData.rebalancePeriod.value === 0 ? '' : formData.rebalancePeriod.value}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    onRebalancePeriodChange(0, formData.rebalancePeriod.unit);
                    return;
                  }
                  let value = parseInt(raw, 10);
                  if (isNaN(value)) value = 0;
                  onRebalancePeriodChange(value, formData.rebalancePeriod.unit);
                }}
                onBlur={(e) => {
                  let value = parseInt(e.target.value, 10);
                  if (isNaN(value) || value < 1) value = 1;
                  if (formData.rebalancePeriod.unit === 'day' && value > 30) value = 30;
                  if (formData.rebalancePeriod.unit === 'hour' && value > 24) value = 24;
                  onRebalancePeriodChange(value, formData.rebalancePeriod.unit);
                }}
                className="w-16 text-sm sm:text-base"
              />
              <Select
                value={formData.rebalancePeriod.unit}
                onValueChange={(value: 'day' | 'hour') => {
                  let clampedValue = formData.rebalancePeriod.value;
                  if (value === 'day' && clampedValue > 30) clampedValue = 30;
                  if (value === 'hour' && clampedValue > 24) clampedValue = 24;
                  if (clampedValue < 1) clampedValue = 1;
                  onRebalancePeriodChange(clampedValue, value);
                }}
              >
                <SelectTrigger className="w-20 text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Days</SelectItem>
                  <SelectItem value="hour">Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="public" className="text-sm sm:text-base">
              Visibility
            </Label>
            <div className="flex items-center">
              <div className="flex items-center bg-muted rounded-full p-0.5">
                <div
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                    formData.isPublic
                      ? 'bg-background text-foreground font-medium'
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => onVisibilityChange(true)}
                >
                  Public
                </div>
                <div
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                    !formData.isPublic
                      ? 'bg-background text-foreground font-medium'
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => onVisibilityChange(false)}
                >
                  Private
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start sm:items-center gap-3">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Add assets to your Baskt and set their allocation weights.
            </p>

            <Button onClick={onAddAsset} className="w-full sm:w-auto text-sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>

          {formData.assets.length === 0 ? (
            <div className="grid place-items-center py-6 sm:py-8 border border-dashed rounded-sm">
              <Search className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
                No assets added yet. Click "Add Asset" to start building your Baskt.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Asset</TableHead>
                      <TableHead className="text-xs sm:text-sm">Price</TableHead>
                      <TableHead className="text-xs sm:text-sm whitespace-nowrap">
                        Weight (%)
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm">Position</TableHead>
                      <TableHead className="w-[60px] sm:w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.assets.map((asset) => (
                      <TableRow key={asset.ticker}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/10 h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center overflow-hidden">
                              {asset.logo ? (
                                <img
                                  src={asset.logo}
                                  alt={asset.ticker}
                                  className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
                                />
                              ) : (
                                <span className="font-medium text-primary text-xs">
                                  {asset.ticker.substring(0, 2)}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-xs sm:text-sm">{asset.ticker}</div>
                              <div className="text-xs text-muted-foreground hidden sm:block">
                                {asset.name}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <NumberFormat value={asset.price} isPrice={true} />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={asset.weight > 0 ? asset.weight.toString() : ''}
                            onChange={(e) => onAssetWeightChange(asset.ticker, e.target.value)}
                            className="w-16 sm:w-20 text-xs sm:text-sm"
                          />
                          {asset.weight < 5 && <p className="text-xs text-warning">Min 5%</p>}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={asset.direction ? 'long' : 'short'}
                            onValueChange={(value: 'long' | 'short') =>
                              onAssetPositionChange(asset.ticker, value)
                            }
                          >
                            <SelectTrigger className="w-[80px] sm:w-[100px] text-xs sm:text-sm">
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
                            className="text-red-500 hover:text-red-500 h-8 w-8 sm:h-9 sm:w-9"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
