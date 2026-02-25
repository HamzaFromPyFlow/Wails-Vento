/**
 * Debug utility for conditional logging
 *
 * Set VITE_DEBUG_PERF=true in .env to enable performance logging
 * Defaults to false (no console output in production)
 */

const DEBUG_PERF = import.meta.env.VITE_DEBUG_PERF === 'true';

export const debugLog = {
  /**
   * Performance logging - only outputs when VITE_DEBUG_PERF=true
   */
  perf: (...args: any[]) => {
    if (DEBUG_PERF) {
      console.log(...args);
    }
  },

  /**
   * Check if performance debugging is enabled
   */
  isPerfEnabled: () => DEBUG_PERF,
};
