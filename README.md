# Habit Tracker

A clean, mobile-first daily Habit Tracker web app built with **vanilla HTML, CSS, and JavaScript**.

## What This Project Does (v1)

- **Daily Habits**: Add, edit, archive, and delete daily habits.
- **Today's Check-Off**: Check off completed habits for the current local day.
- **Streak Tracking**: View the current consecutive-day streak for each habit.
- **Persistent Storage**: Saves habits and daily completion logs to a cloud PostgreSQL database (Supabase) so data persists across visits.
- **Single-User**: Designed for personal use in v1 without login friction.

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, and ES6+ JavaScript (no frameworks or build step)
- **Database**: Supabase (PostgreSQL via REST API)

## Project Structure

```text
habbit/
├── index.html          # App shell and semantic layout
├── styles.css          # Mobile-first styles and theme variables
├── app.js              # UI rendering and event handling
└── README.md           # Project overview
```

*(Upcoming phases will add `streaks.js`, `db.js`, and `config.js` for streak calculations and Supabase persistence.)*

## Running Locally

Because `app.js` uses ES modules (`type="module"`), serve the folder with any static HTTP server rather than opening `index.html` via `file://`:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.
