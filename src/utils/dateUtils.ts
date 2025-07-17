/**
 * Formats a date string without timezone conversion issues
 * Handles dates stored as UTC (e.g., "2025-01-01 00:00:00+00") properly
 * by extracting just the date part and avoiding local timezone conversion
 */
export const formatEventDate = (dateString: string) => {
  // Extract just the date part (YYYY-MM-DD) from the string
  const datePart = dateString.split('T')[0].split(' ')[0];
  
  // Parse the date parts manually to avoid timezone issues
  const [year, month, day] = datePart.split('-').map(Number);
  
  // Create a date object using local timezone (no UTC conversion)
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Simple date formatter for preview components
 */
export const formatSimpleDate = (dateString: string) => {
  const datePart = dateString.split('T')[0].split(' ')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Checks if an event date is in the past without timezone conversion issues
 * Compares dates at the day level, not time level
 */
export const isEventPast = (eventDateString: string) => {
  const eventDatePart = eventDateString.split('T')[0].split(' ')[0];
  const [eventYear, eventMonth, eventDay] = eventDatePart.split('-').map(Number);
  
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1; // getMonth() is 0-based
  const todayDay = today.getDate();
  
  // Compare year, then month, then day
  if (eventYear < todayYear) return true;
  if (eventYear > todayYear) return false;
  if (eventMonth < todayMonth) return true;
  if (eventMonth > todayMonth) return false;
  return eventDay < todayDay;
};

/**
 * Parses an event date string to a Date object without timezone issues
 * Useful for date arithmetic and filtering
 */
export const parseEventDate = (dateString: string) => {
  const datePart = dateString.split('T')[0].split(' ')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
}; 