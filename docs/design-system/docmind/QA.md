# DocMind Paper & Ink QA Record

**Date:** 2026-11-07

**Branch:** `feature/paper-ink-redesign`, merged into `feature/frontend` at `f07c486`

**Spec:** `docs/design-system/docmind/MASTER.md`

**Plan:** `docs/superpowers/plans/2026-11-07-paper-ink-redesign.md`

## Automated Release Gates

| Check | Command | Result |
|---|---|---|
| Test suite | `npm test -- --run` | PASS â€” 12 files, 138 tests |
| Lint | `npm run lint` | PASS â€” no errors |
| Production build | `npm run build` | PASS â€” Vite 8.3.6, 53 modules |
| Static anti-drift scan | `npm test -- --run src/test/visual-system.test.jsx src/test/assets.test.jsx` | PASS â€” 61 tests |

## Browser QA

Executed against the production build (`vite preview`) in installed Google Chrome `157.0.8103.39` (headless), driven by `playwright-core`. The script ran **253 assertions; 253 passed**. Screenshots were captured for every route/viewport and spot-checked at 375, 1024, and 1440px. The check script and screenshots live in the execution environment, not the repository.

| Check | Result |
|---|---|
| 32 route renders across `/dashboard`, `/chat`, `/documents`, `/documents/doc-123`, `/upload`, `/settings`, `/signin`, `/signup` at 375, 768, 1024, and 1440px | PASS â€” no page horizontal overflow in any render |
| Header geometry | PASS â€” 64px high, 1px bottom rule, content starts at 64px at every width |
| Breakpoint switch at 1024px | PASS â€” three primary links visible at 1024/1440; compact trigger visible below 1024 |
| Header overlap | PASS â€” brand, nav, menu trigger, and profile button boxes do not overlap at any width |
| Profile menu | PASS â€” 288Ã—223 box inside the viewport at every width; exposes Upload document, Settings, Log out; Escape closes |
| Compact navigation | PASS â€” three links only; popover inside the viewport; Escape closes |
| 200% zoom (layout-equivalent 720Ã—450 CSS viewport) | PASS â€” no overflow on dashboard/chat/settings; compact nav active; profile menu fits |
| Keyboard traversal | PASS â€” 11 consecutive stops on Settings showed a visible â‰¥2px ring |
| Chat composer focus ring | PASS â€” wrapper resolves to 2px solid oxide `rgb(143, 46, 34)` |
| Reduced motion | PASS â€” menu animation/transition and control transitions computed to `0.00001s` |
| Forced colors | PASS â€” field wrapper keeps a 2px visible outline |
| Documents table | PASS â€” internal horizontal scroll at 375/768 (900px content) without widening the page; fits at 1024/1440 |
| Chat scroll ownership | PASS â€” composer reachable at 375 by native page scroll; composer inside viewport at 1024 (bottom 736/768) and 1440 (bottom 868/900) |
| Long values | PASS â€” long chat title truncates with ellipsis; storage path and long feedback email stay contained; no page overflow |
| Visual contrast | PASS â€” token ratios recomputed by tests; Chrome resolved the focus token to the documented oxide value |

**Limitations:** this was a scripted headless-Chrome pass, not a human aesthetic review on a physical display. OS-level display scaling above 100% was not exercised.

## Evidence Status

| Area | Evidence | Status |
|---|---|---|
| Horizontal header at 1024px+ | `shell.test.jsx` asserts the 64px horizontal banner, three primary links, hidden compact trigger at `lg`, and absence of sidebar classes; Chromium confirms geometry and non-overlap | Automated PASS |
| Compact navigation below 1024px | `shell.test.jsx` asserts the primary nav is `hidden lg:flex`, the menu trigger is `lg:hidden`, and its popover contains only Overview/Chat/Documents; Chromium confirms at 375/768/720 | Automated PASS |
| Profile-only Upload/Settings | `shell.test.jsx` asserts both are absent from primary and compact navigation and present in the profile menu; Chromium confirms at every width | Automated PASS |
| Menu dismissal | `shell.test.jsx` covers Escape and outside pointer dismissal; `chat.test.jsx` covers chat-menu Escape; Chromium confirms Escape at every width | Automated PASS |
| Shell offset | `visual-system.test.jsx` asserts `main` reserves `pt-16` and has no sidebar offset; Chromium confirms content starts at 64px | Automated PASS |
| Chat paper surfaces | `chat.test.jsx` and `visual-system.test.jsx` assert paper-muted questions with oxide rule, transparent answers, paper citations, and paper composer | Automated PASS |
| Icon color policy | `shell.test.jsx` and `chat.test.jsx` assert ink-gray inactive and oxide active icons | Automated PASS |
| Chat overflow ownership | `visual-system.test.jsx` asserts desktop page height, panel flex behavior, thread-only `lg:overflow-y-auto`, and no base nested scroll; Chromium confirms composer reachability | Automated PASS |
| Long values | `documents.test.jsx`, `chat.test.jsx`, and `upload-settings.test.jsx` assert truncate/wrap/min-width behavior; Chromium confirms with long interactive values at 375 | Automated PASS |
| Settings persistence and accessibility | `upload-settings.test.jsx` covers reload persistence, malformed/partial/unreadable storage, write failure/retry, Enter submit, live status, feedback clearing, and password visibility | Automated PASS |
| Empty/error/status states | `dashboard.test.jsx`, `documents.test.jsx`, `upload-settings.test.jsx`, `chat.test.jsx`, and `auth-session.test.jsx` cover empty, failed, processing, invalid-upload, not-found, deleted, save-success, and save-failure states | Automated PASS |
| Reduced motion and forced colors | `visual-system.test.jsx` asserts both media rules remain; Chromium confirms effective 0.01ms motion and a visible forced-colors outline | Automated PASS |
| Retired Figma asset removal | `assets.test.jsx` asserts the Figma SVG directory is empty; production JSX scan finds no Figma imports | Automated PASS |
| Contrast ratios | `visual-system.test.jsx` recomputes documented token contrast ratios | Automated PASS |
| 375/768/1024/1440px visual inspection | Chromium: 32 route renders, zero page overflow, screenshots captured | PASS |
| 200% zoom visual inspection | Chromium: 720Ã—450 CSS viewport, zero overflow, compact nav, menu fits | PASS |
| Pixel-level focus/menu placement | Chromium: header boxes non-overlapping, menus inside viewport, focus rings resolved and visible | PASS |

## Chromium Checklist (Executed)

- [x] `/dashboard`, `/chat`, `/documents`, `/documents/doc-123`, `/upload`, `/settings`, `/signin`, and `/signup` at 375, 768, 1024, and 1440px.
- [x] Header switches cleanly at 1024px; no logo/nav/profile overlap; no horizontal page overflow.
- [x] Profile menu opens within the viewport at every width and exposes Upload document, Settings, and Log out.
- [x] 200% zoom (layout-equivalent viewport): no clipped controls, hidden focus, or page overflow.
- [x] Keyboard-only traversal: visible, non-obscured 2px oxide focus ring on every control and link traversed.
- [x] `prefers-reduced-motion: reduce`: transitions effectively stop.
- [x] Documents table retains intentional horizontal scrolling without widening the page.
- [x] Chat: native page scroll below 1024px; message-thread scroll at 1024px+; composer remains reachable.
- [x] Long document name, chat title, source filename, feedback email, and storage path wrap or truncate locally.
- [x] Visual contrast of text, rules, status badges, active markers, and focus rings matches the documented ratios.
