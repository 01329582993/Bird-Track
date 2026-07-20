(function () {
  "use strict";

  const STORAGE_STATE = "birdtracker_state_v1";
  const STORAGE_WHO = "birdtracker_who_v1";
  const STORAGE_VIEW = "birdtracker_view_v1";
  const STORAGE_OPEN = "birdtracker_open_v1";

  const ROMAN = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI" };

  let DATA = null;
  let overrides = loadJSON(STORAGE_STATE, {});
  let openFolders = loadJSON(STORAGE_OPEN, {});

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ }
  }

  function isDone(item) {
    return overrides.hasOwnProperty(item.id) ? overrides[item.id] : !!item.done;
  }
  function setDone(id, val) {
    overrides[id] = val;
    saveJSON(STORAGE_STATE, overrides);
  }

  function allTasksAndShared() {
    return DATA.tasks.concat(DATA.shared);
  }

  function memberById(id) {
    return DATA.members.find((m) => m.id === id);
  }

  function pct(done, total) {
    if (!total) return 0;
    return Math.round((done / total) * 100);
  }

  function fetchData() {
    return fetch("data.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Could not load data.json (" + r.status + ")");
        return r.json();
      });
  }

  /* ---------------- Rendering ---------------- */

  function renderAll() {
    document.getElementById("project-title").textContent = DATA.project.title;
    document.getElementById("project-subtitle").textContent = DATA.project.subtitle;

    renderHero();
    renderWhoSelect();
    renderMemberFolders();
    renderPhaseView();
    renderWeekView();
    renderShared();
    renderWeeklyTable();

    document.getElementById("last-synced").textContent =
      "Data file loaded " + new Date().toLocaleString();
  }

  function renderHero() {
    const all = allTasksAndShared();
    const doneCount = all.filter(isDone).length;
    document.getElementById("overall-pct").textContent = pct(doneCount, all.length) + "%";

    const chipsEl = document.getElementById("member-chips");
    chipsEl.innerHTML = "";
    DATA.members.forEach((m) => {
      const tasks = DATA.tasks.filter((t) => t.member === m.id);
      const done = tasks.filter(isDone).length;
      const chip = document.createElement("span");
      chip.className = "chip accent-" + m.accent;
      chip.innerHTML =
        '<span class="chip__dot"></span>' +
        m.name + " — " + done + "/" + tasks.length;
      chipsEl.appendChild(chip);
    });
  }

  function renderWhoSelect() {
    const sel = document.getElementById("who-select");
    const current = localStorage.getItem(STORAGE_WHO) || "";
    sel.innerHTML = '<option value="">— choose —</option>';
    DATA.members.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.name + " (" + m.role + ")";
      if (m.id === current) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function taskRow(task, opts) {
    opts = opts || {};
    const row = document.createElement("div");
    row.className = "task-row" + (isDone(task) ? " is-done" : "");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "stamp-check";
    cb.checked = isDone(task);
    cb.setAttribute("aria-label", task.title);
    cb.addEventListener("change", () => {
      setDone(task.id, cb.checked);
      renderAll();
    });

    const title = document.createElement("span");
    title.className = "task-row__title";
    title.textContent = task.title;

    row.appendChild(cb);

    if (opts.showOwner) {
      const m = memberById(task.member);
      const owner = document.createElement("span");
      owner.className = "group-card__owner accent-" + m.accent;
      owner.textContent = m.name.replace("Team Member ", "M");
      row.appendChild(owner);
    }

    row.appendChild(title);

    if (opts.showWeek) {
      const wk = document.createElement("span");
      wk.className = "task-row__week";
      wk.textContent = "Week " + task.week;
      row.appendChild(wk);
    }

    return row;
  }

  function renderMemberFolders() {
    const wrap = document.getElementById("member-folders");
    wrap.innerHTML = "";
    const who = localStorage.getItem(STORAGE_WHO) || "";

    DATA.members.forEach((m, idx) => {
      const tasks = DATA.tasks.filter((t) => t.member === m.id);
      const done = tasks.filter(isDone).length;
      const percent = pct(done, tasks.length);

      const isOpen = openFolders.hasOwnProperty(m.id) ? openFolders[m.id] : idx === 0;

      const folder = document.createElement("div");
      folder.className = "folder" + (isOpen ? " is-open" : "") + (who === m.id ? " is-me" : "");

      const tab = document.createElement("button");
      tab.className = "folder__tab";
      tab.type = "button";
      tab.setAttribute("aria-expanded", String(isOpen));
      tab.innerHTML =
        '<span class="folder__avatar accent-' + m.accent + '">' + m.initial + "</span>" +
        '<span class="folder__heading">' +
          '<p class="folder__name">' + m.name + "</p>" +
          '<p class="folder__role">' + m.role + "</p>" +
        "</span>" +
        '<span class="folder__progress">' +
          '<span class="folder__progress-bar"><span class="folder__progress-fill accent-' + m.accent + '" style="width:' + percent + '%"></span></span>' +
          '<span class="folder__progress-pct">' + percent + "%</span>" +
        "</span>" +
        '<svg class="folder__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      tab.addEventListener("click", () => {
        openFolders[m.id] = !folder.classList.contains("is-open");
        saveJSON(STORAGE_OPEN, openFolders);
        renderMemberFolders();
      });

      const body = document.createElement("div");
      body.className = "folder__body";

      DATA.phases.forEach((phase) => {
        const phaseTasks = tasks.filter((t) => t.phase === phase.n);
        if (!phaseTasks.length) return;
        const pDone = phaseTasks.filter(isDone).length;

        const block = document.createElement("div");
        block.className = "phase-block";
        block.innerHTML =
          '<div class="phase-block__head">' +
            '<span class="phase-block__numeral">' + ROMAN[phase.n] + "</span>" +
            '<h3 class="phase-block__name">' + phase.name + "</h3>" +
            '<span class="phase-block__count">' + pDone + "/" + phaseTasks.length + "</span>" +
          "</div>";

        const rowsWrap = document.createElement("div");
        phaseTasks.forEach((t) => rowsWrap.appendChild(taskRow(t, { showWeek: true })));
        block.appendChild(rowsWrap);
        body.appendChild(block);
      });

      folder.appendChild(tab);
      folder.appendChild(body);
      wrap.appendChild(folder);
    });
  }

  function renderPhaseView() {
    const wrap = document.getElementById("phase-groups");
    wrap.innerHTML = "";
    DATA.phases.forEach((phase) => {
      const tasks = DATA.tasks.filter((t) => t.phase === phase.n);
      const done = tasks.filter(isDone).length;

      const card = document.createElement("div");
      card.className = "group-card";
      card.innerHTML =
        '<div class="group-card__head">' +
          '<span class="group-card__numeral">' + ROMAN[phase.n] + "</span>" +
          '<h3 class="group-card__title">' + phase.name + "</h3>" +
          '<span class="group-card__count">' + done + "/" + tasks.length + "</span>" +
        "</div>";

      const rows = document.createElement("div");
      tasks.forEach((t) => {
        const row = taskRow(t, { showOwner: true, showWeek: true });
        row.className = row.className.replace("task-row", "group-card__row").trim();
        if (isDone(t)) {
          row.classList.add("is-done");
        }
        rows.appendChild(row);
      });
      card.appendChild(rows);
      wrap.appendChild(card);
    });
  }

  function renderWeekView() {
    const wrap = document.getElementById("week-groups");
    wrap.innerHTML = "";
    for (let w = 1; w <= DATA.project.weeks; w++) {
      const tasks = DATA.tasks.filter((t) => t.week === w);
      if (!tasks.length) continue;
      const done = tasks.filter(isDone).length;

      const card = document.createElement("div");
      card.className = "group-card";
      card.innerHTML =
        '<div class="group-card__head">' +
          '<span class="group-card__numeral">WK</span>' +
          '<h3 class="group-card__title">Week ' + w + "</h3>" +
          '<span class="group-card__count">' + done + "/" + tasks.length + "</span>" +
        "</div>";

      const rows = document.createElement("div");
      tasks.forEach((t) => {
        const row = taskRow(t, { showOwner: true });
        row.className = row.className.replace("task-row", "group-card__row").trim();
        rows.appendChild(row);
      });
      card.appendChild(rows);
      wrap.appendChild(card);
    }
  }

  function renderShared() {
    const list = document.getElementById("shared-list");
    list.innerHTML = "";
    DATA.shared.forEach((s) => {
      const li = document.createElement("li");
      li.appendChild(taskRow(s));
      list.appendChild(li);
    });
  }

  function renderWeeklyTable() {
    const body = document.getElementById("weekly-table-body");
    body.innerHTML = "";
    document.getElementById("wcol-m1").textContent = DATA.members[0].name;
    document.getElementById("wcol-m2").textContent = DATA.members[1].name;
    document.getElementById("wcol-m3").textContent = DATA.members[2].name;

    for (let w = 1; w <= DATA.project.weeks; w++) {
      const tr = document.createElement("tr");
      const weekCell = document.createElement("td");
      weekCell.innerHTML = "<strong>Week " + w + "</strong>";
      tr.appendChild(weekCell);

      DATA.members.forEach((m) => {
        const tasks = DATA.tasks.filter((t) => t.member === m.id && t.week === w);
        const done = tasks.filter(isDone).length;
        const td = document.createElement("td");
        const titles = tasks.map((t) => t.title).join(" · ");
        td.innerHTML =
          '<span>' + (titles || "—") + "</span>" +
          (tasks.length ? '<span class="wk-frac">' + done + "/" + tasks.length + " done</span>" : "");
        tr.appendChild(td);
      });

      body.appendChild(tr);
    }
  }

  /* ---------------- Controls ---------------- */

  function initControls() {
    document.querySelectorAll(".view-toggle__btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        saveJSON(STORAGE_VIEW, view);
        applyView(view);
      });
    });

    document.getElementById("who-select").addEventListener("change", (e) => {
      localStorage.setItem(STORAGE_WHO, e.target.value);
      renderHero();
      renderMemberFolders();
    });

    document.getElementById("export-btn").addEventListener("click", exportData);

    const savedView = localStorage.getItem(STORAGE_VIEW) || "member";
    applyView(savedView);
  }

  function applyView(view) {
    ["member", "phase", "week"].forEach((v) => {
      document.getElementById(v + "-view").classList.toggle("is-hidden", v !== view);
    });
    document.querySelectorAll(".view-toggle__btn").forEach((btn) => {
      const active = btn.dataset.view === view;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
  }

  function exportData() {
    const out = JSON.parse(JSON.stringify(DATA));
    out.tasks.forEach((t) => { t.done = isDone(t); });
    out.shared.forEach((s) => { s.done = isDone(s); });

    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ---------------- Boot ---------------- */

  fetchData()
    .then((data) => {
      DATA = data;
      initControls();
      renderAll();
    })
    .catch((err) => {
      document.querySelector(".content").innerHTML =
        '<p style="color:#e6b8a2;font-family:monospace;">Could not load data.json — ' +
        (err && err.message ? err.message : err) +
        '. If you are opening this file directly (file://), run a local server instead, e.g. <code>python3 -m http.server</code>, then open http://localhost:8000.</p>';
    });
})();
