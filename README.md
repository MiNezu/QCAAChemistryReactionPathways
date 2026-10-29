# Organic Chemistry Reaction Pathway Trainer

A lightweight, browser-based foundation for an organic chemistry learning tool. The current version focuses on the administrator workspace and chemistry-record infrastructure. **No chemistry examples or generated chemistry facts are included.** Entered content remains unverified until a human reviewer confirms it.

## Run locally

Requires Node.js 18+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. For a production build, run `npm run build`; preview it with `npm run preview`.

## Current functionality

- Navigation shell for Reaction Map, Reaction Practice, Pathway Builder and Admin. Student-facing sections are explicit placeholders.
- Admin record list, search, status/syllabus filters, create/edit/duplicate/delete and confirmation prompts.
- Structured reaction record fields, condition and catalyst applicability statuses, multiple alternative condition sets, text-only preview, and basic data validation.
- Local browser persistence, JSON export, and validated import preview with merge-by-ID. Invalid imports are rejected before changes are applied.
- Draft, Validated, Published, and Needs review states. Saved data is not represented as chemically validated; human review is essential.

## Data and privacy

The browser's `localStorage` is the sole storage for this prototype. Data is local to the current browser profile and does not sync to other devices. Export JSON backups regularly. The initial library is intentionally empty. The clear-library action requires confirmation; restoring the example library is unnecessary because no examples are bundled.

The record model and collection validator live in `src/model.js`; persistence is in `src/storage.js`; UI is in `src/main.js` and `src/style.css`. The versioned JSON export shape is `{ "version": 1, "records": [] }`.

## Limitations / next steps

No backend, authentication, sync, structural chemistry renderer, molecular correctness checker, question generator, pathway solver, or student workflows are implemented. Automated validation checks data shape only; it cannot establish chemical correctness. Records should be independently checked by a qualified human before publication or educational use.
