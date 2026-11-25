const todayDateEl = document.getElementById("today-date");
const addHabitForm = document.getElementById("add-habit-form");
const habitInput = document.getElementById("habit-input");
const habitListEl = document.getElementById("habit-list");
const habitProgressEl = document.getElementById("habit-progress");
const emptyStateEl = document.getElementById("empty-state");
const archivedSectionEl = document.getElementById("archived-section");
const toggleArchivedBtn = document.getElementById("toggle-archived-btn");
const archivedListEl = document.getElementById("archived-list");

/**
 * Formats the current local date for display in the app header.
 * @param {Date} date
 * @returns {string}
 */
function formatDisplayDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/**
 * Temporary in-memory state for Phase 1 shell verification.
 * Will be replaced by db.js (Supabase) and streaks.js in upcoming phases.
 */
const state = {
  habits: [],
  showArchived: false,
};

function createDeleteButton(habit) {
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "habit-delete";
  deleteBtn.setAttribute("aria-label", `Delete "${habit.title}"`);
  deleteBtn.innerHTML = `<i data-lucide="x" class="action-icon" aria-hidden="true"></i>`;
  deleteBtn.addEventListener("click", () => {
    state.habits = state.habits.filter((h) => h.id !== habit.id);
    render();
  });
  return deleteBtn;
}

function render() {
  todayDateEl.textContent = formatDisplayDate();
  habitListEl.innerHTML = "";
  archivedListEl.innerHTML = "";

  const activeHabits = state.habits.filter((h) => !h.isArchived);
  const archivedHabits = state.habits.filter((h) => h.isArchived);

  if (activeHabits.length === 0) {
    emptyStateEl.hidden = false;
    habitProgressEl.textContent = "";
  } else {
    emptyStateEl.hidden = true;
    const completedCount = activeHabits.filter((h) => h.completedToday).length;
    habitProgressEl.textContent = `${completedCount} / ${activeHabits.length} done`;
  }

  for (const habit of activeHabits) {
    const li = document.createElement("li");
    li.className = `habit-item${habit.completedToday ? " completed" : ""}`;

    const checkBtn = document.createElement("button");
    checkBtn.type = "button";
    checkBtn.className = "habit-check";
    checkBtn.setAttribute(
      "aria-label",
      `Mark "${habit.title}" as ${habit.completedToday ? "incomplete" : "complete"}`
    );
    checkBtn.textContent = "✓";
    checkBtn.addEventListener("click", () => {
      habit.completedToday = !habit.completedToday;
      render();
    });

    const titleSpan = document.createElement("span");
    titleSpan.className = "habit-title";
    titleSpan.textContent = habit.title;

    const streak = habit.completedToday ? 1 : 0;
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
    archiveBtn.addEventListener("click", () => {
      habit.isArchived = true;
      render();
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
    restoreBtn.addEventListener("click", () => {
      habit.isArchived = false;
      render();
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

addHabitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = habitInput.value.trim();
  if (!title) return;

  state.habits.push({
    id: crypto.randomUUID(),
    title,
    completedToday: false,
    isArchived: false,
  });

  habitInput.value = "";
  render();
});

render();
