'use client';

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@baskt/ui';
import { BookOpenCheck, Lock } from 'lucide-react';
import { useStep1BasicInfo } from '../../../hooks/create-baskt/steps/use-step-1-basic-info';
import { checkProfanity } from '../../../lib/validation/profanity';
import { Step1BasicInfoProps } from '../../../types/baskt/creation';

export function Step1BasicInfo({ formData, setFormData }: Step1BasicInfoProps) {
  const {
    handleNameChange,
    handleVisibilityChange,
    handleRebalancingTypeChange,
    handleRebalancingPeriodChange,
    handleRebalancingUnitChange,
  } = useStep1BasicInfo(formData, setFormData);

  return (
    <>
      {/* baskt name */}
      <div className="space-y-2">
        <Label htmlFor="baskt-name">What's your baskt name?</Label>
        <div className="text-sm text-muted-foreground mb-2">(max 10 characters)</div>
        <Input
          id="baskt-name"
          placeholder="e.g DeFi index"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          maxLength={10}
          className="bg-background/50"
        />
        {formData.name && checkProfanity(formData.name) && (
          <div className="text-sm text-red-500 mt-1">
            ⚠️ Inappropriate language detected. Please choose a different name.
          </div>
        )}
        <div className="text-sm text-muted-foreground">{formData.name.length}/10 characters</div>
      </div>

      {/* visibility */}
      <div className="space-y-3">
        <Label>Visibility</Label>
        <div className="text-sm text-muted-foreground -mt-2 mb-3">
          Controls whether your baskt is visible and available for others to view and buy.
        </div>
        <div className="flex gap-3 w-1/2">
          <Button
            variant={formData.visibility === 'public' ? 'default' : 'outline'}
            onClick={() => handleVisibilityChange('public')}
            className={`flex-1 justify-start ${
              formData.visibility === 'public'
                ? 'bg-purple-600 hover:bg-purple-700 text-white border border-white/20'
                : 'border-white/20'
            }`}
          >
            <BookOpenCheck className="h-4 w-4 mr-2" />
            Public
          </Button>
          <Button
            variant={formData.visibility === 'private' ? 'default' : 'outline'}
            onClick={() => handleVisibilityChange('private')}
            className={`flex-1 justify-start ${
              formData.visibility === 'private'
                ? 'bg-purple-600 hover:bg-purple-700 text-white border border-white/20'
                : 'border-white/20'
            }`}
          >
            <Lock className="h-4 w-4 mr-2" />
            Private
          </Button>
        </div>
      </div>

      {/* rebalancing type */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium text-white">Rebalancing Type</Label>
          <div className="text-sm text-muted-foreground mt-1">
            Choose how your baskt will be rebalanced.
          </div>
        </div>
        <div className="flex gap-3 w-1/2">
          <Button
            variant="outline"
            onClick={() => handleRebalancingTypeChange('automatic')}
            className={`flex-1 justify-start ${
              formData.rebalancingType === 'automatic'
                ? 'bg-purple-600 hover:bg-purple-700 text-white border border-white/20'
                : 'border-white/20'
            }`}
          >
            <div
              className={`h-3 w-3 mr-3 rounded-full ${
                formData.rebalancingType === 'automatic' ? 'bg-purple-300' : 'bg-gray-600'
              }`}
            />
            Automatic
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRebalancingTypeChange('manual')}
            className={`flex-1 justify-start ${
              formData.rebalancingType === 'manual'
                ? 'bg-purple-600 hover:bg-purple-700 text-white border border-white/20'
                : 'border-white/20'
            }`}
          >
            <div
              className={`h-3 w-3 mr-3 rounded-full ${
                formData.rebalancingType === 'manual' ? 'bg-purple-300' : 'bg-gray-600'
              }`}
            />
            Manual
          </Button>
        </div>
      </div>

      {/* rebalancing period - only show for automatic */}
      {formData.rebalancingType === 'automatic' && (
        <div className="space-y-3">
          <Label>Rebalancing Period</Label>
          <div className="flex gap-3 w-1/2">
            <Input
              type="number"
              min="1"
              max="365"
              value={formData.rebalancingPeriod === 0 ? '' : formData.rebalancingPeriod}
              onChange={(e) => handleRebalancingPeriodChange(e.target.value)}
              className="flex-1 border-white/20 text-white"
              placeholder="10"
            />

            <Select value={formData.rebalancingUnit} onValueChange={handleRebalancingUnitChange}>
              <SelectTrigger className="flex-1 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Weeks</SelectItem>
                <SelectItem value="months">Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.rebalancingType === 'automatic' && formData.rebalancingPeriod === 0 && (
            <div className="text-sm text-red-500 mt-2">
              ⚠️ Please enter a rebalancing period for automatic mode
            </div>
          )}
        </div>
      )}
    </>
  );
}
