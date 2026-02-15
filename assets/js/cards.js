(() => {
  "use strict";
  const A = window.StudyHub;
  A.setActiveNav("cards.html");
  const el = (id) => document.getElementById(id);

  const btnExportAll = el("btnExportAll");
  btnExportAll.addEventListener("click", () => A.exportAll());

  const deckSelect = el("deckSelect");
  const btnShuffle = el("btnShuffle");
  const btnResetDeck = el("btnResetDeck");
  const fileImport = el("fileImport");
  const btnLoadExample = el("btnLoadExample");

  const deckSizeEl = el("deckSize");
  const correctEl = el("correct");
  const wrongEl = el("wrong");

  const cardEl = el("card");
  const bannerEl = el("banner");
  const btnCorrect = el("btnCorrect");
  const btnWrong = el("btnWrong");
  const btnNext = el("btnNext");

  const DECK_KEY = A.K.decks;
  const PROG_KEY = A.K.deckProgress;

  const getDecks = () => A.load(DECK_KEY, []);
  const saveDecks = (d) => A.save(DECK_KEY, d);

  const getProgressAll = () => A.load(PROG_KEY, {});
  const saveProgressAll = (p) => A.save(PROG_KEY, p);

  const ensureExampleDeckInList = async () => {
    const decks = getDecks();
    if (decks.some(d => d.id === "example")) return;

    try {
      const r = await fetch("./decks/example_deck.json", { cache:"no-store" });
      if (!r.ok) throw new Error("fetch failed");
      const cards = await r.json();
      decks.push({ id:"example", title:"Example Deck (Basics)", cards });
      saveDecks(decks);
    } catch {
      // ignore - user can still import
    }
  };

  const txtToCards = (txt) => {
    const blocks = txt.replace(/\r/g,"").split(/\n\s*\n/g).map(b => b.trim()).filter(Boolean);
    const out = [];
    for (const b of blocks) {
      const lines = b.split("\n").map(x=>x.trim()).filter(Boolean);
      if (lines.length < 2) continue;
      const q = lines[0];
      const a = lines[1];
      const why = lines.slice(2).join("\n");
      out.push({ q, a, why });
    }
    return out;
  };

  const normalizeCards = (cards) => (cards||[])
    .map(c => ({
      id: c.id || A.uuid(),
      q: String(c.q||"").trim(),
      a: String(c.a||"").trim(),
      why: String(c.why||"").trim()
    }))
    .filter(c => c.q && c.a);

  const initDeckSelect = () => {
    const decks = getDecks();
    deckSelect.innerHTML = "";
    for (const d of decks) {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.title;
      deckSelect.appendChild(o);
    }
    if (!decks.length) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = "No decks yet — import or load example";
      deckSelect.appendChild(o);
    }
  };

  let state = {
    deckId: "",
    deckTitle: "",
    cards: [],
    queue: [],
    flipped: false,
    shuffle: false,
    stats: { correct:0, wrong:0 }
  };

  const loadDeck = (deckId) => {
    const decks = getDecks();
    const d = decks.find(x => x.id === deckId);
    if (!d) return;

    const cards = normalizeCards(d.cards);
    const progAll = getProgressAll();
    const prog = progAll[deckId] || null;

    state.deckId = deckId;
    state.deckTitle = d.title;
    state.cards = cards;

    if (prog && Array.isArray(prog.queue) && prog.queue.length) {
      // restore queue by ids
      const map = new Map(cards.map(c => [c.id, c]));
      state.queue = prog.queue.map(id => map.get(id)).filter(Boolean);
      // if deck changed, append missing
      const qids = new Set(state.queue.map(c=>c.id));
      for (const c of cards) if (!qids.has(c.id)) state.queue.push(c);
      state.stats = prog.stats || {correct:0, wrong:0};
      state.shuffle = !!prog.shuffle;
    } else {
      state.queue = [...cards];
      state.stats = {correct:0, wrong:0};
      state.shuffle = false;
    }

    state.flipped = false;
    persist();
    render();
    A.toast(`Loaded: ${state.deckTitle}`);
  };

  const persist = () => {
    if (!state.deckId) return;
    const all = getProgressAll();
    all[state.deckId] = {
      updatedAt: A.nowIso(),
      queue: state.queue.map(c=>c.id),
      stats: state.stats,
      shuffle: state.shuffle
    };
    saveProgressAll(all);
  };

  const currentCard = () => state.queue[0] || null;

  const renderCard = () => {
    const c = currentCard();
    if (!c) {
      cardEl.innerHTML = `<div class="flashQ">No cards.</div><div class="note">Import a deck or load the example.</div>`;
      return;
    }
    if (!state.flipped) {
      cardEl.innerHTML = `<div class="flashQ">${escapeHtml(c.q)}</div><div class="note" style="margin-top:10px;">(click to flip)</div>`;
    } else {
      cardEl.innerHTML =
        `<div class="flashQ">${escapeHtml(c.q)}</div>
         <div class="flashA"><b>Answer:</b> ${escapeHtml(c.a)}</div>
         <div class="flashWhy"><b>Why:</b>\n${escapeHtml(c.why || "—")}</div>`;
    }
  };

  const render = () => {
    deckSizeEl.textContent = String(state.cards.length || 0);
    correctEl.textContent = String(state.stats.correct||0);
    wrongEl.textContent = String(state.stats.wrong||0);
    btnShuffle.textContent = `Shuffle: ${state.shuffle ? "ON" : "OFF"}`;
    bannerEl.style.display = "none";
    renderCard();
  };

  const showBanner = (kind, text) => {
    bannerEl.className = `banner ${kind}`;
    bannerEl.textContent = text;
    bannerEl.style.display = "block";
  };

  const mark = (isCorrect) => {
    if (!state.flipped) { A.toast("Flip first (so you see answer + why)."); return; }
    const c = currentCard();
    if (!c) return;

    if (isCorrect) {
      state.stats.correct = (state.stats.correct||0) + 1;
      showBanner("good", "Correct — here’s why (review above). Card goes to the back.");
    } else {
      state.stats.wrong = (state.stats.wrong||0) + 1;
      showBanner("bad", "Wrong — review the answer + why above. Card goes to the back.");
    }

    // move to back
    state.queue.push(state.queue.shift());

    // optional shuffle (light shuffle so you still see repetition)
    if (state.shuffle && state.queue.length > 2) {
      for (let i=1; i<state.queue.length; i++) {
        const j = 1 + Math.floor(Math.random()*(state.queue.length-1));
        [state.queue[i], state.queue[j]] = [state.queue[j], state.queue[i]];
      }
    }

    persist();
    render();

    // Log to Vlog as a short entry (cards session)
    const s = A.getSettings();
    A.addActivity({
      certId: s.currentCert || "netplus",
      type: "cards_session",
      minutes: 0,
      title: `Card: ${isCorrect ? "correct" : "wrong"}`,
      details: c.q.slice(0,120)
    });
  };

  const next = () => {
    if (!state.queue.length) return;
    state.queue.push(state.queue.shift());
    state.flipped = false;
    persist();
    render();
  };

  const escapeHtml = (s) => (s||"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");

  // Events
  cardEl.addEventListener("click", () => {
    state.flipped = !state.flipped;
    render();
  });
  btnCorrect.addEventListener("click", () => mark(true));
  btnWrong.addEventListener("click", () => mark(false));
  btnNext.addEventListener("click", next);

  btnShuffle.addEventListener("click", () => {
    state.shuffle = !state.shuffle;
    persist();
    render();
  });

  btnResetDeck.addEventListener("click", () => {
    if (!state.deckId) return;
    const all = getProgressAll();
    delete all[state.deckId];
    saveProgressAll(all);
    loadDeck(state.deckId);
    A.toast("Deck progress reset.");
  });

  deckSelect.addEventListener("change", () => loadDeck(deckSelect.value));

  btnLoadExample.addEventListener("click", async () => {
    await ensureExampleDeckInList();
    initDeckSelect();
    loadDeck("example");
  });

  fileImport.addEventListener("change", async () => {
    const f = fileImport.files && fileImport.files[0];
    if (!f) return;

    const text = await f.text();
    let cards = [];
    let title = f.name.replace(/\.[^.]+$/,"");

    if (f.name.toLowerCase().endsWith(".json")) {
      try { cards = JSON.parse(text); } catch { A.toast("Invalid JSON."); return; }
    } else {
      cards = txtToCards(text);
    }

    cards = normalizeCards(cards);
    if (!cards.length) { A.toast("No cards found in that file."); return; }

    const decks = getDecks();
    const id = "deck_" + A.uuid();
    decks.push({ id, title, cards });
    saveDecks(decks);

    initDeckSelect();
    deckSelect.value = id;
    loadDeck(id);
    A.toast(`Imported deck: ${title}`);
  });

  // Init
  (async () => {
    await ensureExampleDeckInList();
    initDeckSelect();

    const decks = getDecks();
    if (decks.length) {
      const s = A.getSettings();
      // default deck = example if present, else first
      const firstId = decks.some(d=>d.id==="example") ? "example" : decks[0].id;
      deckSelect.value = firstId;
      loadDeck(firstId);
      // set current cert default if empty
      if (!s.currentCert) { s.currentCert = "netplus"; A.saveSettings(s); }
    } else {
      render();
    }

    A.toast("Cards ready.");
  })();
})();
