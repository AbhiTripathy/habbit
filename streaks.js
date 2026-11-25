/**
 * Formats a Date into a local YYYY-MM-DD string (avoiding UTC day-shift).
 * @param {Date} [date]
 * @returns {string}
 */
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Shifts a YYYY-MM-DD date string by a number of local calendar days.
 * @param {string} dateStr
 * @param {number} deltaDays
 * @returns {string}
 */
export function shiftDate(dateStr, deltaDays) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return getLocalDateString(new Date(year, month - 1, day + deltaDays));
}

/**
 * Returns true only if dateStr matches today's local date.
 * Used to enforce strictly today's check-off.
 * @param {string} dateStr
 * @param {Date} [referenceDate]
 * @returns {boolean}
 */
export function isToday(dateStr, referenceDate = new Date()) {
  return dateStr === getLocalDateString(referenceDate);
}

/**
 * Returns true if the habit has a completion log for today's local date.
 * @param {Iterable<string>} completedDates
 * @param {Date} [referenceDate]
 * @returns {boolean}
 */
export function isCompletedToday(completedDates, referenceDate = new Date()) {
  const today = getLocalDateString(referenceDate);
  for (const dateStr of completedDates) {
    if (dateStr === today) return true;
  }
  return false;
}

/**
 * Calculates the current consecutive-day streak for a habit.
 * - If completed today, counts consecutive days ending today.
 * - If not yet completed today, counts consecutive days ending yesterday
 *   (so active streaks don't reset to 0 mid-day).
 * - Returns 0 if neither today nor yesterday was completed.
 *
 * @param {Iterable<string>} completedDates
 * @param {Date} [referenceDate]
 * @returns {number}
 */
export function calculateStreak(completedDates, referenceDate = new Date()) {
  const dateSet = completedDates instanceof Set ? completedDates : new Set(completedDates);
  const today = getLocalDateString(referenceDate);
  const yesterday = shiftDate(today, -1);

  let cursor = dateSet.has(today) ? today : dateSet.has(yesterday) ? yesterday : null;
  if (!cursor) return 0;

  let streak = 0;
  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}
