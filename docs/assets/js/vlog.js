(() => {
  "use strict";
  const A = window.StudyHub;
  A.setActiveNav("vlog.html");
  const el = (id) => document.getElementById(id);

  const btnExportAll = el("btnExportAll");
  btnExportAll.addEventListener("click", () => A.exportAll());

  const streakEl = el("streak");
  const todayMinEl = el("todayMin");
  const weekMinEl = el("weekMin");

  const tsEl = el("ts");
  const certSelect = el("certSelect");
  const typeSelect = el("typeSelect");
  const minutesEl = el("minutes");
  const tagsEl = el("tags");
  const titleEl = el("title");
  const didEl = el("did");
  const learnedEl = el("learned");
  const nextEl = el("next");
  const btnAdd = el("btnAdd");
  const btnResetForm = el("btnResetForm");

  const searchEl = el("search");
  const filterCertEl = el("filterCert");
  const filterTypeEl = el("filterType");
  const fromDateEl = el("fromDate");
  const toDateEl = el("toDate");
  const btnExportActivity = el("btnExportActivity");
  const btnClear = el("btnClear");
  const listEl = el("list");

  const pad2 = (n) => String(n).padStart(2, "0");
  const setNowTs = () => {
    const d = new Date();
    tsEl.value = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };
  const dtLocalToIso = (dtLocal) => {
    if (!dtLocal) return A.nowIso();
    const d = new Date(dtLocal);
    return Number.isNaN(d.getTime()) ? A.nowIso() : d.toISOString();
  };

  const initCertDropdowns = () => {
    certSelect.innerHTML = "";
    for (const k of Object.keys(A.CERTS)) {
      const opt1 = document.createElement("option");
      opt1.value = k; opt1.textContent = A.CERTS[k].title;
      certSelect.appendChild(opt1);

      const opt2 = document.createElement("option");
      opt2.value = k; opt2.textContent = A.CERTS[k].title;
      filterCertEl.appendChild(opt2);
    }
    const s = A.getSettings();
    certSelect.value = s.currentCert || "netplus";
  };

  const normTags = (s) => (s||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,25);

  const buildSearchHay = (e) => {
    const meta = e.meta || {};
    const parts = [
      e.type, e.title, e.details,
      (meta.tags || []).join(" "),
      meta.did, meta.learned, meta.next
    ];
    return parts.join(" ").toLowerCase();
  };

  const renderStats = (activity) => {
    streakEl.textContent = String(A.streakFromActivity(activity));
    const todayKey = A.dayKey(A.nowIso());
    const todayMin = activity.filter(e => A.dayKey(e.ts)===todayKey).reduce((s,e)=>s+(Number(e.minutes)||0),0);
    const weekMin = activity.filter(e => (Date.now()-new Date(e.ts).getTime()) <= 7*86400000).reduce((s,e)=>s+(Number(e.minutes)||0),0);
    todayMinEl.textContent = String(todayMin);
    weekMinEl.textContent = String(weekMin);
  };

  const inDateRange = (iso, fromDay, toDay) => {
    const day = A.dayKey(iso);
    if (fromDay && day < fromDay) return false;
    if (toDay && day > toDay) return false;
    return true;
  };

  const renderList = () => {
    const q = (searchEl.value||"").trim().toLowerCase();
    const certFilter = filterCertEl.value;
    const typeFilter = filterTypeEl.value;
    const fromDay = fromDateEl.value || "";
    const toDay = toDateEl.value || "";

    const activity = A.getActivity();
    renderStats(activity);

    const sorted = [...activity].sort((a,b)=>new Date(b.ts)-new Date(a.ts));

    const filtered = sorted.filter(e => {
      if (certFilter !== "all" && e.certId !== certFilter) return false;
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (!inDateRange(e.ts, fromDay, toDay)) return false;
      if (!q) return true;
      return buildSearchHay(e).includes(q);
    });

    listEl.innerHTML = "";
    if (!filtered.length) {
      const d = document.createElement("div");
      d.className = "item";
      d.textContent = "No entries match your filters.";
      listEl.appendChild(d);
      return;
    }

    for (const e of filtered) {
      const div = document.createElement("div");
      div.className = "item";

      const head = document.createElement("div");
      head.className = "itemHead";

      const cert = A.CERTS[e.certId]?.title || e.certId;
      const mins = Number(e.minutes)||0;

      const title = document.createElement("div");
      title.className = "itemTitle";
      title.textContent = `[${cert}] ${e.type} — ${mins} min — ${e.title || ""}`.trim();

      const when = document.createElement("div");
      when.className = "mono";
      when.textContent = A.fmtTs(e.ts);

      const spacer = document.createElement("span");
      spacer.className = "spacer";

      const del = document.createElement("button");
      del.textContent = "Delete";
      del.addEventListener("click", () => {
        A.deleteActivity(e.id);
        A.toast("Deleted entry.");
        renderList();
      });

      head.appendChild(title);
      head.appendChild(when);
      head.appendChild(spacer);
      head.appendChild(del);

      div.appendChild(head);

      const meta = e.meta || {};
      const tags = Array.isArray(meta.tags) ? meta.tags : [];
      const lines = [];
      if (meta.did) lines.push(`• Did: ${meta.did}`);
      if (meta.learned) lines.push(`• Learned: ${meta.learned}`);
      if (meta.next) lines.push(`• Next: ${meta.next}`);
      if (tags.length) lines.push(`• Tags: ${tags.join(", ")}`);
      if (e.details && e.details.trim()) lines.push(`• Details: ${e.details.trim()}`);

      if (lines.length) {
        const det = document.createElement("div");
        det.className = "note";
        det.textContent = lines.join("\n");
        div.appendChild(det);
      }

      listEl.appendChild(div);
    }
  };

  const resetForm = () => {
    setNowTs();
    minutesEl.value = "";
    tagsEl.value = "";
    titleEl.value = "";
    didEl.value = "";
    learnedEl.value = "";
    nextEl.value = "";
    A.toast("Form reset.");
  };

  btnAdd.addEventListener("click", () => {
    const certId = certSelect.value;
    const type = typeSelect.value;

    const tsIso = dtLocalToIso(tsEl.value);
    const minutes = Number(minutesEl.value || 0);

    const title = (titleEl.value || "").trim();
    const did = (didEl.value || "").trim();
    const learned = (learnedEl.value || "").trim();
    const next = (nextEl.value || "").trim();
    const tags = normTags(tagsEl.value);

    if (!title && !did && !learned && !next && !minutes) {
      A.toast("Add minutes or at least one text field.");
      return;
    }

    const details = [did?`Did: ${did}`:"", learned?`Learned: ${learned}`:"", next?`Next: ${next}`:""].filter(Boolean).join(" | ");

    const arr = A.getActivity();
    arr.unshift({
      id: A.uuid(),
      ts: tsIso,
      certId,
      type,
      minutes,
      title,
      details,
      meta: { tags, did, learned, next }
    });
    if (arr.length > 5000) arr.length = 5000;
    A.saveActivity(arr);

    const s = A.getSettings();
    s.currentCert = certId;
    A.saveSettings(s);

    A.toast("Logged.");
    resetForm();
    renderList();
  });

  btnResetForm.addEventListener("click", resetForm);

  searchEl.addEventListener("input", renderList);
  filterCertEl.addEventListener("change", renderList);
  filterTypeEl.addEventListener("change", renderList);
  fromDateEl.addEventListener("change", renderList);
  toDateEl.addEventListener("change", renderList);

  btnExportActivity.addEventListener("click", () => {
    A.download("activity.json","application/json;charset=utf-8", JSON.stringify(A.getActivity(), null, 2));
    A.toast("Exported activity.json");
  });

  btnClear.addEventListener("click", () => {
    A.saveActivity([]);
    A.toast("Activity cleared.");
    renderList();
  });

  initCertDropdowns();
  setNowTs();
  renderList();
  A.toast("Vlog ready (timestamped + searchable).");
})();
