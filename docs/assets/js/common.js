(() => {
  "use strict";

  const CERTS = {
    netplus: { id:"netplus", title:"Network+", file:"netplus.html" },
    secplus: { id:"secplus", title:"Security+", file:"secplus.html" },
    secai:   { id:"secai",   title:"Security AI", file:"secai.html" }
  };

  const K = {
    settings: "studyhub_settings_v1",
    activity: "studyhub_activity_v1",
    cert: (id) => `studyhub_cert_${id}_v1`,
    decks: "studyhub_decks_v1",
    deckProgress: "studyhub_deck_progress_v1",
    journal: "studyhub_journal_v1"
  };

  const load = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  };
  const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  const uuid = () => (crypto?.randomUUID?.() || ("id_" + Math.random().toString(16).slice(2) + Date.now().toString(16)));
  const nowIso = () => new Date().toISOString();

  const fmtTs = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch { return String(iso||""); }
  };

  const dayKey = (iso) => {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const da = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${da}`;
  };

  const toast = (msg) => {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 1200);
  };

  const setActiveNav = (file) => {
    document.querySelectorAll(".nav a").forEach(a => {
      const href = (a.getAttribute("href")||"").replace("./","");
      if (href === file) a.classList.add("active");
      else a.classList.remove("active");
    });
  };

  const getSettings = () => load(K.settings, { currentCert: "netplus" });
  const saveSettings = (s) => save(K.settings, s);

  const getActivity = () => load(K.activity, []);
  const saveActivity = (arr) => save(K.activity, arr);

  const deleteActivity = (id) => {
    const arr = getActivity().filter(e => e.id !== id);
    saveActivity(arr);
  };

  const addActivity = ({certId, type, minutes=0, title="", details="", meta={}}) => {
    const arr = getActivity();
    arr.unshift({ id: uuid(), ts: nowIso(), certId, type, minutes, title, details, meta });
    if (arr.length > 5000) arr.length = 5000;
    saveActivity(arr);
  };

  const streakFromActivity = (activity) => {
    if (!activity.length) return 0;
    const days = new Set(activity.map(e => dayKey(e.ts)));
    let streak = 0;
    let d = new Date();
    for (;;) {
      const k = dayKey(d.toISOString());
      if (!days.has(k)) break;
      streak++;
      d = new Date(d.getTime() - 86400000);
    }
    return streak;
  };

  const getCert = (id) => load(K.cert(id), {
    notes:"",
    sessions:[],
    objectives:[],
    updatedAt: nowIso()
  });

  const saveCert = (id, data) => save(K.cert(id), data);

  const download = (filename, mime, content) => {
    const blob = new Blob([content], {type:mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
  };

  const exportAll = () => {
    const payload = {
      exported_at: nowIso(),
      settings: getSettings(),
      activity: getActivity(),
      certs: Object.keys(CERTS).reduce((acc, id) => (acc[id]=getCert(id), acc), {}),
      decks: load(K.decks, []),
      deckProgress: load(K.deckProgress, {}),
      journal: load(K.journal, [])
    };
    download("studyhub_backup.json","application/json;charset=utf-8", JSON.stringify(payload,null,2));
    toast("Exported backup.");
  };

  window.StudyHub = {
    CERTS, K,
    load, save,
    uuid, nowIso, fmtTs, dayKey,
    toast, setActiveNav,
    getSettings, saveSettings,
    getActivity, saveActivity, deleteActivity, addActivity,
    streakFromActivity,
    getCert, saveCert,
    download, exportAll
  };
})();
