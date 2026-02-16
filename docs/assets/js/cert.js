(() => {
  "use strict";
  const A = window.StudyHub;
  const el = (id) => document.getElementById(id);

  const body = document.body;
  const CERT_ID    = body.dataset.certId;
  const CERT_TITLE = body.dataset.certTitle;
  const CERT_FILE  = body.dataset.certFile;

  if (!CERT_ID) { A.toast("Missing data-cert-id on body."); return; }
  A.setActiveNav(CERT_FILE || "");

  const btnExportAll = el("btnExportAll");
  const btnExportCert = el("btnExportCert");
  const certTitle = el("certTitle");
  const notesTa = el("notes");
  const updatedEl = el("updated");

  const topicEl = el("topic");
  const minutesEl = el("minutes");
  const btnAddSession = el("btnAddSession");
  const sessionsList = el("sessionsList");

  const objPaste = el("objPaste");
  const btnReplaceObjectives = el("btnReplaceObjectives");
  const objList = el("objList");

  certTitle.textContent = CERT_TITLE || CERT_ID;

  let data = A.getCert(CERT_ID);
  const save = () => A.saveCert(CERT_ID, data);

  const updateTimestamp = () => {
    updatedEl.textContent = `Updated: ${A.fmtTs(data.updatedAt || A.nowIso())}`;
  };

  let t = null;
  const scheduleNotesSave = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      data.notes = notesTa.value;
      data.updatedAt = A.nowIso();
      save();
      updateTimestamp();
      A.toast("Saved notes.");
    }, 250);
  };
  notesTa.addEventListener("input", scheduleNotesSave);

  const renderSessions = () => {
    sessionsList.innerHTML = "";
    const arr = data.sessions || [];
    if (!arr.length) {
      const d = document.createElement("div");
      d.className = "item";
      d.textContent = "No study sessions yet. Add one above.";
      sessionsList.appendChild(d);
      return;
    }
    for (const s of arr) {
      const div = document.createElement("div");
      div.className = "item";

      const head = document.createElement("div");
      head.className = "itemHead";

      const title = document.createElement("div");
      title.className = "itemTitle";
      title.textContent = `${s.topic || "Study"} — ${s.minutes || 0} min`;

      const when = document.createElement("div");
      when.className = "mono";
      when.textContent = A.fmtTs(s.ts);

      const spacer = document.createElement("span");
      spacer.className = "spacer";

      const del = document.createElement("button");
      del.textContent = "Delete";
      del.addEventListener("click", () => {
        data.sessions = (data.sessions || []).filter(x => x.id !== s.id);
        save();
        renderSessions();
        A.toast("Deleted session.");
      });

      head.appendChild(title);
      head.appendChild(when);
      head.appendChild(spacer);
      head.appendChild(del);

      div.appendChild(head);
      sessionsList.appendChild(div);
    }
  };

  btnAddSession.addEventListener("click", () => {
    const topic = (topicEl.value || "").trim();
    const minutes = Number(minutesEl.value || 0);

    if (!topic && !minutes) { A.toast("Add a topic and/or minutes."); return; }

    const entry = { id: A.uuid(), ts: A.nowIso(), topic: topic || "Study", minutes: minutes || 0 };
    data.sessions = data.sessions || [];
    data.sessions.unshift(entry);
    if (data.sessions.length > 2000) data.sessions.length = 2000;

    data.updatedAt = A.nowIso();
    save();
    renderSessions();
    updateTimestamp();

    // Log to Vlog
    A.addActivity({
      certId: CERT_ID,
      type: "study_session",
      minutes: entry.minutes,
      title: entry.topic,
      details: "Logged from certification page."
    });

    // Sticky current cert
    const s = A.getSettings();
    s.currentCert = CERT_ID;
    A.saveSettings(s);

    topicEl.value = "";
    minutesEl.value = "";
    A.toast("Session added + logged.");
  });

  const sanitizeLine = (line) => line.trim().replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").trim();

  const renderObjectives = () => {
    objList.innerHTML = "";
    data.objectives = data.objectives || [];
    if (!data.objectives.length) {
      const d = document.createElement("div");
      d.className = "item";
      d.textContent = "No objectives yet. Paste lines and click Replace.";
      objList.appendChild(d);
      return;
    }
    data.objectives.forEach((it, idx) => {
      const div = document.createElement("div");
      div.className = "item";

      const row = document.createElement("div");
      row.className = "checkRow";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!it.done;
      cb.addEventListener("change", () => {
        it.done = cb.checked;
        data.updatedAt = A.nowIso();
        save();
        updateTimestamp();
        A.toast("Updated objective.");
      });

      const txt = document.createElement("div");
      txt.textContent = it.text;

      const spacer = document.createElement("span");
      spacer.className = "spacer";

      const del = document.createElement("button");
      del.textContent = "Remove";
      del.addEventListener("click", () => {
        data.objectives.splice(idx, 1);
        data.updatedAt = A.nowIso();
        save();
        renderObjectives();
        updateTimestamp();
        A.toast("Removed objective.");
      });

      row.appendChild(cb);
      row.appendChild(txt);
      row.appendChild(spacer);
      row.appendChild(del);

      div.appendChild(row);
      objList.appendChild(div);
    });
  };

  btnReplaceObjectives.addEventListener("click", () => {
    const lines = (objPaste.value || "").split("\n").map(sanitizeLine).filter(Boolean);
    data.objectives = lines.map(t => ({ text: t, done: false }));
    data.updatedAt = A.nowIso();
    save();
    renderObjectives();
    updateTimestamp();
    A.toast("Objectives replaced.");
  });

  btnExportAll.addEventListener("click", () => A.exportAll());

  btnExportCert.addEventListener("click", () => {
    const payload = { exported_at: A.nowIso(), certId: CERT_ID, data };
    A.download(`${CERT_ID}_data.json`, "application/json;charset=utf-8", JSON.stringify(payload, null, 2));
    A.toast("Exported cert data.");
  });

  // Init
  notesTa.value = data.notes || "";
  updateTimestamp();
  renderSessions();
  renderObjectives();
  A.toast(`${CERT_TITLE || CERT_ID} ready.`);
})();
