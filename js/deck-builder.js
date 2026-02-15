(() => {
  const MOUNT_ID = "deck-builder-mount";
  const STORAGE_KEY = "studyhub_decks_v1";
  const CATALOG_URL = "./decks/cert-catalog.json";

  const css = `
  #${MOUNT_ID}{
    margin-top:16px; padding:16px; border-radius:16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
  }
  #${MOUNT_ID} h2{ margin:0 0 8px 0; font-size: 18px; }
  #${MOUNT_ID} .row{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin:10px 0; }
  #${MOUNT_ID} label{ font-size: 13px; opacity: 0.9; display:flex; flex-direction:column; gap:6px; }
  #${MOUNT_ID} select, #${MOUNT_ID} textarea, #${MOUNT_ID} input[type="text"]{
    width: 320px; max-width: 100%;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.25);
    color: inherit;
    padding: 10px;
    outline: none;
  }
  #${MOUNT_ID} textarea{ width: 100%; min-height: 140px; resize: vertical; }
  #${MOUNT_ID} button{
    border-radius: 12px; padding:10px 12px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.06);
    color: inherit;
    cursor: pointer;
  }
  #${MOUNT_ID} button:hover{ background: rgba(255,255,255,0.10); }
  #${MOUNT_ID} .muted{ opacity:0.75; font-size: 13px; }
  #${MOUNT_ID} pre{
    white-space: pre-wrap;
    background: rgba(0,0,0,0.22);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 12px;
    padding: 10px;
    margin: 10px 0 0 0;
    max-height: 220px;
    overflow: auto;
  }
  `;

  function addStyleOnce() {
    if (document.getElementById("deck-builder-style")) return;
    const s = document.createElement("style");
    s.id = "deck-builder-style";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now();
  }

  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch { return {}; }
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  async function loadCatalog() {
    try {
      const r = await fetch(CATALOG_URL, { cache: "no-store" });
      if (!r.ok) throw new Error("catalog fetch failed");
      return await r.json();
    } catch {
      return { version: 1, certs: [] };
    }
  }

  function normalizeLine(line) {
    return line.replace(/^\s*[-*•]\s+/, "").replace(/\s+/g, " ").trim();
  }

  function parseTopics(text) {
    return text.split("\n").map(normalizeLine).filter(Boolean);
  }

  function downloadJson(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  function mountUI(catalog) {
    addStyleOnce();

    let mount = document.getElementById(MOUNT_ID);
    if (!mount) {
      mount = document.createElement("div");
      mount.id = MOUNT_ID;
      (document.querySelector("main") || document.body).appendChild(mount);
    }

    const certSelect = document.createElement("select");
    const domainSelect = document.createElement("select");
    const topicsArea = document.createElement("textarea");
    const notesPrefix = document.createElement("input");
    notesPrefix.type = "text";
    notesPrefix.placeholder = "Optional prefix (ex: Explain / Define / Compare...)";

    const status = document.createElement("div");
    status.className = "muted";
    status.textContent = "Paste topics (one per line) → Preview → Save. Export is optional.";

    const preview = document.createElement("pre");
    preview.textContent = "Preview will appear here…";

    function fillCerts() {
      certSelect.innerHTML = "";
      for (const c of catalog.certs || []) {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.exam ? `${c.name} (${c.exam})` : c.name;
        certSelect.appendChild(opt);
      }
    }

    function fillDomains() {
      domainSelect.innerHTML = "";
      const cert = (catalog.certs || []).find(c => c.id === certSelect.value);
      for (const d of (cert?.domains || [])) {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = d.name;
        domainSelect.appendChild(opt);
      }
    }

    function buildCards() {
      const topics = parseTopics(topicsArea.value);
      const prefix = normalizeLine(notesPrefix.value);
      const cert = (catalog.certs || []).find(c => c.id === certSelect.value);
      const dom = (cert?.domains || []).find(d => d.id === domainSelect.value);

      const cards = topics.map(t => ({
        id: uuid(),
        certId: cert?.id || "",
        certName: cert?.name || "",
        domainId: dom?.id || "",
        domainName: dom?.name || "",
        front: prefix ? `${prefix}: ${t}` : t,
        back: "",
        createdAt: new Date().toISOString()
      }));

      return { cert, dom, cards };
    }

    const btnPreview = document.createElement("button");
    btnPreview.textContent = "Preview";

    const btnSave = document.createElement("button");
    btnSave.textContent = "Save to browser (local)";

    const btnExport = document.createElement("button");
    btnExport.textContent = "Export JSON";

    btnPreview.onclick = () => {
      const { cert, dom, cards } = buildCards();
      preview.textContent =
        `Will create ${cards.length} cards\n` +
        `Cert: ${cert?.name || "?"}\n` +
        `Domain: ${dom?.name || "?"}\n\n` +
        cards.slice(0, 20).map((c, i) => `${i + 1}. ${c.front}`).join("\n") +
        (cards.length > 20 ? `\n… (${cards.length - 20} more)` : "");
    };

    btnSave.onclick = () => {
      const { cert, dom, cards } = buildCards();
      const store = loadStore();
      store[cert.id] = store[cert.id] || {};
      store[cert.id][dom.id] = store[cert.id][dom.id] || [];
      store[cert.id][dom.id].push(...cards);
      saveStore(store);
      status.textContent = `Saved ${cards.length} cards locally for ${cert.name} → ${dom.name}.`;
    };

    btnExport.onclick = () => {
      const { cert, dom, cards } = buildCards();
      const filename = `${cert.id}_${dom.id}_cards.json`;
      downloadJson(filename, { certId: cert.id, domainId: dom.id, cards });
      status.textContent = `Exported ${cards.length} cards to ${filename}.`;
    };

    certSelect.onchange = () => fillDomains();

    mount.innerHTML = "";
    const h2 = document.createElement("h2");
    h2.textContent = "Deck Builder (Fast Import)";

    const hint = document.createElement("div");
    hint.className = "muted";
    hint.textContent = "Paste topics, generate cards, save locally, export JSON when ready.";

    const row1 = document.createElement("div");
    row1.className = "row";
    const labCert = document.createElement("label");
    labCert.textContent = "Certificate";
    labCert.appendChild(certSelect);

    const labDom = document.createElement("label");
    labDom.textContent = "Domain";
    labDom.appendChild(domainSelect);

    const labPrefix = document.createElement("label");
    labPrefix.textContent = "Front-side prefix (optional)";
    labPrefix.appendChild(notesPrefix);

    row1.appendChild(labCert);
    row1.appendChild(labDom);
    row1.appendChild(labPrefix);

    const row2 = document.createElement("div");
    row2.className = "row";
    topicsArea.placeholder = "Paste topics here (one per line)\nExample:\nOSI model layers\nTCP vs UDP\nWhat is ARP?";
    row2.appendChild(topicsArea);

    const row3 = document.createElement("div");
    row3.className = "row";
    row3.appendChild(btnPreview);
    row3.appendChild(btnSave);
    row3.appendChild(btnExport);

    mount.appendChild(h2);
    mount.appendChild(hint);
    mount.appendChild(row1);
    mount.appendChild(row2);
    mount.appendChild(row3);
    mount.appendChild(status);
    mount.appendChild(preview);

    fillCerts();
    fillDomains();
  }

  window.addEventListener("DOMContentLoaded", async () => {
    const catalog = await loadCatalog();
    if (!catalog.certs || !catalog.certs.length) return;
    mountUI(catalog);
  });
})();