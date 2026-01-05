import { useCallback } from 'react';
import { createUnhandledError, UnhandledError } from './console-error';

/**
 * Non-hook version of error handler that can be used in class components
 * and module-level code
 */
export function handleClientError(error: Error | string, context?: Record<string, any>) {
  const unhandledError = createUnhandledError(error, context);

  // Log to console for development
  console.error('Unhandled client error:', unhandledError);

  // Here you could send to error reporting service like Sentry
  // sendToErrorReporting(unhandledError);

  // Or store in local storage for debugging
  if (typeof window !== 'undefined') {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('unhandledErrors') || '[]');
      existingErrors.push(unhandledError);
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.shift();
      }
      localStorage.setItem('unhandledErrors', JSON.stringify(existingErrors));
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

/**
 * Hook version of error handler for use in function components
 */
export function useErrorHandler() {
  const handleClientErrorHook = useCallback((error: Error | string, context?: Record<string, any>) => {
    handleClientError(error, context);
  }, []);

  return { handleClientError: handleClientErrorHook };
}