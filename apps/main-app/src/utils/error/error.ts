export function parseTradingError(error: any): string {
  if (!error?.message) {
    return 'An unexpected error occurred. Please try again.';
  }

  const errorMessage = error.message;

  if (errorMessage.includes('0xbbf') || errorMessage.includes('3007')) {
    if (
      errorMessage.includes('AccountOwnedByWrongProgram') ||
      errorMessage.includes('owner_collateral_account')
    ) {
      return 'USDC token account does not exist. Please visit the faucet to create your USDC account.';
    }
    return 'Insufficient collateral for the requested position size. Please increase your collateral amount.';
  }

  if (errorMessage.includes('insufficient funds') || errorMessage.includes('InsufficientFunds')) {
    return 'Insufficient USDC balance. Please add more USDC to your wallet.';
  }

  if (errorMessage.includes('BasktNotActive') || errorMessage.includes('InvalidBasktState')) {
    return 'This baskt is not active for trading. Please try again later.';
  }

  if (errorMessage.includes('TradingDisabled')) {
    return 'Trading is currently disabled. Please try again later.';
  }

  if (errorMessage.includes('InvalidMint')) {
    return 'Invalid token configuration. Please contact support.';
  }

  if (errorMessage.includes('Unauthorized')) {
    return 'You are not authorized to trade this baskt.';
  }

  if (errorMessage.includes('InsufficientCollateral')) {
    return 'Insufficient collateral for the requested position. Please increase your collateral amount.';
  }

  if (errorMessage.includes('InvalidPositionSize')) {
    return 'Invalid position size. Please check your input and try again.';
  }

  if (errorMessage.includes('PriceOutOfBounds')) {
    return 'Price is outside acceptable bounds. Please try again.';
  }

  if (errorMessage.includes('MathOverflow')) {
    return 'Calculation error. Please try with a smaller amount.';
  }

  if (errorMessage.includes('User rejected')) {
    return 'Transaction was cancelled by user.';
  }

  if (errorMessage.includes('Network request failed')) {
    return 'Network error. Please check your connection and try again.';
  }

  return `Failed to complete transaction: ${errorMessage}`;
}
