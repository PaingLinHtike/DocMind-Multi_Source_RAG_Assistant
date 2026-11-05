# DocMind Systematic UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine all DocMind screens with a consistent type scale, vector icon system, tighter spacing, restrained component emphasis, and professional responsive polish without changing product behavior.

**Architecture:** Keep the existing React routes, local state hooks, Figma assets, and Tailwind composition. Add one dependency-free local SVG icon primitive for missing control glyphs, normalize shared UI foundations first, then update screens in coherent groups so every task produces a testable visual layer.

**Tech Stack:** React 19, React Router 7, Tailwind CSS 4, Vite 8, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-11-05-docmind-ui-polish-design.md`

## Global Constraints

- Preserve all existing routes, mock data, local interactions, and backend-free behavior.
- Continue using React, Tailwind CSS 4, and the existing component structure.
- Do not add a UI component or icon dependency.
- Preserve the user's deleted `frontend/.env`; never stage or restore it.
- Keep existing Figma SVG files unchanged and size them through wrappers or CSS.
- Use the type scale 12, 14, 16, 18, 20, 24, 28/30/32, and 36px through standard Tailwind classes; remove arbitrary `text-[Npx]` values.
- Use 16px metadata icons, 18px navigation/menu icons, 20px control/table icons, 24px prominent control icons, and 32px upload illustration detail.
- Keep interactive targets at least 44px high/wide and retain the existing 2px visible focus ring.
- Preserve desktop, tablet, and mobile usability, with the Documents table as the only intentional horizontal scroller.

## Review Focus

- A 375px viewport and landscape phone must keep navigation operable and avoid document-level horizontal overflow; Task 6 measures both orientations.
- Long filenames, storage paths, and account values must wrap or truncate without overlapping adjacent controls; Tasks 4 and 5 pin the required layout classes.
- Replaced icon controls must keep accessible names and expanded/visibility state; Tasks 1, 2, 3, and 5 assert their semantics.
- Ready, Processing, Failed, and destructive states must remain understandable from text as well as color; Task 4 asserts every visible state label.
- Reduced-motion users must not depend on animation for feedback; Task 6 verifies no essential animation or layout-shifting transform is introduced.

---

### Task 1: Establish shared typography and local control icons

**Files:**
- Create: `frontend/src/components/ui/Icon.jsx`
- Create: `frontend/src/test/visual-system.test.jsx`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/components/ui/PageHeading.jsx`
- Modify: `frontend/src/components/ui/StatusBadge.jsx`

**Interfaces:**
- Consumes: existing Tailwind theme colors and the global `:focus-visible` rule.
- Produces: `Icon({ name, size = 20, className = '' })`, supporting `menu`, `plus`, `send`, `chevronDown`, `eye`, `eyeOff`, and `logout`; normalized `PageHeading({ title, subtitle })`; normalized `StatusBadge({ children, tone })`.

- [ ] **Step 1: Write failing shared visual-system tests**

Add tests that:

```jsx
render(<Icon name="send" />)
expect(container.querySelector('svg')).toHaveAttribute('width', '20')
expect(container.querySelector('svg')).toHaveAttribute('height', '20')
expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')

render(<PageHeading title="Documents" subtitle="Manage sources." />)
expect(screen.getByRole('heading', { name: 'Documents' })).toHaveClass('text-3xl')
expect(screen.getByText('Manage sources.')).toHaveClass('text-base')
```

Also assert every supported icon name renders an SVG and the shared status badge uses `text-xs`, `font-medium`, and a compact rounded treatment.

- [ ] **Step 2: Run the focused test to verify failure**

Run: `npm test -- --run src/test/visual-system.test.jsx`

Expected: FAIL because `Icon.jsx` does not exist and shared components retain the old classes.

- [ ] **Step 3: Implement the dependency-free SVG icon primitive**

Create `Icon.jsx` with a `24 24` viewBox and outlined paths for the six specified names. The component sets `width` and `height` from `size`, uses `currentColor`, sets `focusable="false"`, and remains decorative with `aria-hidden="true"`; accessible naming stays on the containing control.

- [ ] **Step 4: Normalize shared typography and badges**

Update `PageHeading` to use `text-3xl` on desktop, `text-2xl` on mobile, `leading-tight`, and a `text-base` subtitle. Update `StatusBadge` to a 24px compact badge with standard Tailwind text, weight, padding, and radius classes. Keep all existing tone names and visible labels.

- [ ] **Step 5: Consolidate foundation rules**

Keep Inter and existing semantic colors in `index.css`; add a reduced-motion media query that removes nonessential transition duration without suppressing focus feedback. Do not introduce raw component-specific hex values into the global layer.

- [ ] **Step 6: Run focused and full tests**

Run: `npm test -- --run src/test/visual-system.test.jsx src/test/shell.test.jsx`

Expected: PASS.

- [ ] **Step 7: Commit the foundation**

```bash
git add frontend/src/components/ui/Icon.jsx frontend/src/components/ui/PageHeading.jsx frontend/src/components/ui/StatusBadge.jsx frontend/src/index.css frontend/src/test/visual-system.test.jsx
git commit -m "refactor(frontend): standardize UI foundations"
```

### Task 2: Polish the application shell, profile menu, and Dashboard

**Files:**
- Modify: `frontend/src/components/layout/TopNav.jsx`
- Modify: `frontend/src/components/layout/ProfileMenu.jsx`
- Modify: `frontend/src/pages/DashboardPage.jsx`
- Modify: `frontend/src/test/shell.test.jsx`
- Modify: `frontend/src/test/dashboard.test.jsx`
- Modify: `frontend/src/test/visual-system.test.jsx`

**Interfaces:**
- Consumes: `Icon` and shared typography from Task 1; existing local brand/avatar/dashboard SVGs.
- Produces: normalized shared navigation/profile presentation and the polished Dashboard visual hierarchy.

- [ ] **Step 1: Write failing shell and Dashboard polish tests**

Update the Dashboard heading assertion to exact text `Good morning, Aung`. Add assertions that the heading does not contain `👋`, the mobile navigation trigger contains an SVG, and the profile menu retains `Upload Document`, `Settings`, and `Log Out` accessible names. In `visual-system.test.jsx`, assert metric labels use `text-sm`, metric values use `text-3xl`, and Dashboard section headings use `text-xl`.

- [ ] **Step 2: Run the focused tests to verify failure**

Run: `npm test -- --run src/test/dashboard.test.jsx src/test/shell.test.jsx src/test/visual-system.test.jsx`

Expected: FAIL on the greeting copy, menu SVG, and old typography classes.

- [ ] **Step 3: Normalize the top navigation**

Use 44px controls, standard `text-sm` navigation labels, restrained active/hover backgrounds, and `Icon name="menu" size={20}` for the mobile trigger. Keep the local DocMind and avatar Figma assets, current routes, outside-click behavior, Escape behavior, and `aria-expanded` state.

- [ ] **Step 4: Densify the profile menu**

Reduce the overlay height to content-driven sizing, use 44px menu rows, size menu icons at 18px through wrappers, and replace the bright full-width red logout block with a tinted danger row using `Icon name="logout" size={18}`, red icon/text semantics, and a visible `Log Out` label. Preserve all links and close behavior.

- [ ] **Step 5: Apply the Dashboard hierarchy**

Remove the greeting emoji. Use the standard page heading, `text-sm` metric labels, `text-3xl` metric values, `text-xl` card headings, compact status badges, 12–14px metadata, `rounded-xl` cards, and standard spacing increments. Preserve metrics, chart labels, recent-chat data, and layout breakpoints.

- [ ] **Step 6: Run focused and full tests**

Run: `npm test -- --run src/test/dashboard.test.jsx src/test/shell.test.jsx src/test/assets.test.jsx src/test/visual-system.test.jsx`

Expected: PASS.

- [ ] **Step 7: Commit shell and Dashboard polish**

```bash
git add frontend/src/components/layout/TopNav.jsx frontend/src/components/layout/ProfileMenu.jsx frontend/src/pages/DashboardPage.jsx frontend/src/test/shell.test.jsx frontend/src/test/dashboard.test.jsx frontend/src/test/visual-system.test.jsx
git commit -m "refactor(frontend): polish shell and dashboard"
```

### Task 3: Polish Chat typography, density, and control icons

**Files:**
- Modify: `frontend/src/pages/ChatPage.jsx`
- Modify: `frontend/src/test/chat.test.jsx`
- Modify: `frontend/src/test/visual-system.test.jsx`

**Interfaces:**
- Consumes: `Icon` from Task 1 and existing Chat Figma assets/behavior.
- Produces: a compact Chat screen with vector plus, source-chevron, and send controls while preserving `useChatPrototype()` behavior.

- [ ] **Step 1: Write failing Chat polish tests**

Change the New Chat accessible-name assertion from `+ New Chat` to `New Chat`. Assert the `New Chat` and `Send question` buttons each contain an SVG, the send button remains labeled `Send question`, the active conversation heading uses `text-2xl`, and message text containers use `text-sm` or `text-base` consistently.

- [ ] **Step 2: Run the Chat tests to verify failure**

Run: `npm test -- --run src/test/chat.test.jsx src/test/visual-system.test.jsx`

Expected: FAIL because the current controls use text glyphs and the old type/density classes.

- [ ] **Step 3: Replace structural glyphs with icons**

Use `Icon name="plus" size={18}`, `Icon name="chevronDown" size={16}`, and `Icon name="send" size={20}`. Keep accessible names on the surrounding buttons and hide decorative icons from assistive technology.

- [ ] **Step 4: Normalize Chat typography and spacing**

Use a 44px New Chat button, 44–48px conversation rows, a `text-2xl` conversation title, `text-sm` or `text-base` message copy, `text-xs` timestamps, 20px conversation/source/attachment icons, 40px avatars, 12px card radii, and a 56px composer. Add `min-w-0`, `break-words`, and wrapping where long message/source text can collide.

- [ ] **Step 5: Run Chat, asset, and full behavior tests**

Run: `npm test -- --run src/test/chat.test.jsx src/test/assets.test.jsx src/test/visual-system.test.jsx`

Expected: PASS.

- [ ] **Step 6: Commit Chat polish**

```bash
git add frontend/src/pages/ChatPage.jsx frontend/src/test/chat.test.jsx frontend/src/test/visual-system.test.jsx
git commit -m "refactor(frontend): refine chat visual hierarchy"
```

### Task 4: Polish Documents, details, and action states

**Files:**
- Modify: `frontend/src/pages/DocumentsPage.jsx`
- Modify: `frontend/src/components/documents/DocumentRow.jsx`
- Modify: `frontend/src/pages/DocumentDetailsPage.jsx`
- Modify: `frontend/src/components/documents/DocumentActions.jsx`
- Modify: `frontend/src/test/documents.test.jsx`
- Modify: `frontend/src/test/visual-system.test.jsx`

**Interfaces:**
- Consumes: `Icon` from Task 1, local document/action SVGs, and existing document prototype hooks.
- Produces: normalized search/table/detail/action presentation without changing document filtering, navigation, or local actions.

- [ ] **Step 1: Write failing Documents visual-system tests**

Assert the upload link contains a decorative SVG and retains accessible name `Upload Document`; all four document rows still expose their visible type and status labels; row icons are wrapped by 20px containers; the details heading has `break-words`; metadata labels use `text-sm`; metadata values use `text-lg` or `text-xl`; and all five action rows retain their accessible names and 44px minimum height.

- [ ] **Step 2: Run Documents tests to verify failure**

Run: `npm test -- --run src/test/documents.test.jsx src/test/visual-system.test.jsx`

Expected: FAIL on old class values and the text-based upload plus.

- [ ] **Step 3: Normalize the Documents list**

Use a 44px search field and upload action, `Icon name="plus" size={18}`, 12px table headers, 15–16px row names, 13–14px metadata, 12px badges, 20px document icons, standard `rounded-lg`/`rounded-xl` shapes, and compact row padding. Preserve the `min-w-[980px]` intentional table scroller and filtering behavior.

- [ ] **Step 4: Normalize document details**

Use a 30–32px wrapping title, an approximately 72px file-icon container, a 44px Actions button, a `text-xl` Overview heading, 13–14px metadata labels, 18–20px values, and standard spacing/radii. Keep breadcrumb, status text, feedback, and local actions unchanged.

- [ ] **Step 5: Normalize the actions overlay**

Use content-driven overlay height, 44px rows, 18–20px icon wrappers, `text-sm` labels, and a soft danger treatment for Delete. Keep the existing local Figma action SVGs, menu role, event handlers, outside-click dismissal, and Escape dismissal.

- [ ] **Step 6: Run focused and asset tests**

Run: `npm test -- --run src/test/documents.test.jsx src/test/assets.test.jsx src/test/visual-system.test.jsx`

Expected: PASS, including Ready, Processing, Failed, and Delete text labels.

- [ ] **Step 7: Commit Documents polish**

```bash
git add frontend/src/pages/DocumentsPage.jsx frontend/src/components/documents/DocumentRow.jsx frontend/src/pages/DocumentDetailsPage.jsx frontend/src/components/documents/DocumentActions.jsx frontend/src/test/documents.test.jsx frontend/src/test/visual-system.test.jsx
git commit -m "refactor(frontend): refine document workspace"
```

### Task 5: Polish Upload and Settings forms

**Files:**
- Modify: `frontend/src/pages/UploadPage.jsx`
- Modify: `frontend/src/pages/SettingsPage.jsx`
- Modify: `frontend/src/test/upload-settings.test.jsx`
- Modify: `frontend/src/test/visual-system.test.jsx`

**Interfaces:**
- Consumes: `Icon` from Task 1, existing upload Figma assets, and current local form behavior.
- Produces: compact Upload and Settings layouts with accessible vector visibility controls.

- [ ] **Step 1: Write failing Upload and Settings polish tests**

Assert the Upload heading uses `text-4xl` only on desktop with a smaller mobile class, the file-picker label has a 44px height, recent rows expose filenames/status text, the Settings section heading uses `text-2xl`, each field has a 44px height, and the Show/Hide password button contains an SVG while preserving its accessible name and input type behavior.

- [ ] **Step 2: Run focused tests to verify failure**

Run: `npm test -- --run src/test/upload-settings.test.jsx src/test/visual-system.test.jsx`

Expected: FAIL on the old size classes and Unicode visibility glyph.

- [ ] **Step 3: Normalize Upload presentation**

Use a 30px mobile/36px desktop focal title, 16px supporting copy, tighter standard vertical gaps, a 32px upload illustration wrapper, a `text-2xl` drop-zone heading, a 44px file-picker control, `rounded-xl` panels, 14px filenames, 12px metadata/badges, and compact recent-upload rows. Preserve validation, drag/drop, file acceptance, and simulated status changes.

- [ ] **Step 4: Normalize Settings presentation**

Use the shared page heading, a `text-2xl` Account heading, 14px labels and inputs, 44px fields/buttons, standard radii, tighter panel spacing, and `Icon name={passwordVisible ? 'eyeOff' : 'eye'} size={18}`. Keep editable local values, password visibility, and Change Password feedback.

- [ ] **Step 5: Pin long-value behavior**

Add `min-w-0`, overflow-safe input wrappers, and wrapping/truncation classes so long email/account values do not overlap the visibility or Change Password controls. Assert those classes on the password row in `visual-system.test.jsx`.

- [ ] **Step 6: Run focused and asset tests**

Run: `npm test -- --run src/test/upload-settings.test.jsx src/test/assets.test.jsx src/test/visual-system.test.jsx`

Expected: PASS.

- [ ] **Step 7: Commit form polish**

```bash
git add frontend/src/pages/UploadPage.jsx frontend/src/pages/SettingsPage.jsx frontend/src/test/upload-settings.test.jsx frontend/src/test/visual-system.test.jsx
git commit -m "refactor(frontend): polish upload and settings"
```

### Task 6: Audit all screens and complete responsive verification

**Files:**
- Modify: relevant files under `frontend/src/` only for issues found by the audit
- Modify: relevant tests under `frontend/src/test/`
- Do not retain: diagnostic screenshot/CDP scripts

**Interfaces:**
- Consumes: all polished components from Tasks 1–5.
- Produces: visually reviewed desktop/tablet/mobile screens with release evidence and no temporary audit code.

- [ ] **Step 1: Run the automated baseline**

Run: `npm test -- --run`

Expected: all tests PASS.

Run: `npm run lint`

Expected: exit 0.

- [ ] **Step 2: Audit arbitrary typography and radius values**

Run the PowerShell equivalent of:

```powershell
Get-ChildItem src -Recurse -File -Include *.jsx,*.css |
  Select-String -Pattern 'text-\[\d+px\]|rounded-\[\d+px\]'
```

Expected: no matches in production UI code. Content widths/heights needed for the responsive compositions are outside this audit.

- [ ] **Step 3: Capture every desktop state at 1440×810**

Capture Dashboard, Chat, Documents, document details, document actions open, Upload, Settings, and profile menu open. Verify type hierarchy, icon sizes/baselines, 44px controls, restrained radii, semantic status visibility, and absence of emoji/Unicode structural icons.

- [ ] **Step 4: Verify responsive layouts and edge inputs**

At 1024×768, 768×1024, 390×844, 375×812, and 844×390, inspect all routes. Verify `document.documentElement.scrollWidth <= window.innerWidth`, except internal Documents table scrolling; long filenames/storage paths wrap or truncate; mobile navigation remains operable; and overlays stay in the viewport.

- [ ] **Step 5: Verify keyboard, state, and reduced-motion behavior**

Tab through navigation, Chat, document rows/actions, upload, Settings, and both menus. Verify 2px focus indication, accessible icon-button names, Escape dismissal, and no essential feedback depends on animation. Emulate `prefers-reduced-motion: reduce` and confirm the UI remains understandable.

- [ ] **Step 6: Run release verification**

Run: `npm test -- --run`

Expected: all tests PASS.

Run: `npm run lint`

Expected: exit 0.

Run: `npm run build`

Expected: Vite production build succeeds.

Run a recursive production-source scan excluding `src/test/` for `figma.com/api/mcp/asset`.

Expected: no matches.

Run: `Get-ChildItem src/assets/figma/*.svg | Where-Object Length -eq 0`

Expected: no output.

- [ ] **Step 7: Commit final audit fixes**

```bash
git add frontend/src
git commit -m "fix(frontend): finalize systematic UI polish"
```
