import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';
import type { PoolInitializationFormProps } from '../../types/pool';
import { BPS_TO_PERCENT, USDC_DECIMALS } from '../../constants/pool';

export const PoolInitializationForm: React.FC<PoolInitializationFormProps> = ({
  formData,
  formErrors,
  isLoading,
  onInputChange,
  onSubmit,
}) => {
  return (
    <Card className="bg-white/5 border-white/10 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Initialize Liquidity Pool</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Alert className="bg-yellow-500/10 border-yellow-500/20">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-500">Attention Required</AlertTitle>
            <AlertDescription className="text-yellow-500/80">
              The liquidity pool needs to be initialized before users can start trading.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="depositFee" className="text-white/80">
                Deposit Fee (Basis Points)
              </Label>
              <Input
                id="depositFee"
                type="number"
                value={formData.depositFeeBps}
                onChange={onInputChange('depositFeeBps')}
                placeholder="e.g., 10 for 0.1%"
                className={`bg-[#181c27] border-[#23263a] focus:border-primary rounded-xl ${formErrors.depositFeeBps ? 'border-red-500' : ''
                  }`}
              />
              <div className="flex justify-between text-sm">
                <span className="text-white/60">
                  Current value: {(Number(formData.depositFeeBps) / BPS_TO_PERCENT).toFixed(2)}%
                </span>
                {formErrors.depositFeeBps && (
                  <span className="text-red-500">{formErrors.depositFeeBps}</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawalFee" className="text-white/80">
                Withdrawal Fee (Basis Points)
              </Label>
              <Input
                id="withdrawalFee"
                type="number"
                value={formData.withdrawalFeeBps}
                onChange={onInputChange('withdrawalFeeBps')}
                placeholder="e.g., 30 for 0.3%"
                className={`bg-[#181c27] border-[#23263a] focus:border-primary rounded-xl ${formErrors.withdrawalFeeBps ? 'border-red-500' : ''
                  }`}
              />
              <div className="flex justify-between text-sm">
                <span className="text-white/60">
                  Current value: {(Number(formData.withdrawalFeeBps) / BPS_TO_PERCENT).toFixed(2)}%
                </span>
                {formErrors.withdrawalFeeBps && (
                  <span className="text-red-500">{formErrors.withdrawalFeeBps}</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minDeposit" className="text-white/80">
                Minimum Deposit Amount
              </Label>
              <Input
                id="minDeposit"
                type="number"
                value={formData.minDeposit}
                onChange={onInputChange('minDeposit')}
                placeholder="e.g., 1000000 for 1 USDC"
                className={`bg-[#181c27] border-[#23263a] focus:border-primary rounded-xl ${formErrors.minDeposit ? 'border-red-500' : ''
                  }`}
              />
              <div className="flex justify-between text-sm">
                <span className="text-white/60">
                  Current value: {Number(formData.minDeposit) / USDC_DECIMALS} USDC
                </span>
                {formErrors.minDeposit && (
                  <span className="text-red-500">{formErrors.minDeposit}</span>
                )}
              </div>
            </div>

            <Button
              onClick={onSubmit}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl shadow-md transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 justify-center animate-pulse">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Initializing...
                </div>
              ) : (
                'Initialize Liquidity Pool'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
