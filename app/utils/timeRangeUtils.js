/**
 * Get the date cutoff for a given time range
 * @param {string} range - "3m", "6m", "1y", or "All"
 * @returns {Date|null} - Date cutoff or null for "All"
 */
export const getDateCutoff = (range) => {
  if (range === 'All') return null;

  const now = new Date();
  switch (range) {
    case '3m':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case '6m':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case '1y':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default:
      return null;
  }
};

/**
 * Filter data array by time range
 * @param {Array<{date: string, value: number}>} data - Array of data points with date strings (YYYY-MM-DD)
 * @param {string} range - "3m", "6m", "1y", or "All"
 * @returns {Array<{date: string, value: number}>} - Filtered data
 */
export const filterDataByRange = (data, range) => {
  if (!data || data.length === 0) return [];
  if (range === 'All') return data;

  const cutoff = getDateCutoff(range);
  if (!cutoff) return data;

  return data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= cutoff;
  });
};

/**
 * Calculate the change between first and last value in data
 * @param {Array<{date: string, value: number}>} data - Array of data points
 * @returns {number|null} - Change value or null if not enough data
 */
export const calculateChange = (data) => {
  if (!data || data.length < 2) return null;

  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;

  return Math.round((lastValue - firstValue) * 10) / 10;
};

/**
 * Format a date string for display
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} - Formatted date like "Jan 15"
 */
export const formatLastLogged = (dateStr) => {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${months[date.getMonth()]} ${date.getDate()}`;
};
