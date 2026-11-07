# Paper & Ink Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the complete DocMind frontend as a calm Paper & Ink document workspace while preserving every tested route, interaction, and prototype behavior.

**Architecture:** Build a three-layer token system and small shared UI primitives first, then migrate the responsive shell and each screen in dependency order. The approved 2026-11-07 amendment replaces the interim desktop sidebar with one horizontal header. React state/hooks and React Router behavior remain unchanged; visual code moves from raw Tailwind hex values and Figma SVGs to semantic tokens, shared components, one icon family, and a current-color brand mark.

**Tech Stack:** React 19, React Router 7, Tailwind CSS 4, Vite 8, Vitest 5, Testing Library

**Spec:** `docs/design-system/docmind/MASTER.md`

## Execution Preflight

**Execution status:** Tasks 1–5 are complete in commits `83a426a`, `c3a18f4`, `3ce12d8`, `98176de`, and `5dd4ecd`. The sidebar clauses recorded in completed Task 2 are historical and are explicitly superseded by the approved Task 6 header amendment. Resume execution at Task 6; only Tasks 6–9 remain active.

- Execute from an isolated project-local worktree created from `feature/frontend`; do not implement directly in the current working tree.
- Before Task 1, confirm the worktree starts from the commit containing this plan and `MASTER.md`.
- Run Git commands from the repository root.
- Run every `npm` command in this plan from `frontend/` (set the command working directory to `<worktree>/frontend`; do not rely on shell `cd` chaining).
- Record `git status --short` before each commit. Stage only the files named by that task, and verify `frontend/.opencode/` is never staged.
- Establish the execution baseline before editing:

```powershell
npm test -- --run
npm run lint
npm run build
```

Expected: 12 test files and 100 tests pass, lint succeeds, and the production build succeeds. If the baseline differs, stop and reconcile it before implementing the redesign.

## Standard Verification Gate

Unless a task gives a narrower focused command, run its listed focused tests first. At the end of **every** task, run these commands separately from `frontend/`:

```powershell
npm test -- --run
npm run lint
npm run build
```

Then perform the task's browser checks before committing. Do not claim a task is complete from focused tests alone.

## Global Constraints

- Canvas `#F4F1E8`, primary ink `#171610`, oxide accent `#B23A2B`; use the complete token tables in `MASTER.md`.
- Newsreader 500/600 for display headings, Inter 400/500/600 for UI/body, JetBrains Mono 400/500 for metadata; load with `display=swap`.
- Use 2px control/surface radius, 1px rules, no gradients, glow, glass blur, or elevation shadows.
- Use one inline, current-color icon family in `Icon.jsx`; add no icon or UI dependency.
- Minimum interactive size is 44px; auth controls are 48px.
- At 1024px and wider, use a horizontal header with DocMind left, Overview/Chat/Documents navigation, and profile right; below 1024px collapse those three links into the existing menu button. Upload and Settings remain in the profile menu only.
- Fields and the Chat composer use `#FFFDF7`; Chat questions use `#ECE7DA` plus an oxide rule; assistant answers are transparent; citation rows use warm-white `#FFFDF7`.
- Icons are ink gray by default and oxide `#B23A2B` when active/selected; no white or purple conversation icons.
- Use approved sentence case: `Sign in`, `Create account`, `Full name`, `Upload document`, `Change password`, `Save changes`, `Log out`.
- Preserve routes, auth/session behavior, hooks, test IDs, menu dismissal, chat behavior, document behavior, upload behavior, Settings storage key, and live feedback.
- Keep intentional Documents horizontal scrolling and Chat desktop thread scrolling; do not create other nested scrolling regions.
- Add no backend, chart library, browser-test dependency, or dark mode.
- `frontend/.opencode/` is local tooling: ignore it; never add its 175 files to product commits.
- Baseline before implementation: 12 test files, 100 tests passing.

## File Structure

### Shared foundations

- Modify `frontend/index.html`: fonts and paper theme color.
- Modify `frontend/public/favicon.svg`: Paper & Ink mark.
- Modify `frontend/src/index.css`: primitive → semantic → component tokens, base typography, focus, scrollbar, reduced motion.
- Modify `frontend/src/components/ui/Button.jsx`: shared button and link class API.
- Modify `frontend/src/components/ui/Icon.jsx`: complete one outline icon family.
- Modify `frontend/src/components/ui/PageHeading.jsx`: shared editorial page heading.
- Modify `frontend/src/components/ui/StatusBadge.jsx`: shared status treatment.
- Create `frontend/src/components/ui/BrandMark.jsx`: current-color open-book mark.
- Create `frontend/src/components/ui/Field.jsx`: labeled controlled field shell.
- Create `frontend/src/components/ui/Surface.jsx`: flat bordered containment.
- Create `frontend/src/components/ui/Rule.jsx`: horizontal/vertical hairline separator.

### Shell and screens

- Modify layout/auth files in place; do not add parallel old/new implementations.
- Modify each page in place so existing route imports stay stable.
- Keep `useChatPrototype.js` and `useDocumentsPrototype.js` behavior unchanged unless a test proves a visual integration needs a non-behavioral interface adjustment.

## Shared Interfaces

Task 1 must produce these APIs for all later tasks:

- `buttonClasses({ variant = 'primary', size = 'default', className = '' } = {}) -> string` and default `Button({ variant, size, className, ...buttonProps })`.
- Button variants: `primary`, `secondary`, `ghost`, `destructive`, `text`; sizes: `default` (44px), `large` (48px), `icon` (44×44px).
- `Icon({ name, size = 20, className = '' })`; every glyph uses the same 24×24, 1.75px outline contract.
- `BrandMark({ size = 24, className = '' })`.
- `Field({ id, label, error, helperText, leadingIcon, trailingControl, className = '', labelClassName = '', controlClassName = '', ...inputProps })`.
- `Surface({ as: Element = 'div', padding = 'standard', className = '', ...props })`; padding values `compact`, `standard`, `spacious`.
- `Rule({ orientation = 'horizontal', className = '', ...props })`.
- `StatusBadge({ children, tone = 'neutral' })`; tones `success`, `warning`, `danger`, `neutral`.

## Review Focus

- **Font/network failure:** system fallbacks must preserve readable hierarchy when Google Fonts are unavailable; Task 1 pins all three fallback stacks.
- **Effective narrow width/200% zoom:** shell must collapse primary links into the compact menu and never clip navigation or focus; Task 6 pins breakpoint classes and Task 9 manually verifies zoom.
- **Long names and citations:** long document names, chat titles, storage paths, and source filenames must wrap/truncate locally without page overflow; Tasks 4 and 7 retain/add long-value contracts.
- **Empty and failure states:** no documents, no chats, failed documents, invalid uploads, storage failures, and deleted/not-found documents must remain explicit; Tasks 4–8 pin their owning states.
- **Visual-system drift:** retired SVG imports, raw JSX hex values, purple/glow classes, gradients, and fake-chart labels must not re-enter production code; Task 9 performs static checks.

---

### Task 1: Build Paper & Ink foundations

**Files:**
- Modify: `.gitignore`
- Modify: `frontend/index.html`
- Modify: `frontend/public/favicon.svg`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/components/ui/Button.jsx`
- Modify: `frontend/src/components/ui/Icon.jsx`
- Modify: `frontend/src/components/ui/PageHeading.jsx`
- Modify: `frontend/src/components/ui/StatusBadge.jsx`
- Create: `frontend/src/components/ui/BrandMark.jsx`
- Create: `frontend/src/components/ui/Field.jsx`
- Create: `frontend/src/components/ui/Surface.jsx`
- Create: `frontend/src/components/ui/Rule.jsx`
- Modify: `frontend/src/test/visual-system.test.jsx`
- Modify: `frontend/src/test/assets.test.jsx`

**Interfaces:**
- Consumes: Tailwind 4 `@theme`, existing `Icon`, `Button`, `PageHeading`, and `StatusBadge` imports.
- Produces: every API in **Shared Interfaces**, plus semantic Tailwind names `canvas`, `surface`, `surface-muted`, `border`, `border-strong`, `text`, `text-secondary`, `text-muted`, `accent`, `accent-hover`, `focus`, `success`, `warning`, and `danger`.

- [ ] **Step 1: Write failing foundation token and font tests**

In `visual-system.test.jsx`, replace old dark/purple exact-color assertions with tests named:

- `defines the Paper & Ink primitive semantic and component token layers`: assert the exact paper/ink/oxide values, `--color-border-strong` mapping to `--paper-500`, and explicit primary active/destructive/disabled component aliases from `MASTER.md`.
- `loads the approved fonts with resilient fallbacks`: read `index.html` and `index.css`; assert one Google Fonts URL includes Newsreader, Inter, JetBrains Mono, and `display=swap`, while CSS contains the exact display/UI/mono fallback stacks.
- `keeps reduced motion and accessible native scrollbars`: preserve reduced-motion assertions; change scrollbar thumb/track expectations to Paper & Ink tokenized colors and verify at least 3:1 thumb contrast against canvas/surface.

- [ ] **Step 2: Write failing shared-component contracts**

Add tests that assert:

- Button variants/sizes use shared classes, default and icon sizes are at least 44px, and `buttonClasses` can style a React Router link.
- BrandMark is current-color, decorative, 24×24 by default, and accepts a size.
- all existing Icon names plus `bookOpen`, `dashboard`, `chat`, `documents`, `upload`, `settings`, `search`, `file`, `link`, `externalLink`, `download`, `refresh`, `edit`, `trash`, `chevronRight`, and `arrowRight` follow one 24×24/1.75px decorative SVG contract.
- Field links errors with `aria-describedby`, passes controlled input props, and leaves trailing icon buttons at 44px.
- Surface, Rule, PageHeading, and Badge expose the exact 2px/rule/type/status contracts.
- the new favicon contains no old purple hex values.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npm test -- --run src/test/visual-system.test.jsx src/test/assets.test.jsx`

Expected: FAIL because Paper & Ink tokens/components/fonts/mark do not exist and old asset assertions remain.

- [ ] **Step 4: Add repository hygiene and font loading**

Add `frontend/.opencode/` to `.gitignore`. In `index.html`, add Google Fonts preconnects, the approved combined font request, and theme color `#F4F1E8`. Replace `favicon.svg` with the open-book geometry and oxide/ink colors.

- [ ] **Step 5: Replace the global visual foundation**

Implement all primitive, semantic, component, type, spacing, radius, motion, focus, scrollbar, forced-colors, and reduced-motion tokens from `MASTER.md` in `index.css`. Keep `min-width: 320px`. Remove old purple/dark globals and encoded purple scrollbar arrows.

- [ ] **Step 6: Implement the shared component APIs**

Implement the exact APIs in **Shared Interfaces**. Keep components dependency-free and pass through native props. Expand `Icon.jsx` rather than mixing a second icon source.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run: `npm test -- --run src/test/visual-system.test.jsx src/test/assets.test.jsx`

Expected: PASS.

- [ ] **Step 8: Run full regression and build gates**

Run the **Standard Verification Gate** as separate commands from `frontend/`.

Expected: all existing behavior tests pass; visual tests may only change where this task intentionally changes shared foundations.

- [ ] **Step 9: Browser-smoke the foundation and commit**

Start the app in the worktree and inspect `/signin` and one authenticated route at 375px and 1440px. This is a smoke check, not final visual acceptance: verify the new canvas/type/focus tokens load, fallback-safe content remains readable, no content disappears, and no global horizontal overflow was introduced.

Then commit:

```bash
git add .gitignore frontend/index.html frontend/public/favicon.svg frontend/src/index.css frontend/src/components/ui frontend/src/test/visual-system.test.jsx frontend/src/test/assets.test.jsx
git commit -m "feat(frontend): add Paper and Ink foundations"
```

---

### Task 2: Redesign the responsive shell and authentication

**Files:**
- Modify: `frontend/src/components/layout/AppLayout.jsx`
- Modify: `frontend/src/components/layout/TopNav.jsx`
- Modify: `frontend/src/components/layout/ProfileMenu.jsx`
- Modify: `frontend/src/components/auth/AuthLayout.jsx`
- Modify: `frontend/src/components/auth/AuthField.jsx`
- Modify: `frontend/src/pages/SignInPage.jsx`
- Modify: `frontend/src/pages/SignUpPage.jsx`
- Modify: `frontend/src/test/shell.test.jsx`
- Modify: `frontend/src/test/auth-routes.test.jsx`
- Modify: `frontend/src/test/signin.test.jsx`
- Modify: `frontend/src/test/signup.test.jsx`
- Modify: `frontend/src/test/visual-system.test.jsx`
- Modify: `frontend/src/test/assets.test.jsx`

**Interfaces:**
- Consumes: Task 1 Button/buttonClasses, BrandMark, Field, Icon, Rule, Surface, tokens.
- Produces: a 240px desktop sidebar at `lg`/1024+, compact top bar below 1024px, unchanged route/menu/auth interfaces.

- [ ] **Step 1: Write failing shell contracts**

Update `shell.test.jsx` to assert visible links `Overview`, `Chat`, `Documents`, `Upload`, `Settings`; `/dashboard` remains the Overview target. Assert AppLayout has a 240px desktop shell, desktop navigation is hidden below `lg`, compact top bar is hidden at `lg`, and the current mobile popover still opens, selects, closes, and handles Escape/outside click. Preserve profile menu navigation and logout tests with sentence-case names.

- [ ] **Step 2: Write failing auth visual/copy contracts**

Update auth and visual tests to assert:

- “Your documents, read closely.” and the exact supporting sentence.
- sentence-case `Sign in`, `Create account`, `Full name` and existing field meanings.
- no decorative circles, gradients, dark panels, or old logo SVG imports.
- auth form validation, values, toggles, route-state success, demo credentials, and 48px submit controls remain unchanged.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npm test -- --run src/test/shell.test.jsx src/test/auth-routes.test.jsx src/test/signin.test.jsx src/test/signup.test.jsx src/test/visual-system.test.jsx src/test/assets.test.jsx`

Expected: FAIL on old top navigation, title case, circles, gradients, and Figma assets.

- [ ] **Step 4: Implement the responsive shell**

Remove ambient SVGs from AppLayout. Refactor TopNav into the responsive shell without changing its export: sidebar at 1024px+, 64px top bar below, current anchored mobile popover, account control at the sidebar bottom, and active 2px oxide rule. Use shared icons/BrandMark/Button classes. Keep AppLayout's `<main><Outlet /></main>` route composition.

- [ ] **Step 5: Migrate ProfileMenu**

Use shared Menu/Button/Icon treatments, sentence-case `Upload document` and `Log out`, opaque paper surface, no shadow. Preserve name/email, links, logout, Escape, outside click, and current menu roles.

- [ ] **Step 6: Migrate authentication**

Build the opening-spread layout and exact approved copy. Use Field/Button/BrandMark/Rule, remove old Figma icon and circles, preserve validation/state logic, and update only visible casing—not field meaning or auth behavior.

- [ ] **Step 7: Run focused and full verification**

Run the focused command from Step 3, then the **Standard Verification Gate**.

Expected: all pass.

- [ ] **Step 8: Browser-check shell/auth**

Manually verify 375, 768, 1024, and 1440px: correct shell switch, no page overflow, menus above content, 44/48px controls, keyboard focus visible, auth columns stack, and no clipped text.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/components/layout frontend/src/components/auth frontend/src/pages/SignInPage.jsx frontend/src/pages/SignUpPage.jsx frontend/src/test
git commit -m "feat(frontend): redesign Paper and Ink shell and auth"
```

---

### Task 3: Replace the dashboard with the Overview workspace

**Files:**
- Modify: `frontend/src/pages/DashboardPage.jsx`
- Modify: `frontend/src/data/mockData.js` only if removing unused dashboard change/day data is necessary
- Modify: `frontend/src/test/dashboard.test.jsx`
- Modify: `frontend/src/test/visual-system.test.jsx`

**Interfaces:**
- Consumes: PageHeading, Button/buttonClasses, Icon, Rule, Surface, tokens, `dashboardMetrics`, `recentChats`.
- Produces: data strip, semantic `/chat` CTA, linked recent conversations, library summary; no chart.

- [ ] **Step 1: Write failing Overview tests**

Change `dashboard.test.jsx` to assert:

- heading/subtitle and values `12`, `28`, `146`, `82 MB` remain.
- no `Chat Activity`, weekday labels, axis labels, or percentage deltas exist.
- “Ask your documents anything…” is a link to `/chat`.
- recent titles render as numbered links to `/chat`.
- Library includes `12 documents`, `82 MB`, latest upload context, and a `/documents` link.

Update visual tests to assert one ruled data strip and no set of four rounded metric cards.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run src/test/dashboard.test.jsx src/test/visual-system.test.jsx`

Expected: FAIL because the fake chart and cards still exist.

- [ ] **Step 3: Implement Overview**

Use the exact five-part Dashboard specification in `MASTER.md`. Keep current mock values, remove unused `days`, `levels`, and mock deltas from rendered output. Do not create an editable ask field.

- [ ] **Step 4: Run focused/full tests, lint, and build**

Run the focused command from Step 2, then the **Standard Verification Gate**. Expected: PASS.

- [ ] **Step 5: Browser-check and commit**

Verify stacking and readable rules at all four widths. Commit:

```bash
git add frontend/src/pages/DashboardPage.jsx frontend/src/data/mockData.js frontend/src/test/dashboard.test.jsx frontend/src/test/visual-system.test.jsx
git commit -m "feat(frontend): redesign Paper and Ink overview"
```

---

### Task 4: Redesign Documents and document details

**Files:**
- Modify: `frontend/src/pages/DocumentsPage.jsx`
- Modify: `frontend/src/components/documents/DocumentRow.jsx`
- Modify: `frontend/src/pages/DocumentDetailsPage.jsx`
- Modify: `frontend/src/components/documents/DocumentActions.jsx`
- Modify: `frontend/src/test/documents.test.jsx`
- Modify: `frontend/src/test/assets.test.jsx`
- Modify: `frontend/src/test/visual-system.test.jsx`

**Interfaces:**
- Consumes: shared Button/buttonClasses, Field, Icon, Menu treatment, PageHeading, Rule, StatusBadge, Surface.
- Produces: ruled document index, standardized metadata details, shared action menu; hook interface unchanged.

- [ ] **Step 1: Write failing document visual/system tests**

Assert semantic/index structure, shared search Field, sentence-case `Upload document`, unified icons, mono metadata, 24px status badges, 52px rows, and preserved `.table-scroll`. Add a long document filename fixture/assertion proving local truncate/wrap classes and no fixed-width name overflow. Replace Figma asset expectations.

- [ ] **Step 2: Preserve and extend behavior contracts**

Keep all existing search/detail/action/mutation assertions. Add explicit checks for Ready, Processing, and Failed text (not color-only), not-found/deleted states, and long storage-path wrapping.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npm test -- --run src/test/documents.test.jsx src/test/assets.test.jsx src/test/visual-system.test.jsx`

Expected: FAIL on old grid cards/Figma icons/title case.

- [ ] **Step 4: Implement Documents list and row**

Build the toolbar and ruled index/table from `MASTER.md`; use shared fields/icons/badges and preserve the intentional horizontal scroller, search state, row routes, and metadata.

- [ ] **Step 5: Implement details and actions**

Replace icon tile/accent underline/card with ruled header and definition-list index. Migrate actions to shared menu styles/icons/buttons while preserving callbacks and feedback.

- [ ] **Step 6: Run focused/full tests, lint, build, and browser checks**

Run the focused command from Step 3, then the **Standard Verification Gate**. Verify 375/768 table scrolling, menu placement, long names/paths, all statuses, not-found/deleted states, and desktop definition layout.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/DocumentsPage.jsx frontend/src/pages/DocumentDetailsPage.jsx frontend/src/components/documents frontend/src/test
git commit -m "feat(frontend): redesign Paper and Ink documents"
```

---

### Task 5: Redesign Upload

**Files:**
- Modify: `frontend/src/pages/UploadPage.jsx`
- Modify: `frontend/src/test/upload-settings.test.jsx`
- Modify: `frontend/src/test/assets.test.jsx`
- Modify: `frontend/src/test/visual-system.test.jsx`

**Interfaces:**
- Consumes: Button styles, Icon, PageHeading, Rule, StatusBadge, Surface.
- Produces: paper-inbox drop area and ruled recent-upload list; existing `addUpload(file)` contract unchanged.

- [ ] **Step 1: Write failing Upload design contracts**

Assert left-aligned PageHeading, dashed strong drop boundary, shared upload/file icons, sentence-case `Choose file`, shared Ready/Processing badges, no rounded card/shadow/Figma asset imports, and existing test IDs.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run src/test/upload-settings.test.jsx src/test/assets.test.jsx src/test/visual-system.test.jsx`

- [ ] **Step 3: Implement Upload migration**

Keep `processFile`, drag handlers, timer cleanup, accepted extensions, errors, and test IDs unchanged. Replace only composition/styling/assets with shared primitives.

- [ ] **Step 4: Run focused/full tests, lint, build, and browser checks**

Run the focused command from Step 2, then the **Standard Verification Gate**. Verify invalid/empty files, PDF Processing→Ready, drag-active styling, long filenames, and stacked mobile layout.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/UploadPage.jsx frontend/src/test/upload-settings.test.jsx frontend/src/test/assets.test.jsx frontend/src/test/visual-system.test.jsx
git commit -m "feat(frontend): redesign Paper and Ink upload"
```

---

### Task 6: Replace the interim sidebar with the approved horizontal header

**Files:**
- Modify: `frontend/src/components/layout/AppLayout.jsx`
- Modify: `frontend/src/components/layout/TopNav.jsx`
- Modify: `frontend/src/components/layout/ProfileMenu.jsx`
- Modify: `frontend/src/test/shell.test.jsx`
- Modify: `frontend/src/test/visual-system.test.jsx`

**Interfaces:**
- Consumes: BrandMark, Icon, ProfileMenu, semantic Paper & Ink tokens, existing route and menu state.
- Produces: a 64px horizontal header at every width; desktop primary navigation at `lg`/1024+; existing menu-button navigation below `lg`; unchanged profile-menu routes and logout behavior.

- [ ] **Step 1: Write failing horizontal-header contracts**

In `shell.test.jsx`, replace sidebar assertions with exact contracts:

- the banner is horizontal and 64px high, uses a bottom rule, and has no desktop width/fixed-sidebar class;
- DocMind links to `/dashboard`; desktop primary navigation contains only Overview, Chat, and Documents;
- Upload and Settings are absent from primary navigation and remain available in the profile menu as Upload document and Settings;
- desktop links are hidden below `lg`; the existing menu button is hidden at `lg` and its popover contains only Overview, Chat, and Documents;
- active navigation uses an oxide bottom rule/icon rather than a left rule, filled pill, white icon, or purple icon;
- menu selection, Escape dismissal, outside-click dismissal, profile navigation, and Log out still work.

Update `visual-system.test.jsx` to assert `AppLayout` reserves 64px above main content at all widths and no longer reserves `lg:pl-60`.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run src/test/shell.test.jsx src/test/visual-system.test.jsx`

Expected: FAIL because the current desktop shell is a fixed 240px sidebar and exposes Upload/Settings as primary links.

- [ ] **Step 3: Implement the header without changing behavior**

Refactor `TopNav.jsx` in place. Keep its existing state, Escape listener, outside-click handling, `NavLink` routes, and `ProfileMenu` composition. Render BrandMark/DocMind left, Overview/Chat/Documents horizontally at `lg` and wider, and profile right. Below `lg`, retain the existing menu button and anchored panel for those same three links. Use ink-gray icons by default and oxide icons/underline for the active route. Remove Upload/Settings from `navItems`.

Update `ProfileMenu.jsx` positioning for a top-right header anchor at every width; retain Upload document, Settings, and Log out. Update `AppLayout.jsx` from sidebar offset to a consistent 64px header offset.

- [ ] **Step 4: Run focused and full verification**

Run the focused command from Step 2, then the **Standard Verification Gate**. Expected: PASS.

- [ ] **Step 5: Browser-check and commit**

Verify 375, 768, 1024, and 1440px plus 200% zoom: correct breakpoint switch, no overlap/overflow, visible focus, active state, both menus above content, and profile actions reachable.

```bash
git add frontend/src/components/layout/AppLayout.jsx frontend/src/components/layout/TopNav.jsx frontend/src/components/layout/ProfileMenu.jsx frontend/src/test/shell.test.jsx frontend/src/test/visual-system.test.jsx
git commit -m "feat(frontend): add horizontal application header"
```

---

### Task 7: Redesign Chat as an index and reading pane

**Files:**
- Modify: `frontend/src/pages/ChatPage.jsx`
- Modify: `frontend/src/test/chat.test.jsx`
- Modify: `frontend/src/test/assets.test.jsx`
- Modify: `frontend/src/test/visual-system.test.jsx`

**Interfaces:**
- Consumes: Button/buttonClasses, Icon, Rule, semantic field/menu tokens.
- Produces: Paper & Ink conversation index, transparent reading pane, paper question/composer surfaces, ruled citations; `useChatPrototype` interface unchanged.

- [ ] **Step 1: Write failing Chat visual and color contracts**

Update tests to assert numbered conversation rows, a slim oxide active rule/icon, ink-gray inactive icons, and no Figma conversation/avatar/assistant/source/action artwork. Assert user questions use `bg-surface-muted` (`#ECE7DA`) with an oxide left border, assistant answer text has a transparent background and readable maximum measure, citation rows use `bg-surface` (`#FFFDF7`) plus rules, and the composer uses `bg-surface`. Assert no navy, purple, white conversation icon, rounded bubble, gradient, glass, or decorative-shadow classes remain.

- [ ] **Step 2: Preserve behavior, long-value, and overflow contracts**

Keep all current select/create/rename/delete/Escape/whitespace/send/independent-disclosure tests. Add a long conversation/source assertion proving `min-w-0` plus truncate/wrap behavior. Update the desktop height contract for the new 64px header while preserving `chat-page`/`chat-panel`/`chat-thread` overflow ownership and mobile native page scrolling.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npm test -- --run src/test/chat.test.jsx src/test/assets.test.jsx src/test/visual-system.test.jsx`

Expected: FAIL on legacy Figma artwork, raw navy/purple values, dark message/citation/composer surfaces, and old bubble styling.

- [ ] **Step 4: Implement Chat migration**

Change composition/styling/assets in `ChatPage.jsx` only. Use shared `Icon` glyphs for conversation, edit, delete, source, external-link, and controls. Preserve every handler and state transition: select, create, rename Enter/blur/Escape, delete fallback, action-menu Escape, whitespace rejection, question/answer append, and independent citation disclosure.

- [ ] **Step 5: Run focused/full tests, lint, build, and browser checks**

Run the focused command from Step 3, then the **Standard Verification Gate**. Verify long threads and scrollbars, 375px native page scroll, 1024px internal thread scroll below the header, keyboard rename/menu/source behavior, long values, active icon color, and citation readability.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/ChatPage.jsx frontend/src/test/chat.test.jsx frontend/src/test/assets.test.jsx frontend/src/test/visual-system.test.jsx
git commit -m "feat(frontend): redesign Paper and Ink chat"
```

---

### Task 8: Redesign Settings without changing persistence

**Files:**
- Modify: `frontend/src/pages/SettingsPage.jsx`
- Modify: `frontend/src/test/upload-settings.test.jsx`
- Modify: `frontend/src/test/visual-system.test.jsx`

**Interfaces:**
- Consumes: Button, Field, Icon, Rule, status tokens.
- Produces: ruled account section with paper fields; storage key and reader/save behavior unchanged.

- [ ] **Step 1: Write failing Settings visual contracts**

Assert sentence-case `Change password` and `Save changes`, shared Field/Button/Icon use, paper-0 field backgrounds (`bg-surface`), ink-gray default icons with oxide focus/active treatment, 480px desktop control column, full-width 320/375 controls, no dark Surface card/navy button, and 44px controls.

- [ ] **Step 2: Keep persistence/accessibility contracts intact**

Do not weaken tests for all-field persistence, malformed/partial/unreadable storage, write failure/retry, Enter submit, persistent live status, stale-feedback clearing, password visibility, or Change password feedback. Update only visible label casing and visual assertions.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npm test -- --run src/test/upload-settings.test.jsx src/test/visual-system.test.jsx`

Expected: FAIL on raw navy fields/buttons, legacy classes, and title-case actions.

- [ ] **Step 4: Implement Settings migration**

Use a ruled section with shared fields/buttons/status styling. Keep `SETTINGS_STORAGE_KEY`, `DEFAULT_ACCOUNT`, `readAccountSettings`, state, handlers, storage error handling, and live-region lifecycle unchanged.

- [ ] **Step 5: Run focused/full tests, lint, build, and browser checks**

Run the focused command from Step 3, then the **Standard Verification Gate**. Verify persistence after reload, success/failure announcements, password toggle, Enter submission, 480px desktop controls, full-width 320/375 controls, long values, and no overflow.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/SettingsPage.jsx frontend/src/test/upload-settings.test.jsx frontend/src/test/visual-system.test.jsx
git commit -m "feat(frontend): redesign Paper and Ink settings"
```

---

### Task 9: Remove legacy visual drift and complete QA

**Files:**
- Modify: any production/test file still importing retired `frontend/src/assets/figma/*.svg`
- Delete: only SVG files proven unused after all import removal
- Modify: `frontend/src/test/visual-system.test.jsx`
- Modify: `frontend/src/test/assets.test.jsx`
- Create: `docs/design-system/docmind/QA.md`

**Interfaces:**
- Consumes: the fully migrated Paper & Ink app.
- Produces: clean production asset graph, static anti-drift tests, completed manual QA record.

- [ ] **Step 1: Write failing anti-drift tests**

Add filesystem-backed tests that scan production `.jsx` files and assert:

- no raw six-digit hex values;
- no navy/blue/purple palette value, `bg-gradient`, `shadow-2xl`, glass/blur treatment, ambient SVG import, or retired Figma UI SVG import;
- no `Chat Activity`, weekday chart labels, or mock percentage deltas;
- no old purple palette values in `index.css`, `index.html`, or favicon;
- Button is imported/used outside its own file;
- reduced-motion and forced-colors rules remain.

Also assert primary navigation contains only Overview/Chat/Documents, Upload/Settings remain in the profile menu, fields/composer/citations use paper surfaces, questions use muted paper plus oxide rule, assistant answers are transparent, and default/active icon colors follow ink/oxide policy.

- [ ] **Step 2: Run static tests and verify RED if drift remains**

Run: `npm test -- --run src/test/visual-system.test.jsx src/test/assets.test.jsx`

Expected: FAIL only for concrete leftovers found by the scan; if already green, record that prior tasks removed all drift and do not manufacture a failure.

- [ ] **Step 3: Remove proven-unused legacy imports/assets**

Use repository search before every deletion. Remove only assets with zero production/test imports. Do not delete unrelated user files or local `.opencode` tooling.

- [ ] **Step 4: Run automated release gates**

Run the **Standard Verification Gate** from `frontend/`:

```bash
npm test -- --run
npm run lint
npm run build
```

Expected: all tests pass, lint reports no errors, production build succeeds.

- [ ] **Step 5: Complete manual browser QA and save evidence**

Create `docs/design-system/docmind/QA.md` with pass/fail notes for:

- 375, 768, 1024, 1440px on every route, including the header breakpoint and profile-only Upload/Settings access;
- 200% browser zoom;
- keyboard-only navigation and visible/non-obscured focus;
- reduced-motion emulation;
- menu Escape/outside click/focus usability;
- Documents horizontal scroll and Chat desktop/mobile scroll ownership;
- empty, failed, processing, not-found, deleted, invalid-upload, save-success, and save-failure states;
- contrast checks for text, controls, statuses, and focus;
- long document/chat/source/storage values.

Fix every confirmed defect, add a regression test where practical, and rerun Step 4 after the final fix.

- [ ] **Step 6: Commit**

```bash
git add docs/design-system/docmind/QA.md frontend/src frontend/public/favicon.svg frontend/index.html
git add -u frontend/src/assets/figma
git commit -m "chore(frontend): complete Paper and Ink QA"
```

Before committing, inspect `git diff --cached --name-only` and remove anything outside the intended frontend redesign and QA record. In particular, `frontend/.opencode/` must not appear.

## Final Review and Integration

- Request one fresh whole-branch code/design review against `MASTER.md` and this plan.
- Fix every Critical/Important issue with a failing regression test where practical.
- Rerun tests, lint, build, and affected browser checks after review fixes.
- Merge into `feature/frontend` only after the branch is clean and evidence is current.
- Push only after the user chooses the branch-completion option.
