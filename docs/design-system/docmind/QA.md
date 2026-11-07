# DocMind Paper & Ink QA Record

**Date:** 2026-11-07

**Branch:** `feature/paper-ink-redesign`

**Spec:** `docs/design-system/docmind/MASTER.md`

**Plan:** `docs/superpowers/plans/2026-11-07-paper-ink-redesign.md`

## Automated Release Gates

| Check | Command | Result |
|---|---|---|
| Test suite | `npm test -- --run` | PASS — 12 files, 137 tests |
| Lint | `npm run lint` | PASS — no errors |
| Production build | `npm run build` | PASS — Vite 8.3.6, 53 modules |
| Static anti-drift scan | `npm test -- --run src/test/visual-system.test.jsx src/test/assets.test.jsx` | PASS — 60 tests |

## Evidence Status

| Area | Evidence | Status |
|---|---|---|
| Horizontal header at 1024px+ | `shell.test.jsx` asserts the 64px horizontal banner, three primary links, hidden compact trigger at `lg`, and absence of sidebar classes | Automated PASS |
| Compact navigation below 1024px | `shell.test.jsx` asserts the primary nav is `hidden lg:flex`, the menu trigger is `lg:hidden`, and its popover contains only Overview/Chat/Documents | Automated PASS |
| Profile-only Upload/Settings | `shell.test.jsx` asserts both are absent from primary and compact navigation and present in the profile menu | Automated PASS |
| Menu dismissal | `shell.test.jsx` covers Escape and outside pointer dismissal; `chat.test.jsx` covers chat-menu Escape | Automated PASS |
| Shell offset | `visual-system.test.jsx` asserts `main` reserves `pt-16` and has no sidebar offset | Automated PASS |
| Chat paper surfaces | `chat.test.jsx` and `visual-system.test.jsx` assert paper-muted questions with oxide rule, transparent answers, paper citations, and paper composer | Automated PASS |
| Icon color policy | `shell.test.jsx` and `chat.test.jsx` assert ink-gray inactive and oxide active icons | Automated PASS |
| Chat overflow ownership | `visual-system.test.jsx` asserts desktop page height, panel flex behavior, thread-only `lg:overflow-y-auto`, and no base nested scroll | Automated PASS |
| Long values | `documents.test.jsx`, `chat.test.jsx`, and `upload-settings.test.jsx` assert truncate/wrap/min-width behavior | Automated PASS |
| Settings persistence and accessibility | `upload-settings.test.jsx` covers reload persistence, malformed/partial/unreadable storage, write failure/retry, Enter submit, live status, feedback clearing, and password visibility | Automated PASS |
| Empty/error/status states | `dashboard.test.jsx`, `documents.test.jsx`, `upload-settings.test.jsx`, `chat.test.jsx`, and `auth-session.test.jsx` cover empty, failed, processing, invalid-upload, not-found, deleted, save-success, and save-failure states | Automated PASS |
| Reduced motion and forced colors | `visual-system.test.jsx` asserts both media rules remain | Automated PASS |
| Retired Figma asset removal | `assets.test.jsx` asserts the Figma SVG directory is empty; production JSX scan finds no Figma imports | Automated PASS |
| Contrast ratios | `visual-system.test.jsx` recomputes documented token contrast ratios | Automated PASS |
| 375/768/1024/1440px visual inspection | No interactive browser is available in this execution harness | NOT RUN — requires manual Chromium check |
| 200% zoom visual inspection | No interactive browser is available in this execution harness | NOT RUN — requires manual Chromium check |
| Pixel-level focus/menu placement | Class-level and behavior tests pass; visual placement is not observable in jsdom | NOT RUN — requires manual Chromium check |

## Required Manual Chromium Checklist

The following must be completed in a real browser against the redesign build before merge:

- [ ] `/dashboard`, `/chat`, `/documents`, `/documents/doc-123`, `/upload`, `/settings`, `/signin`, and `/signup` at 375, 768, 1024, and 1440px.
- [ ] Header switches cleanly at 1024px; no logo/nav/profile overlap; no horizontal page overflow.
- [ ] Profile menu opens above content at every width and exposes Upload document, Settings, and Log out.
- [ ] 200% browser zoom: no clipped controls, hidden focus, or page overflow.
- [ ] Keyboard-only traversal: visible, non-obscured 2px oxide focus ring on every control and link.
- [ ] `prefers-reduced-motion: reduce`: transitions effectively stop.
- [ ] Documents table retains intentional horizontal scrolling without widening the page.
- [ ] Chat: native page scroll below 1024px; message-thread scroll at 1024px+; composer remains reachable.
- [ ] Long document name, chat title, source filename, feedback email, and storage path wrap or truncate locally.
- [ ] Visual contrast of text, rules, status badges, active markers, and focus rings matches the documented ratios.
