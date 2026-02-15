# StudyHub

<!-- DECK_BUILDER_SECTION_START -->
## Deck Builder (Fast Import)

This project includes a lightweight **Deck Builder** that lets you generate study cards fast without hand-typing each one.

### How it works
- The certificate structure lives in: `decks/cert-catalog.json`
- The Deck Builder UI lives in: `js/deck-builder.js`
- The Cards page loads it automatically (patched into `cards.html`)

### Using the Deck Builder
1. Open the **Cards** tab in the site.
2. Choose a **Certificate** and **Domain**.
3. Paste topics **one per line** (copy/paste from exam objectives or your notes).
4. Click **Preview**.
5. Click **Save to browser (local)** to store your generated cards in localStorage.
6. Optional: click **Export JSON** to download a deck file you can commit into `decks/` later.

### Why this is the simplest workflow
- No accounts needed
- No database needed
- You can build decks from **any source** (official objectives PDF, class notes, your own outline)
- Export is there when you want “real files” in GitHub

<!-- DECK_BUILDER_SECTION_END -->
