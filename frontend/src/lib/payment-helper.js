/**
 * Stub - copy from VentoDesktop/renderer/lib/payment-helper.ts for full implementation
 */

export function isUserFreePlan(user) {
  if (!user) return true;
  return !user.subscriptionStatus || user.subscriptionStatus === 'free' || !user.subscriptionStatus;
}
