# Security and Privacy

StudyHub is a static, local-first study application.

## User data

Core study data is intended to remain in the browser. Do not treat browser local storage as a secure vault or backup system.

Do not enter passwords, API keys, private employer data, regulated information, or other secrets into StudyHub notes, journals, imported topics, or decks.

## Reporting issues

If you find a security or privacy problem, avoid posting credentials, personal data, or exploit details in a public issue. Contact the repository owner privately when possible.

## Release expectations

Public release should include:

- dependency and secret scanning where applicable
- broken-link/static-asset validation
- WCAG checks
- production security-header verification
- mobile and desktop smoke tests
- documented local-storage/export behavior
