import { ErrorInfo } from '../../types/components/ui/ui';

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorInfo[] = [];
  private isReporting = false;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalErrorHandlers() {
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), 'Unhandled Promise Rejection');
    });

    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), 'Global Error');
    });
  }

  handleError(error: Error, context?: string): void {
    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      errorId: this.generateErrorId(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context || 'Error'}]:`, error);
      console.error('Error Info:', errorInfo);
    }

    this.errorQueue.push(errorInfo);

    this.reportErrors();
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async reportErrors(): Promise<void> {
    if (this.isReporting || this.errorQueue.length === 0) {
      return;
    }

    this.isReporting = true;

    try {
      const errorsToReport = [...this.errorQueue];
      this.errorQueue = [];

      if (errorsToReport.length > 0) {
        console.group('Error Report');
        errorsToReport.forEach((error, index) => {
          console.log(`Error ${index + 1}:`, error);
        });
        console.groupEnd();
      }
    } catch (reportingError) {
      console.error('Failed to report errors:', reportingError);
      this.errorQueue.unshift(...this.errorQueue);
    } finally {
      this.isReporting = false;
    }
  }

  async reportToService(errors: ErrorInfo[]): Promise<void> {
    // TODO: Implement error reporting service
  }

  getErrorQueue(): ErrorInfo[] {
    return [...this.errorQueue];
  }

  clearErrorQueue(): void {
    this.errorQueue = [];
  }
}

export const errorHandler = ErrorHandler.getInstance();

export const handleError = (error: Error, context?: string): void => {
  errorHandler.handleError(error, context);
};

export const handleAsyncError = async <T>(
  promise: Promise<T>,
  context?: string,
): Promise<T | null> => {
  try {
    return await promise;
  } catch (error) {
    handleError(error as Error, context);
    return null;
  }
};

/**
 * Parse trading errors and provide user-friendly messages
 */
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

  // Return the original error message if no specific pattern is found
  return `Failed to complete transaction: ${errorMessage}`;
}
