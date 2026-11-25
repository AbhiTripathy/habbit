import {
  createHabit,
  deleteHabit,
  fetchHabits,
  setHabitArchived,
  setHabitCompletedOnDate,
} from "./db.js";
import {
  calculateStreak,
  getLocalDateString,
  isCompletedToday,
} from "./streaks.js";

const todayDateEl = document.getElementById("today-date");
const addHabitForm = document.getElementById("add-habit-form");
const habitInput = document.getElementById("habit-input");
const addHabitButton = addHabitForm.querySelector('button[type="submit"]');
const habitListEl = document.getElementById("habit-list");
const habitProgressEl = document.getElementById("habit-progress");
const emptyStateEl = document.getElementById("empty-state");
const statusMessageEl = document.getElementById("status-message");
const archivedSectionEl = document.getElementById("archived-section");
const toggleArchivedBtn = document.getElementById("toggle-archived-btn");
const archivedListEl = document.getElementById("archived-list");

/**
 * Formats the current local date for display in the app header.
 * @param {Date} [date]
 * @returns {string}
 */
function formatDisplayDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

const state = {
  habits: [],
  showArchived: false,
  isLoading: true,
  error: "",
};

function setStatus({ isLoading = state.isLoading, error = "" } = {}) {
  state.isLoading = isLoading;
  state.error = error;
}

function renderStatus() {
  if (state.error) {
    statusMessageEl.textContent = state.error;
    statusMessageEl.className = "status-message error";
    statusMessageEl.hidden = false;
    return;
  }

  if (state.isLoading) {
    statusMessageEl.textContent = "Loading habits...";
    statusMessageEl.className = "status-message";
    statusMessageEl.hidden = false;
    return;
  }

  statusMessageEl.hidden = true;
}

function createDeleteButton(habit) {
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "habit-delete";
  deleteBtn.setAttribute("aria-label", `Delete "${habit.title}"`);
  deleteBtn.innerHTML = `<i data-lucide="x" class="action-icon" aria-hidden="true"></i>`;
  deleteBtn.addEventListener("click", async () => {
    deleteBtn.disabled = true;
    try {
      setStatus({ error: "" });
      await deleteHabit(habit.id);
      state.habits = state.habits.filter((h) => h.id !== habit.id);
    } catch (err) {
      setStatus({ error: err.message || "Could not delete habit." });
    } finally {
      render();
    }
  });
  return deleteBtn;
}

function render() {
  todayDateEl.textContent = formatDisplayDate();
  renderStatus();

  habitListEl.innerHTML = "";
  archivedListEl.innerHTML = "";

  const activeHabits = state.habits.filter((h) => !h.isArchived);
  const archivedHabits = state.habits.filter((h) => h.isArchived);

  if (activeHabits.length === 0) {
    emptyStateEl.hidden = state.isLoading;
    habitProgressEl.textContent = "";
  } else {
    emptyStateEl.hidden = true;
    const completedCount = activeHabits.filter((h) =>
      isCompletedToday(h.completedDates)
    ).length;
    habitProgressEl.textContent = `${completedCount} / ${activeHabits.length} done`;
  }

  for (const habit of activeHabits) {
    const completedToday = isCompletedToday(habit.completedDates);
    const li = document.createElement("li");
    li.className = `habit-item${completedToday ? " completed" : ""}`;

    const checkBtn = document.createElement("button");
    checkBtn.type = "button";
    checkBtn.className = "habit-check";
    checkBtn.setAttribute(
      "aria-label",
      `Mark "${habit.title}" as ${completedToday ? "incomplete" : "complete"}`
    );
    checkBtn.textContent = "✓";
    checkBtn.addEventListener("click", async () => {
      const today = getLocalDateString();
      const nextCompleted = !isCompletedToday(habit.completedDates);
      checkBtn.disabled = true;
      try {
        setStatus({ error: "" });
        await setHabitCompletedOnDate(habit.id, today, nextCompleted);
        if (nextCompleted) {
          if (!habit.completedDates.includes(today)) {
            habit.completedDates.push(today);
          }
        } else {
          habit.completedDates = habit.completedDates.filter((d) => d !== today);
        }
      } catch (err) {
        setStatus({ error: err.message || "Could not update check-off." });
      } finally {
        render();
      }
    });

    const titleSpan = document.createElement("span");
    titleSpan.className = "habit-title";
    titleSpan.textContent = habit.title;

    const streak = calculateStreak(habit.completedDates);
    const streakSpan = document.createElement("span");
    streakSpan.className = `streak-badge${streak >= 1 ? " active" : ""}`;
    streakSpan.setAttribute(
      "aria-label",
      `${streak} ${streak === 1 ? "day" : "days"} streak`
    );
    streakSpan.innerHTML = `<i data-lucide="flame" class="streak-icon" aria-hidden="true"></i><span>${streak}</span>`;

    const archiveBtn = document.createElement("button");
    archiveBtn.type = "button";
    archiveBtn.className = "habit-archive";
    archiveBtn.setAttribute("aria-label", `Archive "${habit.title}"`);
    archiveBtn.innerHTML = `<i data-lucide="archive" class="action-icon" aria-hidden="true"></i>`;
    archiveBtn.addEventListener("click", async () => {
      archiveBtn.disabled = true;
      try {
        setStatus({ error: "" });
        await setHabitArchived(habit.id, true);
        habit.isArchived = true;
      } catch (err) {
        setStatus({ error: err.message || "Could not archive habit." });
      } finally {
        render();
      }
    });

    li.append(checkBtn, titleSpan, streakSpan, archiveBtn, createDeleteButton(habit));
    habitListEl.appendChild(li);
  }

  archivedSectionEl.hidden = archivedHabits.length === 0;
  archivedListEl.hidden = !state.showArchived || archivedHabits.length === 0;
  toggleArchivedBtn.setAttribute("aria-expanded", String(state.showArchived));
  toggleArchivedBtn.textContent = state.showArchived
    ? `Hide archived habits (${archivedHabits.length})`
    : `Show archived habits (${archivedHabits.length})`;

  for (const habit of archivedHabits) {
    const li = document.createElement("li");
    li.className = "habit-item";

    const titleSpan = document.createElement("span");
    titleSpan.className = "habit-title";
    titleSpan.textContent = habit.title;

    const restoreBtn = document.createElement("button");
    restoreBtn.type = "button";
    restoreBtn.className = "habit-archive";
    restoreBtn.setAttribute("aria-label", `Unarchive "${habit.title}"`);
    restoreBtn.innerHTML = `<i data-lucide="archive-restore" class="action-icon" aria-hidden="true"></i>`;
    restoreBtn.addEventListener("click", async () => {
      restoreBtn.disabled = true;
      try {
        setStatus({ error: "" });
        await setHabitArchived(habit.id, false);
        habit.isArchived = false;
      } catch (err) {
        setStatus({ error: err.message || "Could not unarchive habit." });
      } finally {
        render();
      }
    });

    li.append(titleSpan, restoreBtn, createDeleteButton(habit));
    archivedListEl.appendChild(li);
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

toggleArchivedBtn.addEventListener("click", () => {
  state.showArchived = !state.showArchived;
  render();
});

addHabitForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = habitInput.value.trim();
  if (!title) return;

  addHabitButton.disabled = true;
  habitInput.disabled = true;

  try {
    setStatus({ error: "" });
    const created = await createHabit(title);
    state.habits.push(created);
    habitInput.value = "";
  } catch (err) {
    setStatus({ error: err.message || "Could not add habit." });
  } finally {
    addHabitButton.disabled = false;
    habitInput.disabled = false;
    habitInput.focus();
    render();
  }
});

async function init() {
  render();
  try {
    const habits = await fetchHabits();
    state.habits = habits;
    setStatus({ isLoading: false, error: "" });
  } catch (err) {
    setStatus({
      isLoading: false,
      error: err.message || "Could not load habits from Supabase.",
    });
  } finally {
    render();
  }
}

init();
