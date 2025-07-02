import { SendTransactionError } from '@solana/web3.js';

export interface ParsedError {
  isUserFriendly: boolean;
  message: string;
  originalError?: any; // eslint-disable-line
}

/**
 * Parse Solana transaction errors and extract user-friendly messages
 */
// eslint-disable-next-line
export function parseSolanaError(error: any): ParsedError {
  // If it's already a user-friendly error, return it as is
  if (error?.message && typeof error.message === 'string') {
    // Check if it's already a user-friendly message
    if (error.message.includes('A baskt with this name already exists')) {
      return {
        isUserFriendly: true,
        message: error.message,
        originalError: error,
      };
    }
  }

  // Handle SendTransactionError
  if (
    error instanceof SendTransactionError ||
    error?.constructor?.name === 'SendTransactionError'
  ) {
    const logs = error.logs || [];
    const message = error.message || '';

    // Check for specific error patterns in logs
    for (const log of logs) {
      // Check for "already in use" error which indicates duplicate baskt name
      if (log.includes('already in use') && log.includes('Allocate')) {
        return {
          isUserFriendly: true,
          message: 'A baskt with this name already exists. Please choose a different name.',
          originalError: error,
        };
      }

      // Check for other common error patterns
      if (log.includes('custom program error: 0x0')) {
        return {
          isUserFriendly: true,
          message: 'A baskt with this name already exists. Please choose a different name.',
          originalError: error,
        };
      }

      // Check for InvalidMint error (0x179e = 6046)
      if (log.includes('custom program error: 0x179e') || log.includes('InvalidMint')) {
        return {
          isUserFriendly: true,
          message:
            'Configuration error: Token mint mismatch. Please contact support or try again later.',
          originalError: error,
        };
      }

      // Check for InvalidBasktConfig error
      if (log.includes('InvalidBasktConfig') || log.includes('invalidBasktConfig')) {
        return {
          isUserFriendly: true,
          message: 'Invalid Baskt configuration. Please check your asset weights and settings.',
          originalError: error,
        };
      }

      // Check for BasktOperationsDisabled error
      if (log.includes('BasktOperationsDisabled') || log.includes('basktOperationsDisabled')) {
        return {
          isUserFriendly: true,
          message: 'Baskt creation is currently disabled. Please try again later.',
          originalError: error,
        };
      }

      // Check for ShortPositionsDisabled error
      if (log.includes('ShortPositionsDisabled') || log.includes('shortPositionsDisabled')) {
        return {
          isUserFriendly: true,
          message:
            'Short positions are not allowed for this asset. Please change the direction to long.',
          originalError: error,
        };
      }
    }

    // If no specific pattern found, return a generic but more helpful message
    return {
      isUserFriendly: false,
      message: `Transaction failed: ${message}`,
      originalError: error,
    };
  }

  // Handle other types of errors
  if (error instanceof Error) {
    return {
      isUserFriendly: false,
      message: error.message,
      originalError: error,
    };
  }

  // Fallback for unknown error types
  return {
    isUserFriendly: false,
    message: 'An unexpected error occurred. Please try again.',
    originalError: error,
  };
}

/**
 * Get a user-friendly error message for Baskt creation failures
 */
// eslint-disable-next-line
export function getBasktCreationErrorMessage(error: any): string {
  const parsedError = parseSolanaError(error);

  if (parsedError.isUserFriendly) {
    return parsedError.message;
  }

  // For non-user-friendly errors, provide a generic message
  return 'Something went wrong while creating your Baskt. Please try again.';
}
