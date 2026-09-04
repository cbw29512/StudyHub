# StudyHub

StudyHub is a browser-based study workspace for certification prep, flashcards, notes, study sessions, journals, and learning projects. It is designed to stay lightweight: no account is required for the core experience and study data can remain in the browser.

## What it includes

- Certification-focused study dashboards
- Flashcards and custom deck building
- Fast topic import for creating study cards
- Study-session tracking
- Journal and notes workflows
- Learning-project tracking
- Local browser storage for user-created study data
- Static-site architecture that can be hosted without a backend

## Privacy model

StudyHub is intentionally local-first. Core study data is stored in the browser rather than sent to a StudyHub account or database. Clearing browser storage can remove locally saved data, so export anything you need to preserve.

Do not paste passwords, API keys, private employer information, regulated data, or other sensitive material into study notes or imported decks.

## Deck Builder

The Deck Builder lets you create study cards without hand-typing every card.

1. Open the **Cards** section.
2. Choose a certificate and domain.
3. Paste topics one per line.
4. Preview the generated cards.
5. Save them locally in the browser.
6. Export JSON when you want a portable deck file.

The certificate catalog is in `decks/cert-catalog.json` and the Deck Builder logic is in `js/deck-builder.js`.

## Current status

**Public beta / active development.** The application is useful now, but production hardening is still in progress. Before calling the project fully release-certified, the repository should have automated accessibility, broken-link, mobile/desktop performance, and production smoke gates.

## Public-release checklist

- No secrets or private study data committed to the repository
- Broken-link and static-asset validation
- WCAG accessibility checks
- Mobile and desktop regression tests
- Lighthouse performance/accessibility/best-practices/SEO checks
- Clear local-storage/export behavior
- Security-header verification on the production host
- Public deployment smoke test

## Support

If StudyHub is useful to you, you can support continued development here:

**Buy Me a Coffee:** https://buymeacoffee.com/divclass016

## Security

See `SECURITY.md` for the project security and privacy expectations.
