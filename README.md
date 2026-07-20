# Bird Image Classification — Team Tracker

A small static site for your team to follow the project: who's doing what, what phase it's
in, and how much is done overall. No backend, no accounts — it's built to run straight from
GitHub Pages.

## What's inside

```
bird-tracker/
├── index.html     the page
├── style.css       design
├── script.js       all the logic (loads data.json, handles checkboxes, export)
├── data.json       the task list — this is your source of truth
└── README.md
```

Everything is driven by `data.json`. Open it and you'll see three team members, six phases
each (Dataset → Preprocessing → Feature Extraction → Machine Learning → Evaluation →
Documentation), a shared-responsibilities list, and a week number on every task.

## Running it locally

Because the page loads `data.json` with `fetch`, you can't just double-click `index.html` —
browsers block that for local files. Run a tiny local server instead:

```bash
cd bird-tracker
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploying on GitHub Pages

1. Push this folder to a GitHub repo (or add it to your existing project repo).
2. Go to **Settings → Pages** in the repo.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick your branch (e.g.
   `main`) and the folder this site lives in (`/root` if it's the whole repo, or `/docs` if
   you put it in a `docs/` folder).
4. Save. GitHub gives you a URL like `https://your-username.github.io/your-repo/` a minute
   or two later.

Share that link with your team — that's the whole site, live.

## How progress gets shared between teammates

This is a static site with no database, so there's no real-time syncing between different
people's browsers. Instead, progress syncs the same way your code does: **through git.**

1. Open the site and tick off whatever you've finished. Checkmarks save instantly to your
   own browser (`localStorage`), so they'll still be there next time you open the page — but
   only on your device.
2. When you want the team to see your progress, click **Export progress** in the top bar.
   That downloads an updated `data.json` with your checkmarks baked in.
3. Replace the `data.json` in the repo with the downloaded one, then commit and push:
   ```bash
   git add data.json
   git commit -m "Update progress: finished HOG feature extraction"
   git push
   ```
4. GitHub Pages rebuilds automatically. Everyone who reloads the page now sees the update.

A simple habit that works well: whoever finishes something exports and pushes before
closing their laptop, and the group does one "sync" push at the end of each work session.

## Editing the task list

`data.json` is plain, readable JSON — add, remove, or reassign tasks by editing it directly:

- `members` — the three of you, plus a color accent (`rust`, `sage`, `slate`) used
  throughout the site.
- `phases` — the six project phases, in order.
- `tasks` — each task has an `id` (keep these unique), a `member`, a `phase` number, a
  `week` number, a `title`, and `done`.
- `shared` — tasks that belong to everyone, not one person.

If you add a task, give it a fresh `id` (e.g. `m2-p3-3`) — the site uses `id` to remember
whether a box is checked.

## What the site shows

- **Hero** — overall percentage complete across every task, plus a quick chip per member.
- **By Member / By Phase / By Week** — three ways to slice the same task list, so you can
  check "what's Team Member 2 still got left" or "is Phase III done for everyone yet."
- **Shared Responsibilities** — the tasks that shouldn't fall on just one person.
- **Six-Week Log Book** — a table view mirroring your original weekly plan.
- **I am: [name]** — pick your name in the top bar and your folder gets a highlighted
  border, so you can find your own list at a glance without hiding everyone else's.

No build step, no dependencies — it's plain HTML/CSS/JS so it's easy for any of you to tweak.