import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config.js";

const REST_BASE_URL = `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1`;

/**
 * Sends a request to the Supabase PostgREST API.
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
async function request(path, options = {}) {
  const response = await fetch(`${REST_BASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Supabase request failed (${response.status})`;
    try {
      const errorBody = await response.json();
      if (errorBody?.message) {
        message = errorBody.message;
      }
    } catch {
      // Ignore non-JSON error responses.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Loads all habits along with their completion dates in a single query.
 * @returns {Promise<Array<{id: string, title: string, isArchived: boolean, completedDates: string[]}>>}
 */
export async function fetchHabits() {
  const rows = await request(
    "/habits?select=id,title,is_archived,created_at,habit_logs(completed_date)&order=created_at.asc"
  );

  return (rows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    isArchived: Boolean(row.is_archived),
    completedDates: (row.habit_logs ?? []).map((log) => log.completed_date),
  }));
}

/**
 * Creates a new habit in Supabase.
 * @param {string} title
 * @returns {Promise<{id: string, title: string, isArchived: boolean, completedDates: string[]}>}
 */
export async function createHabit(title) {
  const rows = await request("/habits?select=id,title,is_archived,created_at", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({ title }),
  });

  const created = rows?.[0];
  if (!created) {
    throw new Error("Failed to create habit.");
  }

  return {
    id: created.id,
    title: created.title,
    isArchived: Boolean(created.is_archived),
    completedDates: [],
  };
}

/**
 * Permanently deletes a habit (and its habit_logs via ON DELETE CASCADE).
 * @param {string} habitId
 * @returns {Promise<void>}
 */
export async function deleteHabit(habitId) {
  await request(`/habits?id=eq.${encodeURIComponent(habitId)}`, {
    method: "DELETE",
  });
}

/**
 * Updates the is_archived flag for a habit.
 * @param {string} habitId
 * @param {boolean} isArchived
 * @returns {Promise<void>}
 */
export async function setHabitArchived(habitId, isArchived) {
  await request(`/habits?id=eq.${encodeURIComponent(habitId)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ is_archived: isArchived }),
  });
}

/**
 * Adds or removes a completion log for a habit on a specific YYYY-MM-DD date.
 * @param {string} habitId
 * @param {string} completedDate
 * @param {boolean} isCompleted
 * @returns {Promise<void>}
 */
export async function setHabitCompletedOnDate(
  habitId,
  completedDate,
  isCompleted
) {
  if (isCompleted) {
    await request("/habit_logs", {
      method: "POST",
      headers: {
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify({
        habit_id: habitId,
        completed_date: completedDate,
      }),
    });
    return;
  }

  await request(
    `/habit_logs?habit_id=eq.${encodeURIComponent(habitId)}&completed_date=eq.${encodeURIComponent(completedDate)}`,
    {
      method: "DELETE",
    }
  );
}
