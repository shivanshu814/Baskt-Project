import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { BasicInfoFormProps } from '../../../types/baskt';

export const BasicInfoForm = ({
  formData,
  errors,
  onNameChange,
  onRebalancePeriodChange,
  onVisibilityChange,
}: BasicInfoFormProps) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="name" className="flex items-center justify-between">
            <span>Baskt Name</span>
            <span className="text-xs text-muted-foreground">{formData.name.length}/10 characters</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g. DeFi Index"
            value={formData.name}
            onChange={(e) => onNameChange(e.target.value)}
            maxLength={10}
          />
          {errors['name'] && <p className="text-xs text-destructive">{errors['name']}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1" htmlFor="rebalancing">
              Rebalancing Period
              <Clock className="h-4 w-4 text-muted-foreground" />
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="rebalance-value"
                type="number"
                min={1}
                max={formData.rebalancePeriod.unit === 'day' ? 30 : 24}
                value={formData.rebalancePeriod.value}
                onChange={(e) => {
                  const value = Math.min(
                    parseInt(e.target.value) || 1,
                    formData.rebalancePeriod.unit === 'day' ? 30 : 24,
                  );
                  onRebalancePeriodChange(value, formData.rebalancePeriod.unit);
                }}
                className="w-16"
              />
              <Select
                value={formData.rebalancePeriod.unit}
                onValueChange={(value: 'day' | 'hour') => {
                  onRebalancePeriodChange(formData.rebalancePeriod.value, value);
                }}
              >
                <SelectTrigger className="w-20">
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
            <Label htmlFor="public">Visibility</Label>
            <div className="flex items-center">
              <div className="flex items-center bg-muted rounded-full p-0.5">
                <div
                  className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${formData.isPublic
                    ? 'bg-background text-foreground font-medium'
                    : 'text-muted-foreground'
                    }`}
                  onClick={() => onVisibilityChange(true)}
                >
                  Public
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${!formData.isPublic
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
      </CardContent>
    </Card>
  );
};
