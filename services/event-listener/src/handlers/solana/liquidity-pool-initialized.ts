import { EventSource } from "src/types";
import { querierClient } from "src/utils/config";

async function liquidityPoolInitializedHandler() {
  try {
    await querierClient.pool.resyncLiquidityPool();
  } catch (error) {
    console.error("Error fetching liquidity pool", error);
  }
}

export default {
  type: 'liquidityPoolInitializedEvent',
  handler: liquidityPoolInitializedHandler,
  source: EventSource.SOLANA,
};