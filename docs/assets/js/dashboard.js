(() => {
  "use strict";
  const A = window.StudyHub;
  A.setActiveNav("index.html");
  const el = (id) => document.getElementById(id);

  const btnExportAll = el("btnExportAll");
  btnExportAll.addEventListener("click", () => A.exportAll());

  const activity = A.getActivity();
  const todayKey = A.dayKey(A.nowIso());

  const streak = A.streakFromActivity(activity);
  const todayMin = activity.filter(e => A.dayKey(e.ts)===todayKey).reduce((s,e)=>s+(Number(e.minutes)||0),0);
  const weekMin = activity.filter(e => (Date.now()-new Date(e.ts).getTime()) <= 7*86400000).reduce((s,e)=>s+(Number(e.minutes)||0),0);

  el("streak").textContent = String(streak);
  el("todayMin").textContent = String(todayMin);
  el("weekMin").textContent = String(weekMin);

  const s = A.getSettings();
  const cur = A.CERTS[s.currentCert]?.title || "Network+";
  el("hint").textContent = `Tip: Keep momentum. Do 20–30 min + log it. Current focus: ${cur}.`;

  A.toast("Dashboard ready.");
})();
