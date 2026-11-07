# DocMind Figma Frontend Design

## Intent

Create a frontend-only DocMind MVP in `frontend/` that recreates the supplied Figma file, **DocMind — Editable UI Screens & Interactive Prototype**, using the frontend stack selected by the user. The result is intended to demonstrate the complete document-assistant experience before Laravel and FastAPI integration begins.

## Goals

- Implement all eight Figma states/screens:
  1. Dashboard
  2. Chat
  3. Documents
  4. Document details
  5. Document actions open
  6. Upload document
  7. Settings
  8. Profile menu open
- Match the supplied desktop designs closely at their 1440×810 reference size.
- Preserve the Figma visual language: Inter typography, navy surfaces, purple and teal ambient lighting, bordered cards, rounded controls, status pills, and supplied icons.
- Provide simulated navigation and interactions with realistic local mock data.
- Keep the code understandable and reusable for later API integration.
- Adapt the desktop composition for narrower screens without changing the visual identity.

## Non-goals

- No Laravel, FastAPI, database, authentication, upload, retrieval, or LLM integration.
- No real persistence across browser sessions.
- No additional product flows absent from the supplied Figma designs.
- No redesign or reinterpretation of the Figma visual system.

## Anti-goals

- Do not ship the Figma screenshot as the interface.
- Do not retain temporary Figma asset URLs at runtime.
- Do not reproduce every frame as unrelated, duplicated markup.
- Do not rely exclusively on fixed absolute positioning that breaks outside 1440×810.
- Do not introduce a large UI component library that alters the supplied design.

## Constraints

- Frontend stack from `doc/my-rag-stack.md`: React, at a beginner/MVP level.
- User-selected implementation approach: Vite + React + Tailwind CSS.
- Target location: `frontend/`, which now contains an existing React 19/Vite 8 starter project with Tailwind 4 packages installed but not configured. Extend this scaffold in place rather than creating a second application structure.
- The tracked `frontend/.env` is currently deleted in the working tree; preserve that user change and do not recreate or populate it.
- Interactions are simulated; Laravel/FastAPI integration is explicitly deferred.
- Exact visible Figma assets must be downloaded locally before use.

## Approaches considered

### 1. Vite + React + plain CSS

Use reusable React components and hand-authored CSS. This minimizes dependencies and keeps styling explicit, but requires more custom CSS maintenance.

### 2. Vite + React + Tailwind CSS — selected

Use React components with Tailwind utilities and a small token layer for repeated Figma colors, shadows, radii, and typography. This speeds up accurate composition and responsive variants. The tradeoff is additional build tooling and denser class strings.

### 3. Fixed screen-by-screen recreation

Translate each Figma frame with absolute positioning. This can match a single viewport quickly, but duplicates structure and is brittle on other viewport sizes.

The user selected approach 2.

## Application structure

Use Vite with JavaScript React. React Router will provide addressable screen routes while a small local data module supplies the prototype content.

Proposed routes:

- `/` — Dashboard
- `/chat` — Chat
- `/documents` — Documents
- `/documents/:documentId` — Document details
- `/upload` — Upload document
- `/settings` — Settings

The open document-actions state and profile-menu state are overlays on their owning screens rather than separate routes. This preserves the Figma states while making interactions natural.

Shared components will include:

- Application shell and ambient background
- Top navigation and profile control
- Profile dropdown
- Page heading
- Metric card and status badge
- Document table/rows
- Document actions dropdown
- Form controls and buttons
- Icons/assets

Screen-specific components will compose these primitives rather than duplicate them.

## Visual implementation

- Define the Figma palette, radii, shadows, and content widths as Tailwind theme tokens or CSS custom properties.
- Load Inter as the primary font with sensible system fallbacks.
- Download the Figma-provided SVG assets into `frontend/src/assets/figma/`; do not use expiring MCP URLs in application code.
- Match the 1440×810 desktop frames first, then add responsive adaptations:
  - Cards wrap into fewer columns.
  - Chat history becomes a collapsible/stacked region.
  - Document tables gain controlled horizontal scrolling or compact row layouts.
  - Navigation remains usable at tablet and mobile widths.
- Use semantic HTML and visible focus states without changing the intended appearance.

## Simulated behavior

- Navigation links switch between Dashboard, Chat, and Documents.
- Profile avatar toggles the profile menu; its Upload Document and Settings items navigate to those screens.
- Recent chat and chat-history items change the active mock conversation.
- New Chat creates/selects a temporary blank conversation locally.
- Sending a question appends a user message and a simulated cited assistant response.
- Citation controls expose the mock source reference without opening a real backend document.
- Document search filters local mock rows.
- Selecting a document opens its details route.
- Actions toggles the Figma dropdown; View, Download, Reindex, Rename, and Delete provide safe local feedback or local-only state changes.
- Upload supports file picker and drag/drop UI, adds a mock recent item, and simulates processing progress without transmitting the file.
- Settings fields are editable locally; password visibility and change-password feedback are simulated.
- Menus close on outside click and Escape.

## Data and state

Keep mock documents, conversations, dashboard metrics, and user details in dedicated local modules. Use component state and lightweight shared React context only where multiple screens need the same prototype state. Avoid a state-management dependency for this MVP.

The mock data shape should anticipate later API replacement but must not fabricate backend contracts.

## Error and empty states

- Provide local validation for empty chat submissions and unsupported upload types.
- Preserve the designed Ready, Processing, and Failed document states.
- Show concise inline/toast feedback for simulated actions.
- Avoid network-error UI because this phase performs no network requests.

## Verification

- Add component/interaction tests for navigation, dropdowns, document filtering, chat submission, upload validation, and settings editing.
- Run lint, tests, and production build.
- Render each requested screen at 1440×810 and compare it with its Figma screenshot, correcting in-scope visual differences.
- Check representative tablet and mobile widths for overflow and usability.
- Verify every Figma asset is present locally, non-empty, referenced by the correct component, and rendered at the intended geometry.

## Builder decisions

- Use JavaScript rather than TypeScript to stay aligned with the documented beginner React stack.
- Use React Router for meaningful URLs and browser navigation.
- Use Tailwind only for styling; do not add a separate UI kit.
- Treat Figma's menu-open frames as interaction states, not duplicated pages.
- Keep backend integration boundaries clean but defer API client code entirely.
