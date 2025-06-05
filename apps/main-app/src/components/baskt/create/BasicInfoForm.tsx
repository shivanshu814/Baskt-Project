import { Clock, Image } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { BasicInfoFormProps } from '../../../types/baskt';

export const BasicInfoForm = ({
  formData,
  errors,
  fileInputRef,
  previewImage,
  onImageClick,
  onImageUpload,
  onNameChange,
  onRebalancePeriodChange,
  onVisibilityChange,
}: BasicInfoFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
          <div>
            <Label htmlFor="image" className="sr-only">
              Baskt Image
            </Label>
            <div
              className="w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
              onClick={onImageClick}
            >
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Baskt preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image className="h-8 w-8 text-muted-foreground" />
              )}
              <input
                ref={fileInputRef}
                type="file"
                id="image"
                accept="image/*"
                className="hidden"
                onChange={onImageUpload}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="name" className="mb-2 block">
              Baskt Name <span className="text-xs text-muted-foreground">(max 10 characters)</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. DeFi Index"
              value={formData.name}
              onChange={(e) => onNameChange(e.target.value)}
              maxLength={10}
            />
            {errors['name'] && <p className="text-xs text-destructive mt-1">{errors['name']}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              {formData.name.length}/10 characters
            </p>
          </div>
        </div>

        <div className="flex flex-row items-end gap-6">
          <div className="grid grid-cols-1 gap-2">
            <Label className="flex items-center" htmlFor="rebalancing">
              Rebalancing Period
              <Clock className="ml-1 h-4 w-4 text-muted-foreground" />
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

          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="public" className="mb-2">
              Visibility
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-muted rounded-full p-0.5">
                <div
                  className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                    formData.isPublic
                      ? 'bg-background text-foreground font-medium'
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => onVisibilityChange(true)}
                >
                  Public
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${
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
      </CardContent>
    </Card>
  );
};
