import { Input } from '../../components/ui/input';
import { PoolWithdrawProps } from '../../types/pool';

export const PoolWithdraw = ({
  withdrawAmount,
  setWithdrawAmount,
  isWithdrawing,
  isWithdrawValid,
  handleWithdraw,
  lpBalance,
  calculateFee,
  calculateExpectedOutput,
}: PoolWithdrawProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Amount to Withdraw</label>
        <div className="relative">
          <Input
            type="number"
            value={withdrawAmount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWithdrawAmount(e.target.value)}
            placeholder="0.00"
            className="pr-24"
            disabled={isWithdrawing}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            BLP
          </div>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Available: {lpBalance} BLP</span>
          <button
            className="text-primary hover:underline"
            onClick={() => setWithdrawAmount(lpBalance)}
            disabled={isWithdrawing}
          >
            Max
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Fee</span>
          <span>{calculateFee(withdrawAmount, false)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">You will receive</span>
          <span>{calculateExpectedOutput(withdrawAmount, false)}</span>
        </div>
      </div>

      <button
        className={`w-full py-2 px-4 rounded-lg ${
          isWithdrawValid
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        }`}
        onClick={handleWithdraw}
        disabled={!isWithdrawValid || isWithdrawing}
      >
        {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
      </button>
    </div>
  );
};
