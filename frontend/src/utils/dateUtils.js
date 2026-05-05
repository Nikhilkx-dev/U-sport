/**
 * Format a date/datetime string to a human-readable format.
 */
export const formatDate = (dt, options = {}) => {
  if (!dt) return '—';
  const defaults = { dateStyle: 'medium', timeStyle: 'short' };
  return new Date(dt).toLocaleString('en-IN', { ...defaults, ...options });
};

/**
 * Format a date only (no time).
 */
export const formatDateOnly = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { dateStyle: 'medium' });
};

/**
 * Returns how long ago a date was, as a human-readable string.
 */
export const timeAgo = (dt) => {
  if (!dt) return '';
  const seconds = Math.floor((Date.now() - new Date(dt).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

/**
 * Get the local datetime string suitable for datetime-local input min value.
 */
export const nowLocalInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

/**
 * Check if currently in maintenance window (4 PM – 5 PM IST).
 */
export const isMaintenanceTime = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const total = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return total >= 960 && total < 1020;
};

/**
 * Get IST time string for display.
 */
export const getISTTime = () => {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
