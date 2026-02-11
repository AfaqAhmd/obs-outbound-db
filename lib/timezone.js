/**
 * Timezone utility for GMT+05:00 (Pakistan/India timezone)
 * All dates are interpreted and created in GMT+05:00
 */

const GMT_PLUS_5_OFFSET_MS = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

/**
 * Get the current date/time in GMT+05:00
 * Returns a Date object representing the current moment (stored as UTC in PostgreSQL)
 * 
 * On Vercel (UTC server), `new Date()` already represents the current moment correctly.
 * This function ensures consistency and makes the timezone explicit.
 */
export function getCurrentDateGMT5() {
  // Get current UTC time (which represents "now")
  // This moment, when viewed in GMT+05:00, is the current Pakistan time
  // PostgreSQL stores timestamps in UTC, so this is correct
  return new Date();
}

/**
 * Convert a date string (YYYY-MM-DD) to Date objects for filtering
 * Interprets the date as being in GMT+05:00
 * 
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {boolean} isEndOfDay - If true, set to end of day (23:59:59.999)
 * @returns {Date|null} - Date object in UTC representing the GMT+05:00 date
 * 
 * Example: If user selects "2026-01-27" in GMT+05:00:
 * - Start: 2026-01-27 00:00:00 GMT+05:00 = 2026-01-26 19:00:00 UTC
 * - End: 2026-01-27 23:59:59.999 GMT+05:00 = 2026-01-27 18:59:59.999 UTC
 */
export function dateStringToGMT5Date(dateStr, isEndOfDay = false) {
  if (!dateStr) return null;
  
  // Parse the date string (YYYY-MM-DD)
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return null;
  
  const hours = isEndOfDay ? 23 : 0;
  const minutes = isEndOfDay ? 59 : 0;
  const seconds = isEndOfDay ? 59 : 0;
  const ms = isEndOfDay ? 999 : 0;
  
  // Create a UTC timestamp for the GMT+05:00 date/time
  // Date.UTC creates a UTC timestamp, so we subtract 5 hours to get
  // the UTC equivalent of the GMT+05:00 time
  const gmt5Timestamp = Date.UTC(year, month - 1, day, hours, minutes, seconds, ms);
  const utcTimestamp = gmt5Timestamp - GMT_PLUS_5_OFFSET_MS;
  
  return new Date(utcTimestamp);
}
