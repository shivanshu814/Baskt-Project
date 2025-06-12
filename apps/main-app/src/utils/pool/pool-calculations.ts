import { PoolData } from '../../types/pool';
import { BASIS_POINT } from '../../constants/pool';

export const getFeeInUSDC = (amount: string, bps: number) => {
  const amt = Number(amount);
  if (!amount || isNaN(amt) || !bps) return '0.00 USDC';
  const fee = (amt * bps) / 10000;
  return `${fee.toFixed(2)} USDC`;
};

export const getDepositOutputBLP = (amount: string, poolData: PoolData | null) => {
  if (!poolData || !amount) return '0.00 BLP';
  const amt = Number(amount);
  const totalLiquidity = Number(poolData.totalLiquidity) / BASIS_POINT;
  if (isNaN(amt) || totalLiquidity <= 0) return '0.00 BLP';
  // Simplified: 1:1 for demo, real logic should use pool share math
  return `${amt.toFixed(2)} BLP`;
};

export const getWithdrawOutputUSDC = (amount: string, poolData: PoolData | null) => {
  if (!poolData || !amount) return '0.00 USDC';
  const amt = Number(amount);
  const totalShares = Number(poolData.totalShares) / BASIS_POINT;
  const totalLiquidity = Number(poolData.totalLiquidity) / BASIS_POINT;
  if (isNaN(amt) || totalShares <= 0) return '0.00 USDC';
  const usdcOut = (amt / totalShares) * totalLiquidity;
  return `${usdcOut.toFixed(2)} USDC`;
};

export const calculateFee = (amount: string, isDeposit: boolean, poolData: PoolData | null) => {
  if (!poolData) return '0.00 USDC';
  return isDeposit
    ? getFeeInUSDC(amount, poolData.depositFeeBps)
    : getFeeInUSDC(
        getWithdrawOutputUSDC(amount, poolData).split(' ')[0],
        poolData.withdrawalFeeBps,
      );
};

export const calculateExpectedOutput = (
  amount: string,
  isDeposit: boolean,
  poolData: PoolData | null,
) => {
  if (!poolData) return isDeposit ? '0.00 BLP' : '0.00 USDC';
  return isDeposit
    ? getDepositOutputBLP(amount, poolData)
    : getWithdrawOutputUSDC(amount, poolData);
};
