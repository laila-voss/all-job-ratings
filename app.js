/* Social Signals of Jobs — Average Ratings explorer */
(function () {
  "use strict";

  // ---- Characteristic metadata --------------------------------------------
  const PERSON_CHARS = [
    { key: "Extroversion",  label: "Extroversion",
      def: "Extroversion refers to how outgoing, talkative, and comfortable interacting with others a person is." },
    { key: "Compassion",    label: "Compassion",
      def: "Compassion refers to how caring, empathetic and concerned about others' well-being a person is." },
    { key: "Intelligence",  label: "Intelligence",
      def: "Intelligence refers to how well a person understands complex ideas, learns new things, and solves difficult problems." },
    { key: "Motivation",    label: "Motivation",
      def: "Motivation refers to how driven and hardworking a person is in pursuing goals and completing tasks." },
    { key: "Creativity",    label: "Creativity",
      def: "Creativity refers to how good a person is at coming up with new ideas and finding original solutions to problems." },
    { key: "Organization",  label: "Organization",
      def: "Organization refers to how systematic, orderly, and reliable a person is at performing tasks and managing responsibilities." },
    { key: "Honesty",       label: "Honesty",
      def: "Honesty refers to how truthful, trustworthy, and ethical a person is in their words and actions." },
    { key: "Leadership",    label: "Leadership",
      def: "Leadership refers to how well a person takes charge in group settings, influences group decisions, and helps organize or direct collective efforts." },
  ];

  const OCC_CHARS = [
    { key: "FinancialCompensation",   label: "Financial Compensation",
      def: "The financial compensation of a job includes wage and salary income, business income, and the value of any financial assets provided by the firm, such as stock options." },
    { key: "Prestige",                label: "Prestige",
      def: "The prestige of a job refers to the amount or level of status that someone has because of their job." },
    { key: "SocialImpact",            label: "Social Impact",
      def: "The social impact of a job refers to how much of an impact the job has on the person's community, society, and the world." },
    { key: "InterestingnessVariety",  label: "Interestingness and Variety",
      def: "The interestingness and variety of a job refer to the degree to which a job involves a variety of interesting or intellectually engaging tasks and requires multiple skills." },
    { key: "LeadershipResponsibility", label: "Leadership Responsibility",
      def: "The leadership responsibility of a job refers to how much a person's job requires managing others, influencing workplace decisions, and shaping the direction of projects or the firm." },
    { key: "DifficultyToGet",         label: "Difficulty to Get",
      def: "The \"difficulty to get\" of a job refers to how much financial expense, preparation, study, and expertise is required for someone to be eligible to work in the job, as well as how difficult it is for a qualified individual to find a job in this job." },
    { key: "PrecisionCoordination",   label: "Precision and Coordination",
      def: "The precision and coordination of a job refers to how much the job requires carefully organizing tasks, coordinating activities across people, and completing work accurately and reliably." },
  ];

  const ALL_CHARS = [...PERSON_CHARS, ...OCC_CHARS];
  const CHAR_BY_KEY = Object.fromEntries(ALL_CHARS.map(c => [c.key, c]));
  const PERSON_KEYS = PERSON_CHARS.map(c => c.key);
  const OCC_KEYS = OCC_CHARS.map(c => c.key);

  const COLOR_PERSON = "#4f7fa8";
  const COLOR_OCC    = "#c97a4a";
  const PALETTE = ["#4f7fa8", "#c97a4a", "#6b9362", "#a35d8e", "#d4a04c", "#5d6f96", "#8a7e4d", "#9c5252"];

  function colorForChar(key) {
    return PERSON_KEYS.includes(key) ? COLOR_PERSON : COLOR_OCC;
  }

  // ---- Data ----------------------------------------------------------------
  let DATA = [];
  let DESCRIPTIONS = {};
  let META = {};
  try {
    DATA = JSON.parse(document.getElementById("ratings-data").textContent);
    DESCRIPTIONS = JSON.parse(document.getElementById("descriptions-data").textContent);
    META = JSON.parse(document.getElementById("meta-data").textContent);
  } catch (e) {
    console.error("Failed to parse embedded data", e);
  }

  // Compute means (skip nulls). R may have already done this, but be safe.
  function meanOf(row, keys) {
    const vals = keys.map(k => row[k]).filter(v => v !== null && v !== undefined && !isNaN(v));
    if (!vals.length) return null;
    const m = vals.reduce((a, b) => a + b, 0) / vals.length;
    return Math.round(m * 100) / 100;
  }
  DATA.forEach(r => {
    if (r.Person_Avg === undefined || r.Person_Avg === null) r.Person_Avg = meanOf(r, PERSON_KEYS);
    if (r.Occ_Avg    === undefined || r.Occ_Avg    === null) r.Occ_Avg    = meanOf(r, OCC_KEYS);
  });

  const OCCUPATIONS = DATA.map(r => r.jobtitle).sort((a, b) => a.localeCompare(b));

  function fmt(v) {
    if (v === null || v === undefined || isNaN(v)) return "—";
    return (Math.round(v * 10) / 10).toFixed(1);
  }

  // ---- Tab system ----------------------------------------------------------
  function setupTabs() {
    const buttons = document.querySelectorAll(".tab-btn");
    const panes = document.querySelectorAll(".tab-pane");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.tab;
        buttons.forEach(b => b.classList.toggle("active", b === btn));
        panes.forEach(p => p.classList.toggle("active", p.id === "tab-" + target));
        if (target === "explore-occupations") renderOccTabIfNeeded();
        if (target === "explore-characteristics") renderCharTabIfNeeded();
        if (target === "compare") renderCompareIfNeeded();
      });
    });
  }

  // ---- Tab 1: Full Ratings -------------------------------------------------
  let fullSort = { col: "jobtitle", dir: "asc" };
  let fullView = "all";
  let fullSearch = "";

  function activeChars() {
    if (fullView === "person") return PERSON_CHARS;
    if (fullView === "occ") return OCC_CHARS;
    return ALL_CHARS;
  }

  function renderFullTable() {
    const wrapper = document.getElementById("full-table-wrapper");
    const chars = activeChars();
    const showPersonAvg = fullView !== "occ";
    const showOccAvg = fullView !== "person";

    const search = fullSearch.trim().toLowerCase();
    let rows = DATA.filter(r => !search || r.jobtitle.toLowerCase().includes(search));

    const { col, dir } = fullSort;
    rows.sort((a, b) => {
      const va = a[col], vb = b[col];
      if (col === "jobtitle") return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      const na = (va === null || va === undefined || isNaN(va));
      const nb = (vb === null || vb === undefined || isNaN(vb));
      if (na && nb) return 0;
      if (na) return 1;
      if (nb) return -1;
      return dir === "asc" ? va - vb : vb - va;
    });

    const head = ['<th data-col="jobtitle">Occupation<span class="sort-ind"></span></th>'];
    chars.forEach(c => {
      const cls = PERSON_KEYS.includes(c.key) ? "col-group-person" : "col-group-occ";
      head.push(`<th data-col="${c.key}" class="${cls}" title="${escapeHtml(c.def)}">${c.label}<span class="sort-ind"></span></th>`);
    });
    if (showPersonAvg) head.push('<th data-col="Person_Avg" class="col-group-person">Avg (person)<span class="sort-ind"></span></th>');
    if (showOccAvg)    head.push('<th data-col="Occ_Avg" class="col-group-occ">Avg (occupation)<span class="sort-ind"></span></th>');

    const body = rows.map(r => {
      const cells = [`<td>${escapeHtml(r.jobtitle)}</td>`];
      chars.forEach(c => {
        const v = r[c.key];
        const cls = PERSON_KEYS.includes(c.key) ? "col-group-person" : "col-group-occ";
        cells.push(`<td class="${cls}${v == null ? " na" : ""}">${fmt(v)}</td>`);
      });
      if (showPersonAvg) cells.push(`<td class="col-group-person${r.Person_Avg == null ? " na" : ""}">${fmt(r.Person_Avg)}</td>`);
      if (showOccAvg)    cells.push(`<td class="col-group-occ${r.Occ_Avg == null ? " na" : ""}">${fmt(r.Occ_Avg)}</td>`);
      return `<tr>${cells.join("")}</tr>`;
    }).join("");

    wrapper.innerHTML =
      `<table class="ratings-table"><thead><tr>${head.join("")}</tr></thead><tbody>${body}</tbody></table>`;

    wrapper.querySelectorAll("thead th").forEach(th => {
      const c = th.dataset.col;
      th.classList.toggle("sort-asc", c === fullSort.col && fullSort.dir === "asc");
      th.classList.toggle("sort-desc", c === fullSort.col && fullSort.dir === "desc");
      const ind = th.querySelector(".sort-ind");
      if (ind) ind.textContent = c === fullSort.col ? (fullSort.dir === "asc" ? "▲" : "▼") : "↕";
      th.addEventListener("click", () => {
        if (fullSort.col === c) fullSort.dir = fullSort.dir === "asc" ? "desc" : "asc";
        else { fullSort.col = c; fullSort.dir = c === "jobtitle" ? "asc" : "desc"; }
        renderFullTable();
      });
    });
  }

  function downloadCsv() {
    const chars = activeChars();
    const showPersonAvg = fullView !== "occ";
    const showOccAvg = fullView !== "person";

    const headers = ["Occupation", ...chars.map(c => c.label)];
    if (showPersonAvg) headers.push("Avg (person)");
    if (showOccAvg) headers.push("Avg (occupation)");

    const search = fullSearch.trim().toLowerCase();
    const rows = DATA.filter(r => !search || r.jobtitle.toLowerCase().includes(search));

    const lines = [headers.map(csvEsc).join(",")];
    rows.forEach(r => {
      const row = [r.jobtitle];
      chars.forEach(c => row.push(r[c.key] == null ? "" : r[c.key]));
      if (showPersonAvg) row.push(r.Person_Avg == null ? "" : r.Person_Avg);
      if (showOccAvg)    row.push(r.Occ_Avg == null ? "" : r.Occ_Avg);
      lines.push(row.map(csvEsc).join(","));
    });

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `social_signals_ratings_${fullView}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function setupFullTab() {
    document.querySelectorAll('input[name="char-view"]').forEach(r => {
      r.addEventListener("change", e => {
        fullView = e.target.value;
        if (fullSort.col !== "jobtitle") {
          const cols = activeChars().map(c => c.key);
          if (!cols.includes(fullSort.col) && fullSort.col !== "Person_Avg" && fullSort.col !== "Occ_Avg") {
            fullSort = { col: "jobtitle", dir: "asc" };
          }
        }
        renderFullTable();
      });
    });
    document.getElementById("full-search").addEventListener("input", e => {
      fullSearch = e.target.value;
      renderFullTable();
    });
    document.getElementById("download-csv").addEventListener("click", downloadCsv);
    renderFullTable();
  }

  // ---- Tab 2: Explore Occupations ------------------------------------------
  let occTabRendered = false;
  function setupOccTab() {
    const select = document.getElementById("occ-select");
    OCCUPATIONS.forEach(o => {
      const opt = document.createElement("option");
      opt.value = o; opt.textContent = o;
      select.appendChild(opt);
    });
    select.addEventListener("change", () => renderOccProfile(select.value));
  }
  function renderOccTabIfNeeded() {
    if (occTabRendered) return;
    const select = document.getElementById("occ-select");
    if (!select.value && OCCUPATIONS.length) select.value = OCCUPATIONS[0];
    renderOccProfile(select.value);
    occTabRendered = true;
  }
  function renderOccProfile(jobtitle) {
    const row = DATA.find(d => d.jobtitle === jobtitle);
    if (!row) return;
    document.getElementById("occ-title").textContent = jobtitle;
    document.getElementById("occ-summary").textContent =
      `Avg (person-level): ${fmt(row.Person_Avg)} • Avg (occupation-level): ${fmt(row.Occ_Avg)}`;
    const descEl = document.getElementById("occ-description");
    const desc = DESCRIPTIONS[jobtitle];
    if (desc) {
      descEl.innerHTML = `<div class="desc-label">Description shown to participants</div><div class="desc-body">${escapeHtml(desc)}</div>`;
      descEl.style.display = "";
    } else {
      descEl.style.display = "none";
    }
    drawOccBars("occ-person-plot", row, PERSON_CHARS, COLOR_PERSON);
    drawOccBars("occ-job-plot", row, OCC_CHARS, COLOR_OCC);
  }
  function drawOccBars(divId, row, chars, color) {
    const labels = chars.map(c => c.label);
    const values = chars.map(c => row[c.key]);
    const text = values.map(v => v == null ? "" : fmt(v));
    const trace = {
      type: "bar",
      orientation: "h",
      x: values,
      y: labels,
      text: text,
      textposition: "outside",
      cliponaxis: false,
      marker: { color: color },
      hovertemplate: "%{y}: <b>%{x:.1f}</b><extra></extra>",
    };
    const layout = {
      margin: { l: 180, r: 50, t: 10, b: 40 },
      xaxis: { range: [0, 105], title: { text: "Average rating (0–100)", font: { size: 12 } }, gridcolor: "#eef0f3" },
      yaxis: { autorange: "reversed", tickfont: { size: 12 }, ticks: "outside", ticklen: 8, tickcolor: "rgba(0,0,0,0)" },
      height: 60 + 36 * chars.length,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "system-ui, sans-serif", color: "#1f2430" },
    };
    Plotly.newPlot(divId, [trace], layout, { displayModeBar: false, responsive: true });
  }

  // ---- Tab 3: Explore Characteristics --------------------------------------
  let charTabRendered = false;
  let charMode = "rank";
  function setupCharTab() {
    const sel1 = document.getElementById("char-select");
    const sel2 = document.getElementById("char-select-2");
    [sel1, sel2].forEach(sel => {
      ALL_CHARS.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.key; opt.textContent = c.label;
        sel.appendChild(opt);
      });
    });
    sel1.value = "Prestige";
    sel2.value = "FinancialCompensation";
    sel1.addEventListener("change", renderCharView);
    sel2.addEventListener("change", renderCharView);
    document.querySelectorAll('input[name="char-mode"]').forEach(r => {
      r.addEventListener("change", e => {
        charMode = e.target.value;
        document.getElementById("char-second-control").style.display = charMode === "scatter" ? "" : "none";
        document.getElementById("char-highlight-control").style.display = charMode === "scatter" ? "" : "none";
        renderCharView();
      });
    });
    document.getElementById("char-highlight").addEventListener("input", renderCharView);
  }
  function renderCharTabIfNeeded() {
    if (charTabRendered) return;
    renderCharView();
    charTabRendered = true;
  }
  function renderCharView() {
    if (charMode === "rank") {
      document.getElementById("char-rank-card").style.display = "";
      document.getElementById("char-scatter-card").style.display = "none";
      drawCharRank(document.getElementById("char-select").value);
    } else {
      document.getElementById("char-rank-card").style.display = "none";
      document.getElementById("char-scatter-card").style.display = "";
      drawCharScatter(
        document.getElementById("char-select").value,
        document.getElementById("char-select-2").value,
        document.getElementById("char-highlight").value.trim().toLowerCase()
      );
    }
  }
  function drawCharRank(charKey) {
    const meta = CHAR_BY_KEY[charKey];
    const rows = DATA.filter(r => r[charKey] != null).slice().sort((a, b) => b[charKey] - a[charKey]);
    const labels = rows.map(r => r.jobtitle);
    const values = rows.map(r => r[charKey]);
    const text = values.map(v => fmt(v));
    const trace = {
      type: "bar",
      orientation: "h",
      x: values,
      y: labels,
      text: text,
      textposition: "outside",
      cliponaxis: false,
      marker: { color: colorForChar(charKey) },
      hovertemplate: "<b>%{y}</b><br>" + meta.label + ": %{x:.1f}<extra></extra>",
    };
    const layout = {
      margin: { l: 280, r: 50, t: 30, b: 50 },
      title: { text: `Occupations ranked by ${meta.label}`, font: { size: 14 }, x: 0, xanchor: "left" },
      xaxis: { range: [0, 105], title: { text: "Average rating (0–100)" }, gridcolor: "#eef0f3" },
      yaxis: { autorange: "reversed", tickfont: { size: 11 }, automargin: true, ticks: "outside", ticklen: 10, tickcolor: "rgba(0,0,0,0)" },
      height: Math.max(420, 22 * rows.length + 80),
      paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "system-ui, sans-serif", color: "#1f2430" },
    };
    Plotly.newPlot("char-rank-plot", [trace], layout, { displayModeBar: false, responsive: true });
  }
  function pearson(xs, ys) {
    const n = xs.length;
    if (n < 2) return null;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, dx2 = 0, dy2 = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - mx, dy = ys[i] - my;
      num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
    }
    const denom = Math.sqrt(dx2 * dy2);
    return denom > 0 ? num / denom : null;
  }

  function drawCharScatter(xKey, yKey, highlight) {
    const xMeta = CHAR_BY_KEY[xKey], yMeta = CHAR_BY_KEY[yKey];
    const rows = DATA.filter(r => r[xKey] != null && r[yKey] != null);
    const xVals = rows.map(r => r[xKey]);
    const yVals = rows.map(r => r[yKey]);
    const r = pearson(xVals, yVals);
    const labels = rows.map(r => r.jobtitle);
    const colors = rows.map(r =>
      highlight && r.jobtitle.toLowerCase().includes(highlight) ? "#d4543a" : "#4f7fa8"
    );
    const sizes = rows.map(r =>
      highlight && r.jobtitle.toLowerCase().includes(highlight) ? 14 : 8
    );
    const trace = {
      type: "scatter", mode: "markers",
      x: xVals, y: yVals, text: labels,
      hovertemplate: "<b>%{text}</b><br>" + xMeta.label + ": %{x:.1f}<br>" + yMeta.label + ": %{y:.1f}<extra></extra>",
      marker: { color: colors, size: sizes, line: { color: "#fff", width: 1 }, opacity: 0.85 },
    };
    const matched = highlight ? rows.filter(row => row.jobtitle.toLowerCase().includes(highlight)) : [];
    const annotations = matched.map(row => ({
      x: row[xKey], y: row[yKey], text: row.jobtitle,
      showarrow: true, arrowhead: 2, arrowsize: 0.7, ax: 25, ay: -20, font: { size: 11 },
    }));
    if (r != null) {
      annotations.push({
        xref: "paper", yref: "paper",
        x: 0.98, y: 0.98, xanchor: "right", yanchor: "top",
        text: `Correlation: r = ${r.toFixed(2)}`,
        showarrow: false, font: { size: 12, color: "#1f2430" },
        bgcolor: "rgba(255,255,255,0.85)",
        bordercolor: "#e3e5ea", borderwidth: 1, borderpad: 4,
      });
    }
    const layout = {
      title: { text: `${xMeta.label} vs. ${yMeta.label}`, font: { size: 14 }, x: 0, xanchor: "left" },
      xaxis: { title: { text: xMeta.label }, range: [0, 100], gridcolor: "#eef0f3", zeroline: false },
      yaxis: { title: { text: yMeta.label }, range: [0, 100], gridcolor: "#eef0f3", zeroline: false, tickvals: [20, 40, 60, 80, 100] },
      height: 600,
      hovermode: "closest",
      annotations: annotations,
      shapes: [{
        type: "line", x0: 0, y0: 0, x1: 100, y1: 100,
        line: { color: "#aab2bd", width: 1, dash: "dash" },
        layer: "below",
      }],
      margin: { l: 70, r: 30, t: 50, b: 60 },
      paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "system-ui, sans-serif", color: "#1f2430" },
    };
    Plotly.newPlot("char-scatter-plot", [trace], layout, { displayModeBar: true, responsive: true, modeBarButtonsToRemove: ["lasso2d", "select2d"] });
  }

  // ---- Tab 4: Compare ------------------------------------------------------
  const MAX_COMPARE = 5;
  let cmpMode = "occ";
  let cmpOccs = [];
  let cmpChars = [];
  let compareInitialized = false;

  function setupCompareTab() {
    document.querySelectorAll('input[name="cmp-mode"]').forEach(r => {
      r.addEventListener("change", e => {
        cmpMode = e.target.value;
        document.getElementById("cmp-occ-section").style.display = cmpMode === "occ" ? "" : "none";
        document.getElementById("cmp-char-section").style.display = cmpMode === "char" ? "" : "none";
        renderCompareIfNeeded(true);
      });
    });

    // Occupation typeahead
    const datalist = document.getElementById("cmp-occ-list");
    OCCUPATIONS.forEach(o => {
      const opt = document.createElement("option");
      opt.value = o;
      datalist.appendChild(opt);
    });
    document.getElementById("cmp-occ-add").addEventListener("click", () => {
      const inp = document.getElementById("cmp-occ-input");
      const val = inp.value.trim();
      if (!val) return;
      const match = OCCUPATIONS.find(o => o.toLowerCase() === val.toLowerCase());
      if (!match) return;
      if (cmpOccs.includes(match)) { inp.value = ""; return; }
      if (cmpOccs.length >= MAX_COMPARE) return;
      cmpOccs.push(match);
      inp.value = "";
      renderCmpOccChips();
      renderCmpOcc();
    });
    document.getElementById("cmp-occ-input").addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); document.getElementById("cmp-occ-add").click(); }
    });
    document.getElementById("cmp-occ-clear").addEventListener("click", () => {
      cmpOccs = []; renderCmpOccChips(); renderCmpOcc();
    });

    // Characteristic checkboxes
    const grid = document.getElementById("cmp-char-grid");
    ALL_CHARS.forEach(c => {
      const id = "cmpchar-" + c.key;
      const lbl = document.createElement("label");
      lbl.innerHTML = `<input type="checkbox" id="${id}" value="${c.key}"><span>${c.label}</span>`;
      grid.appendChild(lbl);
      lbl.querySelector("input").addEventListener("change", e => {
        if (e.target.checked) {
          if (cmpChars.length >= MAX_COMPARE) { e.target.checked = false; return; }
          cmpChars.push(c.key);
        } else {
          cmpChars = cmpChars.filter(k => k !== c.key);
        }
        updateCmpCharDisable();
        renderCmpChar();
      });
    });
  }

  function updateCmpCharDisable() {
    const atMax = cmpChars.length >= MAX_COMPARE;
    document.querySelectorAll("#cmp-char-grid input").forEach(inp => {
      inp.disabled = atMax && !inp.checked;
    });
  }

  function renderCmpOccChips() {
    const wrap = document.getElementById("cmp-occ-chips");
    wrap.innerHTML = cmpOccs.map((o, i) =>
      `<span class="chip">${escapeHtml(o)}<button data-i="${i}" aria-label="Remove">×</button></span>`
    ).join("");
    wrap.querySelectorAll(".chip button").forEach(btn => {
      btn.addEventListener("click", () => {
        cmpOccs.splice(+btn.dataset.i, 1);
        renderCmpOccChips();
        renderCmpOcc();
      });
    });
  }

  function renderCompareIfNeeded(force) {
    if (!compareInitialized || force) {
      compareInitialized = true;
      renderCmpOcc();
      renderCmpChar();
    }
  }

  function renderCmpOcc() {
    const plotEl = document.getElementById("cmp-occ-plot");
    const tableEl = document.getElementById("cmp-occ-table");
    if (cmpOccs.length === 0) {
      plotEl.innerHTML = `<div class="empty-state">Add up to ${MAX_COMPARE} occupations to compare.</div>`;
      tableEl.innerHTML = "";
      return;
    }
    plotEl.innerHTML = "";
    const traces = cmpOccs.map((o, i) => {
      const row = DATA.find(r => r.jobtitle === o);
      return {
        type: "bar",
        name: o,
        x: ALL_CHARS.map(c => c.label),
        y: ALL_CHARS.map(c => row ? row[c.key] : null),
        marker: { color: PALETTE[i % PALETTE.length] },
        hovertemplate: `<b>${escapeHtml(o)}</b><br>%{x}: %{y:.1f}<extra></extra>`,
      };
    });
    const layout = {
      barmode: "group",
      height: 480,
      margin: { l: 60, r: 20, t: 30, b: 130 },
      yaxis: { range: [0, 105], title: { text: "Average rating (0–100)" }, gridcolor: "#eef0f3" },
      xaxis: { tickangle: -40, automargin: true },
      legend: { orientation: "h", y: -0.35 },
      paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "system-ui, sans-serif", color: "#1f2430" },
      shapes: [{
        type: "line", x0: PERSON_CHARS.length - 0.5, x1: PERSON_CHARS.length - 0.5,
        y0: 0, y1: 105, line: { color: "#bbb", width: 1, dash: "dot" },
      }],
      annotations: [
        { x: (PERSON_CHARS.length - 1) / 2, y: 102, text: "Person-level", showarrow: false, font: { size: 11, color: "#666" } },
        { x: PERSON_CHARS.length + (OCC_CHARS.length - 1) / 2, y: 102, text: "Occupation-level", showarrow: false, font: { size: 11, color: "#666" } },
      ],
    };
    Plotly.newPlot(plotEl, traces, layout, { displayModeBar: false, responsive: true });

    // Table: rows = characteristics, cols = occupations
    const head = `<th>Characteristic</th>` + cmpOccs.map(o => `<th>${escapeHtml(o)}</th>`).join("");
    const bodyRows = ALL_CHARS.map(c => {
      const cls = PERSON_KEYS.includes(c.key) ? "col-group-person" : "col-group-occ";
      const cells = cmpOccs.map(o => {
        const row = DATA.find(r => r.jobtitle === o);
        const v = row ? row[c.key] : null;
        return `<td class="${v == null ? "na" : ""}">${fmt(v)}</td>`;
      }).join("");
      return `<tr><td class="${cls}">${c.label}</td>${cells}</tr>`;
    }).join("");
    tableEl.innerHTML =
      `<div class="table-wrapper"><table class="ratings-table"><thead><tr>${head}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
  }

  function renderCmpChar() {
    const plotEl = document.getElementById("cmp-char-plot");
    const tableEl = document.getElementById("cmp-char-table");
    if (cmpChars.length === 0) {
      plotEl.innerHTML = `<div class="empty-state">Pick up to ${MAX_COMPARE} characteristics to compare.</div>`;
      tableEl.innerHTML = "";
      return;
    }
    plotEl.innerHTML = "";
    // Sort occupations by mean of selected characteristics (desc)
    const ranked = DATA.map(r => {
      const vals = cmpChars.map(k => r[k]).filter(v => v != null);
      const m = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      return { row: r, mean: m };
    }).sort((a, b) => (b.mean ?? -1) - (a.mean ?? -1));

    const occLabels = ranked.map(o => o.row.jobtitle);
    const traces = cmpChars.map((k, i) => ({
      type: "bar",
      name: CHAR_BY_KEY[k].label,
      orientation: "h",
      y: occLabels,
      x: ranked.map(o => o.row[k]),
      marker: { color: PALETTE[i % PALETTE.length] },
      hovertemplate: `<b>%{y}</b><br>${CHAR_BY_KEY[k].label}: %{x:.1f}<extra></extra>`,
    }));
    const layout = {
      barmode: "group",
      height: Math.max(500, 22 * occLabels.length + 100),
      margin: { l: 280, r: 30, t: 30, b: 60 },
      xaxis: { range: [0, 105], title: { text: "Average rating (0–100)" }, gridcolor: "#eef0f3" },
      yaxis: { autorange: "reversed", automargin: true, tickfont: { size: 11 }, ticks: "outside", ticklen: 10, tickcolor: "rgba(0,0,0,0)" },
      legend: { orientation: "h", y: 1.04 },
      paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "system-ui, sans-serif", color: "#1f2430" },
    };
    Plotly.newPlot(plotEl, traces, layout, { displayModeBar: false, responsive: true });

    // Table
    const head = `<th>Occupation</th>` + cmpChars.map(k => {
      const cls = PERSON_KEYS.includes(k) ? "col-group-person" : "col-group-occ";
      return `<th class="${cls}">${CHAR_BY_KEY[k].label}</th>`;
    }).join("") + `<th>Mean (selected)</th>`;
    const bodyRows = ranked.map(o => {
      const cells = cmpChars.map(k => {
        const v = o.row[k];
        return `<td class="${v == null ? "na" : ""}">${fmt(v)}</td>`;
      }).join("");
      return `<tr><td>${escapeHtml(o.row.jobtitle)}</td>${cells}<td>${fmt(o.mean)}</td></tr>`;
    }).join("");
    tableEl.innerHTML =
      `<div class="table-wrapper"><table class="ratings-table"><thead><tr>${head}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
  }

  // ---- About ---------------------------------------------------------------
  function buildAbout() {
    const personDefs = PERSON_CHARS.map(c =>
      `<div class="char-def"><div class="name">${c.label}</div><div class="body">${escapeHtml(c.def)}</div></div>`
    ).join("");
    const occDefs = OCC_CHARS.map(c =>
      `<div class="char-def"><div class="name">${c.label}</div><div class="body">${escapeHtml(c.def)}</div></div>`
    ).join("");
    document.getElementById("about-person").innerHTML = personDefs;
    document.getElementById("about-occ").innerHTML = occDefs;
  }

  // ---- Helpers -------------------------------------------------------------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
  function csvEsc(v) {
    if (v == null) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  // ---- Footer --------------------------------------------------------------
  function buildFooter() {
    const el = document.getElementById("footer-stats");
    if (!el) return;
    const np = (META.n_participants ?? "").toLocaleString();
    const nr = (META.n_ratings ?? "").toLocaleString();
    const parts = [];
    if (META.n_participants != null) parts.push(`${np} participant${META.n_participants === 1 ? "" : "s"}`);
    if (META.n_ratings != null)      parts.push(`${nr} ratings`);
    if (META.build_date)             parts.push(`updated ${META.build_date.trim()}`);
    el.textContent = parts.join(" · ");
  }

  // ---- Init ----------------------------------------------------------------
  function init() {
    setupTabs();
    setupFullTab();
    setupOccTab();
    setupCharTab();
    setupCompareTab();
    buildAbout();
    buildFooter();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
