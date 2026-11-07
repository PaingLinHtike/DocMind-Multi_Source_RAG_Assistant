# DocMind Figma Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the eight-state DocMind Figma prototype as a responsive, frontend-only React application with simulated interactions.

**Architecture:** Extend the existing Vite application in place: `src/main.jsx` remains the browser entry, `src/App.jsx` owns route composition, and `src/index.css` remains the single global Tailwind/token stylesheet. React Router provides addressable screens, focused hooks provide mock chat/document behavior, and shared layout/UI components compose six routes; the two remaining Figma frames are open-menu states on their owning routes.

**Tech Stack:** Existing React 19.3.1, Vite 8.3.6, Tailwind CSS 4.3.4 with `@tailwindcss/vite`, JavaScript, React Router, Vitest, React Testing Library, user-event, ESLint

**Spec:** `docs/superpowers/specs/2026-11-05-docmind-figma-frontend-design.md`

## Global Constraints

- Implement in the existing `frontend/` Vite scaffold; do not create a second `src/app` root or replace the project wholesale.
- Preserve `package-lock.json` and update it through npm. Do not recreate the currently deleted tracked `frontend/.env` or expose secrets.
- Reuse `src/App.jsx`, `src/main.jsx`, and `src/index.css` as the canonical application files.
- Use Vite + React + Tailwind CSS and JavaScript, not TypeScript.
- Implement Dashboard, Chat, Documents, Document details, Document actions open, Upload document, Settings, and Profile menu open.
- Use simulated local interactions only; do not add Laravel, FastAPI, authentication, persistence, upload, retrieval, or LLM requests.
- Match the supplied 1440×810 Figma frames before adapting them for narrower viewports.
- Download every visible Figma asset to `frontend/src/assets/figma/`; no temporary Figma MCP URL may remain in runtime code.
- Do not add a UI component library or invent product flows absent from Figma.
- Use semantic controls, keyboard operation, visible focus states, and Escape/outside-click menu dismissal.

## Review Focus

- Empty or whitespace-only chat submissions must not create messages or assistant replies; Task 3 pins this behavior.
- Unsupported or empty uploads must show local validation and must not add recent-upload entries; Task 5 pins this behavior.
- Search must be case-insensitive and a zero-match query must render an intentional empty state; Task 4 pins this behavior.
- Open menus must close on Escape and outside click without triggering the underlying action; Tasks 2 and 4 pin this behavior.
- Narrow screens must not cause page-level horizontal overflow; Task 7 pins this with a browser-size verification.

---

## Planned file structure

```text
frontend/
  index.html                       existing Vite entry document, update title/favicon
  package.json                     existing scripts/dependencies, add router and tests
  package-lock.json                existing npm lockfile, update through npm
  vite.config.js                   existing config, add Tailwind and Vitest
  eslint.config.js                 existing lint config, extend for tests
  public/favicon.svg               replace starter favicon with DocMind asset
  src/
    main.jsx                       existing React root; add BrowserRouter
    App.jsx                        replace starter UI with routes
    index.css                      replace starter CSS with Tailwind import/tokens
    assets/figma/*.svg             downloaded Figma assets
    data/mockData.js               user, metrics, chats, and documents
    hooks/useChatPrototype.js      local conversation behavior
    hooks/useDocumentsPrototype.js filtering/upload/local actions
    components/layout/AppLayout.jsx shared ambient shell and route outlet
    components/layout/TopNav.jsx   brand, routes, profile trigger
    components/layout/ProfileMenu.jsx profile-state overlay
    components/ui/Button.jsx       primary/secondary button variants
    components/ui/StatusBadge.jsx  type/status/progress pills
    components/ui/PageHeading.jsx  title/subtitle pair
    components/documents/DocumentRow.jsx responsive document record
    components/documents/DocumentActions.jsx details action overlay
    pages/DashboardPage.jsx
    pages/ChatPage.jsx
    pages/DocumentsPage.jsx
    pages/DocumentDetailsPage.jsx
    pages/UploadPage.jsx
    pages/SettingsPage.jsx
    test/setup.js
    test/renderApp.jsx              memory-router test helper
    test/shell.test.jsx
    test/dashboard.test.jsx
    test/chat.test.jsx
    test/documents.test.jsx
    test/upload-settings.test.jsx
  Delete after replacement:
    src/App.css                     Vite starter-only styles
    src/assets/hero.png             Vite starter artwork
    src/assets/react.svg            Vite starter artwork
    src/assets/vite.svg             Vite starter artwork
    public/icons.svg                Vite starter sprite
```

### Task 1: Convert the existing Vite starter into the tested DocMind shell

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/index.html`
- Modify: `frontend/vite.config.js`
- Modify: `frontend/eslint.config.js`
- Modify: `frontend/src/main.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/index.css`
- Create: `frontend/src/components/layout/AppLayout.jsx`
- Create: `frontend/src/components/layout/TopNav.jsx`
- Create: `frontend/src/components/layout/ProfileMenu.jsx`
- Create: `frontend/src/components/ui/Button.jsx`
- Create: `frontend/src/components/ui/StatusBadge.jsx`
- Create: `frontend/src/components/ui/PageHeading.jsx`
- Create: `frontend/src/test/setup.js`
- Create: `frontend/src/test/renderApp.jsx`
- Test: `frontend/src/test/shell.test.jsx`
- Delete: `frontend/src/App.css`
- Delete: `frontend/src/assets/hero.png`
- Delete: `frontend/src/assets/react.svg`
- Delete: `frontend/src/assets/vite.svg`
- Delete: `frontend/public/icons.svg`

**Interfaces:**
- Consumes: existing Vite files, approved design spec, and Figma frame `2:2` shell measurements/assets.
- Produces: `App()`, `AppLayout()`, `TopNav()`, `ProfileMenu({ onClose })`, `Button({ variant, ...props })`, `StatusBadge({ tone, children })`, `PageHeading({ title, subtitle })`, and `renderApp({ route })`.

- [ ] **Step 1: Add only the missing router and test dependencies**

Keep the installed React, Vite, Tailwind, and ESLint versions. Install `react-router-dom`; install Vitest/jsdom, Testing Library, jest-dom, and user-event as development dependencies; add a `test` script. Update `package-lock.json` through npm.

- [ ] **Step 2: Write the failing shell tests**

In `shell.test.jsx`, assert that rendering `/` shows `DocMind`, Dashboard/Chat/Documents links, and the profile button; clicking the profile button shows Aung, `aung@example.com`, Upload Document, Settings, and Log Out; Escape closes the menu; route-link clicks update the visible placeholder page.

- [ ] **Step 3: Run the shell test to verify failure**

Run: `npm test -- --run src/test/shell.test.jsx`

Expected: FAIL because `App`, routing, and shell components do not exist.

- [ ] **Step 4: Replace the starter UI with the minimal application shell**

Add `tailwindcss()` to the existing Vite plugins, configure Vitest in `vite.config.js`, wrap `App` in `BrowserRouter` from `main.jsx`, and replace `App.jsx` with nested routes under `AppLayout`. Replace `index.css` with the Tailwind import, Inter setup, and Figma tokens (`#0c1429`, `#19223a`, `#384565`, `#4931a6`, `#765cf1`, `#13a88d`, `#f8fafc`, `#b6bed7`). Remove only the verified Vite starter CSS/assets listed above.

- [ ] **Step 5: Run shell tests and lint**

Run: `npm test -- --run src/test/shell.test.jsx`

Expected: PASS.

Run: `npm run lint`

Expected: exit 0.

- [ ] **Step 6: Commit the scaffold**

```bash
git add frontend
git commit -m "feat(frontend): scaffold DocMind React shell"
```

### Task 2: Implement the Dashboard and profile-menu Figma states

**Files:**
- Create: `frontend/src/data/mockData.js`
- Create: `frontend/src/pages/DashboardPage.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/layout/TopNav.jsx`
- Modify: `frontend/src/components/layout/ProfileMenu.jsx`
- Test: `frontend/src/test/dashboard.test.jsx`

**Interfaces:**
- Consumes: Task 1 shell/UI components.
- Produces: `dashboardMetrics`, `recentChats`, `DashboardPage()`, and a profile menu whose navigation actions target `/upload` and `/settings`.

- [ ] **Step 1: Write the failing Dashboard tests**

Assert exact greeting/subtitle copy; metrics `12`, `28`, `146`, `82 MB`; growth pills `+20%`, `+17%`, `+32%`; all seven weekday labels; and three recent chats. Assert that Profile → Settings navigates to `/settings`, Profile → Upload Document navigates to `/upload`, and outside click closes the menu.

- [ ] **Step 2: Run the Dashboard tests to verify failure**

Run: `npm test -- --run src/test/dashboard.test.jsx`

Expected: FAIL because the Dashboard content and mock data are absent.

- [ ] **Step 3: Implement the Dashboard composition**

Build the heading, four responsive metric cards, 850:409 desktop activity/recent-chat grid, empty chart grid with weekday/y-axis labels, and profile navigation. Match frame `2:2` at 1440×810 and frame `2:142` when the profile menu is open.

- [ ] **Step 4: Run Dashboard and shell tests**

Run: `npm test -- --run src/test/dashboard.test.jsx src/test/shell.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit the Dashboard**

```bash
git add frontend/src
git commit -m "feat(frontend): add DocMind dashboard"
```

### Task 3: Implement simulated chat behavior and citations

**Files:**
- Create: `frontend/src/hooks/useChatPrototype.js`
- Create: `frontend/src/pages/ChatPage.jsx`
- Modify: `frontend/src/data/mockData.js`
- Modify: `frontend/src/App.jsx`
- Test: `frontend/src/test/chat.test.jsx`

**Interfaces:**
- Consumes: shell/UI components and `recentChats` from Task 2.
- Produces: `chatConversations`, `useChatPrototype()` returning `{ conversations, activeConversation, selectConversation(id), createConversation(), sendQuestion(text) }`, and `ChatPage()`.

- [ ] **Step 1: Write the failing chat tests**

Assert five recent conversation titles, active `Annual leave policy`, exact user question, assistant answer, `Sources (1)`, `Employee Handbook.pdf`, and `Page 17`. Assert selecting another chat changes the heading; New Chat creates a blank active chat; whitespace submission adds nothing; valid submission adds the user text and a simulated assistant response with one citation.

- [ ] **Step 2: Run chat tests to verify failure**

Run: `npm test -- --run src/test/chat.test.jsx`

Expected: FAIL because the chat hook and page do not exist.

- [ ] **Step 3: Implement chat state and page**

Match frame `2:22`: desktop sidebar divider, conversation list, message bubbles, assistant/source icons, citation card, timestamp, and bottom composer. Use a real form, controlled input, and local-only deterministic assistant response.

- [ ] **Step 4: Run chat tests**

Run: `npm test -- --run src/test/chat.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit chat**

```bash
git add frontend/src
git commit -m "feat(frontend): add simulated cited chat"
```

### Task 4: Implement Documents, details, and actions states

**Files:**
- Create: `frontend/src/components/documents/DocumentRow.jsx`
- Create: `frontend/src/components/documents/DocumentActions.jsx`
- Create: `frontend/src/hooks/useDocumentsPrototype.js`
- Create: `frontend/src/pages/DocumentsPage.jsx`
- Create: `frontend/src/pages/DocumentDetailsPage.jsx`
- Modify: `frontend/src/data/mockData.js`
- Modify: `frontend/src/App.jsx`
- Test: `frontend/src/test/documents.test.jsx`

**Interfaces:**
- Consumes: Task 1 UI components and router.
- Produces: `documents`, `useDocumentsPrototype()` returning `{ documents, query, setQuery, filteredDocuments, addUpload(file), reindex(id), rename(id, name), remove(id) }`, `DocumentRow({ document })`, `DocumentActions({ document, onClose, onReindex, onRename, onDelete })`, `DocumentsPage()`, and `DocumentDetailsPage()`.

- [ ] **Step 1: Write the failing document tests**

Assert all four Figma rows and their PDF/DOCX/WEB, Ready/Processing/Failed, chunks, and timestamps. Assert case-insensitive search, intentional zero-result copy, row navigation to `/documents/doc-123`, exact details metadata, Actions menu items, Escape/outside-click dismissal, and local Reindex/Rename/Delete feedback without network calls.

- [ ] **Step 2: Run document tests to verify failure**

Run: `npm test -- --run src/test/documents.test.jsx`

Expected: FAIL because document state/pages are absent.

- [ ] **Step 3: Implement the Documents list**

Match frame `2:42`: title/subtitle, 1035:223 desktop search/upload row, table header, row spacing, glyphs, status pills, and dividers. Route Upload Document to `/upload` and rows to their details URL.

- [ ] **Step 4: Implement details and actions**

Match frame `2:62` for details and frame `2:82` for the open dropdown. Keep the open menu as state on `DocumentDetailsPage`, with keyboard/outside-click dismissal and local feedback for each action.

- [ ] **Step 5: Run document tests**

Run: `npm test -- --run src/test/documents.test.jsx`

Expected: PASS.

- [ ] **Step 6: Commit documents**

```bash
git add frontend/src
git commit -m "feat(frontend): add document library and details"
```

### Task 5: Implement simulated upload and Settings screens

**Files:**
- Create: `frontend/src/pages/UploadPage.jsx`
- Create: `frontend/src/pages/SettingsPage.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/hooks/useDocumentsPrototype.js`
- Test: `frontend/src/test/upload-settings.test.jsx`

**Interfaces:**
- Consumes: `addUpload(file)` from Task 4 and Task 1 UI components.
- Produces: `UploadPage()` and `SettingsPage()`.

- [ ] **Step 1: Write the failing upload/settings tests**

Assert supported copy `PDF • DOCX • TXT`; reject no file and unsupported `.png` without adding an entry; accept a PDF and show it in Recent Uploads with simulated Processing/Ready status. Assert Settings starts with Aung and `aung@example.com`, allows local edits, toggles password visibility, and shows local Change Password feedback.

- [ ] **Step 2: Run upload/settings tests to verify failure**

Run: `npm test -- --run src/test/upload-settings.test.jsx`

Expected: FAIL because the pages do not exist.

- [ ] **Step 3: Implement Upload Document**

Match frame `2:102`: centered heading, 845×411 upload panel with inner dashed drop zone, choose-file control, accepted-type validation, drag-over state, and 402×336 recent uploads card. Never read or transmit file contents.

- [ ] **Step 4: Implement Settings**

Match frame `2:122`: title/subtitle and 1275×397 account panel with aligned Name, Email, Password, eye control, and Change Password button. Keep edits in local state only.

- [ ] **Step 5: Run upload/settings tests**

Run: `npm test -- --run src/test/upload-settings.test.jsx`

Expected: PASS.

- [ ] **Step 6: Commit upload/settings**

```bash
git add frontend/src
git commit -m "feat(frontend): add upload and settings prototypes"
```

### Task 6: Acquire and integrate exact Figma assets

**Files:**
- Create: `frontend/src/assets/figma/*.svg`
- Modify: relevant files under `frontend/src/components/`, `frontend/src/hooks/`, and `frontend/src/pages/`
- Test: relevant tests under `frontend/src/test/`

**Interfaces:**
- Consumes: Figma file `zczymSZF7H8AQRzS15lLwU`, frame IDs `2:2`, `2:22`, `2:42`, `2:62`, `2:82`, `2:102`, `2:122`, and `2:142`.
- Produces: stable local SVG imports for every visible static Figma asset.

- [ ] **Step 1: Load design context for every frame**

Invoke the `figma-design-to-code` skill, create/reuse a Figma session, and call `get_design_context` with screenshots for each frame ID. If a response is sparse, request its visible child nodes before implementation.

- [ ] **Step 2: Download each returned visible asset once**

Use the download commands returned by Figma MCP, store descriptive filenames under `src/assets/figma/`, and verify every file exists and is non-empty.

- [ ] **Step 3: Replace temporary or approximate assets**

Import the local SVGs into their exact design slots. Do not redraw, omit, modify, or override the root SVG width/height; size wrappers instead.

- [ ] **Step 4: Add asset assertions**

Extend screen tests to assert meaningful `img`/icon labels or hidden decorative treatment and confirm no rendered `src` contains `figma.com/api/mcp/asset`.

- [ ] **Step 5: Verify tests and assets**

Run: `npm test -- --run`

Expected: all tests PASS.

Run: `Get-ChildItem src/assets/figma/*.svg | Where-Object Length -eq 0`

Expected: no output.

- [ ] **Step 6: Commit assets**

```bash
git add frontend/src
git commit -m "feat(frontend): integrate exact Figma assets"
```

### Task 7: Responsive polish and full verification

**Files:**
- Modify: `frontend/src/index.css`
- Modify: relevant components/pages under `frontend/src/`
- Modify: relevant tests under `frontend/src/test/`

**Interfaces:**
- Consumes: all prior route and component interfaces.
- Produces: visually verified desktop screens and usable tablet/mobile adaptations.

- [ ] **Step 1: Run the complete automated baseline**

Run: `npm test -- --run`

Expected: all tests PASS.

Run: `npm run lint`

Expected: exit 0.

- [ ] **Step 2: Render and compare all eight Figma states at 1440×810**

Start `npm run dev`, capture each route/state, compare with its corresponding Figma screenshot, and correct typography, spacing, radii, borders, colors, ambient lights, and asset geometry. Record the route and interaction needed to reproduce each open-menu state.

- [ ] **Step 3: Verify responsive layouts**

At 1024×768, 768×1024, and 390×844, verify navigation remains operable, content reflows, document/chat content remains accessible, and `document.documentElement.scrollWidth === window.innerWidth` except inside intentional table scrollers.

- [ ] **Step 4: Verify keyboard and focus behavior**

Tab through navigation, menus, forms, document rows/actions, chat submission, upload, and Settings; verify visible focus and Escape dismissal.

- [ ] **Step 5: Run the release tests**

Run: `npm test -- --run`

Expected: all tests PASS.

- [ ] **Step 6: Run the release lint and build checks**

Run: `npm run lint`

Expected: exit 0.

Run: `npm run build`

Expected: Vite reports a successful production build in `dist/`.

- [ ] **Step 7: Confirm no temporary Figma URLs remain**

Run: `rg "figma\.com/api/mcp/asset" src`

Expected: no matches.

- [ ] **Step 8: Commit verification fixes**

```bash
git add frontend
git commit -m "fix(frontend): polish responsive Figma fidelity"
```
