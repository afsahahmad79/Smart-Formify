import { handleClientError } from './use-error-handler';

// Store original console.error
const originalConsoleError = console.error;

// Flag to prevent infinite loops
let isIntercepting = false;

export function interceptConsoleError() {
  if (typeof window === 'undefined') return; // Only run on client

  console.error = (...args: any[]) => {
    if (isIntercepting) {
      // Prevent infinite recursion
      originalConsoleError(...args);
      return;
    }

    isIntercepting = true;

    try {
      // Call original console.error
      originalConsoleError(...args);

      // Extract error information
      const errorMessage = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      // Only treat certain errors as unhandled
      // You can customize this logic
      if (errorMessage.includes('CRITICAL') ||
          (errorMessage.includes('Error:') && !errorMessage.includes('Unhandled client error')) ||
          args.some(arg => arg instanceof Error)) {
        handleClientError(errorMessage);
      }
    } finally {
      isIntercepting = false;
    }
  };
}

// Initialize interception
if (typeof window !== 'undefined') {
  interceptConsoleError();
}