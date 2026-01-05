export interface UnhandledError {
  message: string;
  stack?: string;
  timestamp: number;
  userAgent?: string;
  url?: string;
  userId?: string;
}

export function createUnhandledError(
  error: Error | string | any,
  context?: Record<string, any>
): UnhandledError {
  let errorMessage: string;
  let errorStack: string | undefined;

  if (error instanceof Error) {
    errorMessage = error.message || 'Unknown error';
    errorStack = error.stack;
  } else if (typeof error === 'string') {
    errorMessage = error || 'Unknown error';
  } else if (error && typeof error === 'object') {
    errorMessage = JSON.stringify(error) || 'Unknown error';
  } else {
    errorMessage = String(error) || 'Unknown error';
  }

  return {
    message: errorMessage,
    stack: errorStack,
    timestamp: Date.now(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userId: context?.userId,
    ...context,
  };
}