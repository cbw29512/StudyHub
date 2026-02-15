(() => {
  "use strict";
  const A = window.StudyHub;
  A.setActiveNav("journal.html");
  const el = (id) => document.getElementById(id);

  const btnExportAll = el("btnExportAll");
  btnExportAll.addEventListener("click", () => A.exportAll());

  const certSelect = el("certSelect");
  const titleEl = el("title");
  const tagsEl = el("tags");
  const bodyEl = el("body");
  const btnAdd = el("btnAdd");

  const searchEl = el("search");
  const filterCertEl = el("filterCert");
  const btnExport = el("btnExport");
  const listEl = el("list");

  const JKEY = A.K.journal;
  const getNotes = () => A.load(JKEY, []);
  const saveNotes = (n) => A.save(JKEY, n);

  const initCertDropdowns = () => {
    certSelect.innerHTML = "";
    for (const k of Object.keys(A.CERTS)) {
      const o = document.createElement("option");
      o.value = k; o.textContent = A.CERTS[k].title;
      certSelect.appendChild(o);

      const f = document.createElement("option");
      f.value = k; f.textContent = A.CERTS[k].title;
      filterCertEl.appendChild(f);
    }
    const s = A.getSettings();
    certSelect.value = s.currentCert || "netplus";
  };

  const normTags = (s) => (s||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,25);

  const render = () => {
    const q = (searchEl.value||"").trim().toLowerCase();
    const cf = filterCertEl.value;

    const notes = [...getNotes()].sort((a,b)=>new Date(b.ts)-new Date(a.ts));

    const filtered = notes.filter(n => {
      if (cf !== "all" && n.certId !== cf) return false;
      if (!q) return true;
      const hay = `${n.title} ${n.body} ${(n.tags||[]).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });

    listEl.innerHTML = "";
    if (!filtered.length) {
      const d = document.createElement("div");
      d.className = "item";
      d.textContent = "No notes match your search.";
      listEl.appendChild(d);
      return;
    }

    for (const n of filtered) {
      const div = document.createElement("div");
      div.className = "item";

      const head = document.createElement("div");
      head.className = "itemHead";

      const cert = A.CERTS[n.certId]?.title || n.certId;

      const t = document.createElement("div");
      t.className = "itemTitle";
      t.textContent = `[${cert}] ${n.title || "(untitled)"}`;

      const when = document.createElement("div");
      when.className = "mono";
      when.textContent = A.fmtTs(n.ts);

      const spacer = document.createElement("span");
      spacer.className = "spacer";

      const del = document.createElement("button");
      del.textContent = "Delete";
      del.addEventListener("click", () => {
        const arr = getNotes().filter(x => x.id !== n.id);
        saveNotes(arr);
        A.toast("Deleted note.");
        render();
      });

      head.appendChild(t);
      head.appendChild(when);
      head.appendChild(spacer);
      head.appendChild(del);

      div.appendChild(head);

      if (n.tags?.length) {
        const tag = document.createElement("div");
        tag.className = "note";
        tag.textContent = `Tags: ${n.tags.join(", ")}`;
        div.appendChild(tag);
      }

      const body = document.createElement("div");
      body.className = "note";
      body.textContent = n.body || "";
      div.appendChild(body);

      listEl.appendChild(div);
    }
  };

  btnAdd.addEventListener("click", () => {
    const certId = certSelect.value;
    const title = (titleEl.value||"").trim();
    const body = (bodyEl.value||"").trim();
    const tags = normTags(tagsEl.value);

    if (!title && !body) { A.toast("Add a title or body."); return; }

    const arr = getNotes();
    arr.unshift({ id:A.uuid(), ts:A.nowIso(), certId, title, body, tags });
    if (arr.length > 5000) arr.length = 5000;
    saveNotes(arr);

    const s = A.getSettings();
    s.currentCert = certId;
    A.saveSettings(s);

    titleEl.value = ""; tagsEl.value = ""; bodyEl.value = "";
    A.toast("Note added.");
    render();
  });

  searchEl.addEventListener("input", render);
  filterCertEl.addEventListener("change", render);

  btnExport.addEventListener("click", () => {
    A.download("notes.json","application/json;charset=utf-8", JSON.stringify(getNotes(), null, 2));
    A.toast("Exported notes.json");
  });

  initCertDropdowns();
  render();
  A.toast("Journal ready.");
})();
