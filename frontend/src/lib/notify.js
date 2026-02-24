/** Simple notification - can be replaced with Mantine Notifications later */
export function showNotification({ title, message, color = 'blue', autoClose = 5000 }) {
  console.warn(`[${color}] ${title}: ${message}`);
  if (typeof window !== 'undefined' && window.alert) {
    // Fallback for critical errors - avoid alert for every notification
    if (color === 'red' && !autoClose) {
      window.alert(`${title}\n\n${message}`);
    }
  }
}
