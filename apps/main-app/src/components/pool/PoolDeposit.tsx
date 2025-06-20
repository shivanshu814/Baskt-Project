import { Input } from '@baskt/ui';
import { PoolDepositProps } from '../../types/pool';

export const PoolDeposit = ({
  depositAmount,
  setDepositAmount,
  isDepositing,
  isDepositValid,
  handleDeposit,
  usdcBalance,
  calculateFee,
  calculateExpectedOutput,
}: PoolDepositProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Amount to Deposit</label>
        <div className="relative">
          <Input
            type="number"
            value={depositAmount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositAmount(e.target.value)}
            placeholder="0.00"
            className="pr-24"
            disabled={isDepositing}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            USDC
          </div>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Available: {usdcBalance} USDC</span>
          <button
            className="text-primary hover:underline"
            onClick={() => setDepositAmount(usdcBalance)}
            disabled={isDepositing}
          >
            Max
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Fee</span>
          <span>{calculateFee(depositAmount, true)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">You will receive</span>
          <span>{calculateExpectedOutput(depositAmount, true)}</span>
        </div>
      </div>

      <button
        className={`w-full py-2 px-4 rounded-lg ${
          isDepositValid
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        }`}
        onClick={handleDeposit}
        disabled={!isDepositValid || isDepositing}
      >
        {isDepositing ? 'Depositing...' : 'Deposit'}
      </button>
    </div>
  );
};
