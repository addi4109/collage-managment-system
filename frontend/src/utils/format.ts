/**
 * Utility functions for formatting values in EduTech Hub
 */

// Format ISO date string to a human-readable date
export const formatDate = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format ISO date string to time (e.g. 09:30 AM)
export const formatTime = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format currency amount (e.g. $1,250.00)
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};
