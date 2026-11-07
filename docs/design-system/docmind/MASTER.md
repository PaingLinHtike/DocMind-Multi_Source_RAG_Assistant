# DocMind Design System — Paper & Ink

**Status:** Approved, amended 2026-11-07
**Direction:** A — Paper & Ink  
**Product:** React web application for asking questions about a personal document library  
**Source of truth:** This file governs the redesign unless a later page-specific document explicitly overrides it.

## 1. Intent

DocMind should feel like a careful reading and research tool, not a generic glowing AI dashboard. The interface uses the visual language of paper, ink, marginal notes, numbered references, and library indexes. It should feel calm, trustworthy, precise, and useful for long sessions.

The design supports the product's real jobs:

- organize and inspect documents;
- ask questions and read cited answers;
- move quickly between recent conversations;
- understand processing, ready, and failed states;
- manage account settings without changing existing prototype behavior.

### 1.1 Approved amendment — horizontal header and light interaction surfaces

Approved on 2026-11-07; this amendment supersedes the earlier fixed desktop sidebar direction:

- At 1024px and wider, use one horizontal header with DocMind left, Overview/Chat/Documents navigation, and the profile control right. Below 1024px, collapse those three links into the existing menu button.
- Upload document, Settings, and Log out remain in the profile menu; Upload and Settings are not primary-navigation items.
- Remove remaining navy, blue, purple, gradient, glass, glow, and decorative-shadow styling.
- Fields and the Chat composer use paper-0 `#FFFDF7`. User questions use paper-200 `#ECE7DA` with an oxide rule. Assistant answers use the transparent canvas. Citations use warm-white paper-0 ruled rows.
- Icons use ink gray by default and oxide `#B23A2B` for active/selected states. White icons are limited to filled oxide/destructive actions; conversation icons are never white or purple.

## 2. Goals, Non-goals, and Anti-goals

### Goals

- Establish one three-layer token system instead of per-file colors.
- Make documents and citations the visual center of the product.
- Use one horizontal application header at 1024px and wider, with compact menu navigation below 1024px.
- Standardize typography, controls, icons, tables, badges, surfaces, and menus.
- Preserve all routes, hooks, test IDs, storage keys, authentication behavior, and interactions.
- Meet WCAG AA contrast for text and visible focus; retain 44px minimum controls.
- Work without horizontal page overflow at 375, 768, 1024, and 1440px and at 200% zoom.

### Non-goals

- No backend, API, account, or data-model work.
- No dark mode in this redesign.
- No new charting library or invented analytics data.
- No animation library, component framework, or icon dependency.
- No changes to the documented prototype limitation that stores Settings password data locally.
- No marketing landing page, pricing page, or support/FAQ structure.

### Anti-goals

The redesign fails if it becomes any of the following:

- another navy-and-purple AI dashboard;
- a decorative newspaper that makes app controls hard to find;
- a collection of rounded cards and pills with no information hierarchy;
- low-contrast beige-on-beige styling;
- a visual rewrite that removes tested behavior;
- a dense desktop layout simply squeezed onto mobile.

## 3. Approaches Considered

### Selected: Paper & Ink

Warm paper, dark ink, oxide red, hairline rules, square 2px corners, no gradients, and no decorative shadows. Newsreader gives headings an editorial voice; Inter remains the UI workhorse; JetBrains Mono labels metadata and references. This direction belongs to a document product and most clearly separates DocMind from common AI dashboards.

### Rejected: Swiss Product

White, black, red, zero-radius geometry, and dense tables would be clean and systematic, but it is more common in design portfolios and less connected to reading and cited documents.

### Rejected: Quiet Instrument

A dark ink-and-amber interface would preserve a refined dark experience, but it would remain too close to the current visual category and would not solve the “generic AI dashboard” problem as strongly.

### Rejected generator output

The `ui-ux-pro-max` generator returned marketing-page patterns and, on a second query, glassmorphism. Those patterns do not fit this authenticated application. We retain its applicable guidance—strong contrast, visible focus, reduced motion, responsive checks, and consistent type hierarchy—but not its landing-page or glass effects.

## 4. Brand Character and Voice

### Character

- **Scholarly, not academic:** informed and clear without sounding formal or difficult.
- **Quiet, not empty:** generous space supports reading; it does not hide useful data.
- **Precise, not robotic:** labels explain exactly what happened.
- **Document-first, not AI-first:** cite the source before celebrating the technology.

### Product copy

- Use direct verbs: “Upload document,” “Ask a question,” “Open source,” “Reindex.”
- Prefer “I found this in…” over claims of intelligence or magic.
- Keep status messages factual and short.
- Use sentence case for headings, buttons, menu items, and labels.
- Approved casing examples are **Sign in**, **Create account**, **Full name**, **Upload document**, **Change password**, **Save changes**, and **Log out**. Accessible-name tests must update to these visible labels rather than preserve title case.
- Do not use emoji as interface icons.

## 5. Visual Principles

1. **Rules before cards.** Separate content with 1px lines and spacing. Use a boxed surface only when a region has its own interaction or state.
2. **Type carries hierarchy.** Newsreader headings, Inter controls/body, and mono metadata should do more work than color or elevation.
3. **Oxide is scarce.** Use oxide red for the primary action, active navigation marker, links, focus, and citation numbers—not as decoration.
4. **No atmospheric effects.** Remove ambient blobs, gradients, glass blur, glow, large decorative circles, and decorative shadows.
5. **Documents look like documents.** Citations use numbered references, metadata uses compact mono labels, and document rows read like an index.
6. **State is never color-only.** Keep visible words such as Ready, Processing, and Failed, with an icon where space permits.

## 6. Token Architecture

Implement tokens in `frontend/src/index.css` in three named sections: primitive, semantic, and component. Components must consume semantic or component tokens. Raw hex values must not remain in JSX.

### 6.1 Primitive color tokens

| Token | Value | Purpose |
|---|---:|---|
| `--paper-0` | `#FFFDF7` | clean sheet / raised surface |
| `--paper-100` | `#F4F1E8` | application canvas |
| `--paper-200` | `#ECE7DA` | selected rows / quiet fills |
| `--paper-300` | `#D8D2C4` | hairline borders |
| `--paper-400` | `#C5BDAE` | stronger control borders |
| `--paper-500` | `#8A8274` | accessible control/menu boundary |
| `--ink-950` | `#171610` | primary text |
| `--ink-800` | `#343129` | strong secondary text |
| `--ink-700` | `#4F4A40` | body-muted text |
| `--ink-600` | `#6B655A` | metadata; minimum supported muted text |
| `--ink-500` | `#8B8375` | disabled text only |
| `--oxide-800` | `#74251B` | pressed primary action |
| `--oxide-700` | `#8F2E22` | hover / active / high-emphasis links |
| `--oxide-600` | `#B23A2B` | brand accent / primary action |
| `--oxide-100` | `#F3DDD8` | accent tint / selected citation |
| `--green-700` | `#2F6B4F` | success text |
| `--green-100` | `#DCEADF` | success fill |
| `--amber-800` | `#704600` | processing/warning text |
| `--amber-100` | `#F4E6C4` | processing/warning fill |
| `--red-700` | `#B42318` | destructive/error text and action |
| `--red-800` | `#8F1D14` | destructive hover/active |
| `--red-100` | `#F7DDD8` | destructive/error fill |
| `--red-200` | `#F0CAC3` | destructive hover fill |
| `--white` | `#FFFFFF` | text on oxide/destructive buttons only |

Verified contrast examples:

- `ink-950` on `paper-100`: 16.05:1.
- `ink-700` on `paper-100`: 7.79:1.
- `ink-600` on `paper-100`: 5.12:1.
- white on `oxide-600`: 5.94:1.
- `oxide-600` on `paper-100`: 5.26:1.
- `green-700` on `paper-100`: 5.57:1.
- `paper-500` against `paper-0`: 3.74:1; against `paper-100`: 3.36:1.
- `ink-500` against `paper-200`: 3.04:1 (disabled text only).

`paper-300` is a structural rule, not text. Do not use it for meaningful icons or copy.

### 6.2 Semantic color tokens

| Token | Maps to | Use |
|---|---|---|
| `--color-canvas` | `paper-100` | page background |
| `--color-surface` | `paper-0` | fields, menus, contained regions |
| `--color-surface-muted` | `paper-200` | selected/quiet states |
| `--color-border` | `paper-300` | standard rule |
| `--color-border-strong` | `paper-500` | input and menu boundary |
| `--color-text` | `ink-950` | primary copy |
| `--color-text-secondary` | `ink-700` | supporting copy |
| `--color-text-muted` | `ink-600` | metadata and timestamps |
| `--color-accent` | `oxide-600` | primary action / link / active marker |
| `--color-accent-hover` | `oxide-700` | hover |
| `--color-accent-active` | `oxide-800` | pressed/active |
| `--color-accent-soft` | `oxide-100` | subtle selected state |
| `--color-focus` | `oxide-700` | keyboard focus ring |
| `--color-success` | `green-700` | success text/icon |
| `--color-success-soft` | `green-100` | success fill |
| `--color-warning` | `amber-800` | processing text/icon |
| `--color-warning-soft` | `amber-100` | processing fill |
| `--color-danger` | `red-700` | error/destructive text/icon |
| `--color-danger-hover` | `red-800` | destructive hover/active |
| `--color-danger-soft` | `red-100` | error/destructive fill |
| `--color-danger-soft-hover` | `red-200` | destructive hover fill |
| `--color-disabled-bg` | `paper-200` | disabled control fill |
| `--color-disabled-fg` | `ink-500` | disabled control text/icon |
| `--color-disabled-border` | `paper-500` | disabled control boundary |

### 6.3 Typography tokens

Load fonts in `frontend/index.html` with preconnects and one Google Fonts stylesheet request. Use `display=swap` and these families/weights only:

- Newsreader: 500, 600.
- Inter: 400, 500, 600.
- JetBrains Mono: 400, 500.

Fallbacks must keep the interface usable if fonts fail:

```css
--font-display: "Newsreader", Georgia, "Times New Roman", serif;
--font-ui: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Consolas, monospace;
```

| Role | Desktop | Mobile | Weight | Line height | Family |
|---|---:|---:|---:|---:|---|
| Display / auth statement | 48px | 38px | 500 | 1.04 | Newsreader |
| Page H1 | 40px | 32px | 500 | 1.10 | Newsreader |
| Section H2 | 26px | 24px | 500 | 1.20 | Newsreader |
| Component H3 | 18px | 18px | 600 | 1.30 | Inter |
| Body large / answer | 18px | 17px | 400 | 1.65 | Inter |
| Body / field | 16px | 16px | 400 | 1.50 | Inter |
| UI small | 14px | 14px | 500 | 1.45 | Inter |
| Metadata | 12px | 12px | 400/500 | 1.40 | JetBrains Mono |

Rules:

- Keep reading text to 68 characters per line where practical.
- Never use Newsreader for form labels, buttons, table cells, or menus.
- Use mono only for reference numbers, file types, dates, sizes, chunk counts, and eyebrow labels.
- Use all caps only for short mono labels, with `0.06em` tracking.
- No font weight below 400.

### 6.4 Spacing and sizing tokens

Use a 4px base with this allowed scale only:

| Token | Value |
|---|---:|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-12` | 48px |
| `--space-16` | 64px |

Additional dimensions:

- Minimum interactive height/width: 44px.
- Default control height: 44px.
- Large auth control height: 48px.
- Application header: 64px.
- Main content maximum: 1200px.
- Reading column maximum: 760px.
- Menu width: 224–288px according to content.

### 6.5 Radius, border, shadow, and motion

| Token | Value | Rule |
|---|---:|---|
| `--radius-none` | 0 | tables and full-width rows |
| `--radius-control` | 2px | buttons, fields, menus, surfaces |
| `--radius-full` | 9999px | avatar only; not badges/buttons |
| `--border-hairline` | 1px | default boundary |
| `--shadow-none` | none | default everywhere |
| `--duration-fast` | 120ms | hover/press/color |
| `--duration-normal` | 180ms | menu/disclosure |
| `--ease-standard` | `cubic-bezier(.2,.8,.2,1)` | all transitions |

No gradient, glow, blur, or elevation shadow is permitted. Menus use a strong border and opaque surface rather than a shadow. Under `prefers-reduced-motion: reduce`, remove transform motion and reduce all transition/animation duration to effectively zero.

### 6.6 Component tokens

At minimum define component aliases for:

```css
--button-primary-bg: var(--color-accent);
--button-primary-fg: var(--white);
--button-primary-bg-hover: var(--color-accent-hover);
--button-primary-bg-active: var(--color-accent-active);
--button-secondary-bg: var(--color-surface);
--button-secondary-fg: var(--color-text);
--button-border: var(--color-border-strong);
--button-destructive-fg: var(--color-danger);
--button-destructive-bg: var(--color-danger-soft);
--button-destructive-bg-hover: var(--color-danger-soft-hover);
--control-disabled-bg: var(--color-disabled-bg);
--control-disabled-fg: var(--color-disabled-fg);
--control-disabled-border: var(--color-disabled-border);
--field-bg: var(--color-surface);
--field-border: var(--color-border-strong);
--field-border-focus: var(--color-focus);
--surface-bg: var(--color-surface);
--surface-border: var(--color-border);
--menu-bg: var(--color-surface);
--menu-border: var(--color-border-strong);
--badge-radius: var(--radius-control);
```

## 7. Layout System

### Desktop: 1024px and wider

- One 64px horizontal header spans the viewport with a 1px bottom rule and opaque paper background.
- DocMind sits left, Overview/Chat/Documents form the primary navigation, and the profile control sits right. Upload and Settings do not appear in primary navigation.
- Main content sits below the header, uses the full available width, and is centered with a 1200px maximum and 32–48px adaptive gutters.
- The page itself owns vertical scrolling. Chat is the exception: its message thread owns desktop vertical overflow beneath the header, preserving the existing tested behavior.

### Tablet: 768–1023px

- Keep the same 64px header but collapse Overview/Chat/Documents into the existing menu button and anchored, bordered menu popover. Do not introduce a drawer.
- Two-column page content may remain only when each column stays readable; otherwise stack.
- Tables retain intentional horizontal scrolling.

### Mobile: below 768px

- 64px header with brand, primary-navigation menu control, and profile control.
- One content column with 24px gutters.
- Controls and primary actions become full width where that improves clarity.
- Labels remain above fields.
- Page scrolling remains native; do not create nested scrolling except the tested document table.

### Required viewport checks

- 375px: small phone.
- 768px: tablet boundary.
- 1024px: horizontal-navigation boundary.
- 1440px: wide desktop.
- 200% zoom: no clipped controls, hidden focus, or horizontal page overflow.

## 8. Icon and Brand Mark Rules

- Consolidate interface icons into `frontend/src/components/ui/Icon.jsx`.
- Use one 24×24 outline family with `currentColor`, round caps/joins, and 1.75px stroke.
- Standard icon sizes: 16px metadata, 20px controls, 24px standalone.
- The visual glyph may be smaller, but every icon-only control remains at least 44×44px.
- Decorative icons use `aria-hidden="true"` and `focusable="false"`.
- Icon-only controls require an accessible label and applicable expanded/pressed state.
- Use outline icons at the same hierarchy; do not mix filled, duotone, and exported Figma styles.
- Default navigation, menu, conversation, field, and utility icons use ink gray (`--color-text-secondary`). Active or selected icons use oxide (`--color-accent`). White icons are reserved for oxide/destructive filled buttons; purple icons are prohibited.
- Create a current-color open-book `BrandMark` component. Use ink in normal contexts and oxide only for the mark, never a purple exported logo.
- During migration, remove unused Figma SVG imports and update `assets.test.jsx` to test the new shared icon/mark contract instead of preserving old artwork.

## 9. Component Specifications

### 9.1 Button

Use `frontend/src/components/ui/Button.jsx` everywhere a reusable button or button-like link fits. The component must support `as`/link composition or a shared class helper without introducing a dependency.

| Variant | Default | Hover/active | Use |
|---|---|---|---|
| Primary | oxide background, white text, oxide border | darker oxide | one main action per region |
| Secondary | clean paper, ink, strong border | muted paper | normal secondary action |
| Ghost | transparent, ink | muted paper | menus/toolbars |
| Destructive | red-700 text/border, red-100 fill | red-800 text, red-200 fill | delete/logout |
| Text | transparent, oxide text, underline on hover | dark oxide | inline navigation |

- Height: 44px default, 48px auth large.
- Radius: 2px.
- Horizontal padding: 16px default, 24px large.
- Label: Inter 14/600; 16/600 for large.
- Focus: 2px oxide ring with 2px paper offset.
- Disabled: native `disabled`, exact disabled component tokens above, no hover, not-allowed cursor.
- Loading: preserve width; show a named busy state, not color alone.

### 9.2 Field

Create a shared field primitive for text, email, password, search, and composer variants while preserving each input's controlled state and accessibility attributes.

- Label above control, Inter 14/600.
- Control: 44px (48px auth), paper-0 background, 1px strong border, 2px radius.
- Input text: 16px ink; placeholder: ink-600.
- Optional leading icon: 20px; trailing action: 44px hit area.
- Focus: border oxide plus visible 2px ring; never remove focus without replacing it.
- Error: red border, error icon/text, `aria-invalid`, and linked description.
- A field may carry a persistent description block below the control, linked after any error or helper ID through `aria-describedby`; use it for rules that stay visible while typing.
- Disabled/read-only states must be visibly distinct and semantically native.

### 9.3 Surface

Create `Surface` for the few regions that need containment.

- Paper-0 background, 1px hairline border, 2px radius, no shadow.
- Padding: 16px compact, 24px standard, 32px spacious.
- Do not wrap every metric or paragraph in a Surface.
- Interactive surfaces need a semantic link/button and a stronger border or muted fill on hover/focus.

### 9.4 Rule

Create a simple horizontal/vertical rule primitive or shared class.

- 1px paper-300.
- Use spacing—not extra borders—to distinguish nested hierarchy.
- Section labels may sit above a rule; never use a short colored decorative underline.

### 9.5 Badge

Badges are compact text labels, not large pills.

- Height: 24px; padding: 4px 8px; radius: 2px.
- JetBrains Mono 12px/500.
- Ready: green text on green-soft.
- Processing: amber text on amber-soft.
- Failed/danger: red text on red-soft.
- Neutral/file type: ink-700 on paper-200.
- The visible word is mandatory; color never carries status alone.

### 9.6 Table

- Semantic table markup is preferred when the redesign reaches Documents; preserve row navigation with an accessible link covering the primary document name or row interaction.
- Header: 12px mono, short uppercase labels, ink-600, paper canvas background.
- Row: minimum 52px; 1px bottom rule; paper-0 or transparent background.
- Hover/focus: paper-200; no shadow or movement.
- Text left; numbers right; statuses left or centered consistently; actions right.
- Long names truncate visually but keep an accessible full name.
- Below the table's minimum width, keep the existing intentional horizontal scroller and visible scrollbar.

### 9.7 Application header and responsive navigation

- Header: paper-100, bottom rule, 64px high, no shadow, with brand left and profile control right.
- At 1024px and wider, Overview, Chat, and Documents render as horizontal primary links. Upload and Settings are absent from primary navigation.
- Active link: oxide bottom rule and oxide icon with ink text. Do not use a filled purple pill.
- Link height: 44px; icon 20px; radius 2px.
- Below 1024px, the existing menu button reveals Overview, Chat, and Documents in an opaque bordered panel with no shadow. It closes on selection, Escape, and outside click as today.
- The profile menu remains separate at every width and retains Upload document, Settings, and Log out.

### 9.8 Menu

- Opaque paper-0 background, 1px strong border, 2px radius, no shadow.
- 8px internal padding; each row minimum 44px.
- Ghost row hover/focus uses paper-200.
- Destructive row uses red text and pale red hover.
- Preserve existing Escape and outside-click behavior.
- Menu controls expose `aria-expanded`; menus/menuitems retain their current roles where used.

## 10. Screen Specifications and File Map

### 10.1 Application shell

**Files:**

- `frontend/src/components/layout/AppLayout.jsx`
- `frontend/src/components/layout/TopNav.jsx`
- `frontend/src/components/layout/ProfileMenu.jsx`
- `frontend/src/components/ui/Icon.jsx`
- new `frontend/src/components/ui/BrandMark.jsx`

**Design:** Replace the interim sidebar with the responsive horizontal header in Section 7. At 1024px and wider, place DocMind left, **Overview**, **Chat**, and **Documents** in the horizontal primary navigation, and the profile control right. Below 1024px, collapse those three primary links into the existing menu button. Keep `/dashboard` as the Overview route. Do not show Upload or Settings in primary navigation; the profile menu retains name/email, **Upload document**, **Settings**, and **Log out** behavior.

### 10.2 Authentication

**Files:**

- `frontend/src/components/auth/AuthLayout.jsx`
- `frontend/src/components/auth/AuthField.jsx`
- `frontend/src/pages/SignInPage.jsx`
- `frontend/src/pages/SignUpPage.jsx`

**Design:** Remove circles, purple art, gradient buttons, dark panels, and oversized rounding. Use a paper canvas with a centered two-column “opening spread” at desktop: form on the left and approved product copy on the right, divided by a vertical rule. Stack at mobile.

Approved right-side copy:

- Display statement: **“Your documents, read closely.”**
- Supporting sentence: **“Ask questions, trace every answer to its source, and keep your knowledge in one quiet workspace.”**
- Feature rows may retain the current three feature meanings, rewritten in sentence case without new product claims.

Keep the current field meanings, validation, password toggles, route-state success message, demo credential behavior, and minimum 44px actions. Change visible labels and buttons to the approved sentence-case policy and update accessible-name tests accordingly.

The Password field carries an always-visible five-rule checklist: at least 8 characters, one uppercase letter, one lowercase letter, one number, and one symbol. Each rule switches from a hollow circle with `Not met` to a check mark with `Met` as it becomes true; the list is the field's description and never replaces the existing validation message.

### 10.3 Overview dashboard

**File:** `frontend/src/pages/DashboardPage.jsx`  
**Data:** `frontend/src/data/mockData.js`

**Design:**

1. Page heading: “Good morning, Aung” in Newsreader with the current explanatory subtitle.
2. A single ruled data strip for Documents, Chats, Messages, and Storage. Do not render four cards.
3. A prominent semantic link/CTA row: “Ask your documents anything…” navigating to `/chat`. It must look actionable but must not be an editable field that discards text.
4. Main two-column area:
   - **Recent conversations:** numbered `01`, `02`, `03`; title, timestamp, and link to `/chat`.
   - **Library:** compact summary of document count, storage, and latest upload, with link to `/documents`.
5. Remove the fake Chat Activity chart, weekday/axis labels, and mock percentage deltas. Do not add a chart until real time-series data exists.

### 10.4 Chat

**Files:**

- `frontend/src/pages/ChatPage.jsx`
- `frontend/src/hooks/useChatPrototype.js` (behavior preserved)

**Design:** Keep the conversation rail and message thread, but express them as an index plus reading pane. Recent conversations use numbered/index rows and a slim active oxide rule; their icons are ink gray by default and oxide when selected. Assistant answers sit directly on the transparent canvas as readable text blocks, not “AI cards.” User questions use paper-200 (`#ECE7DA`) with an oxide left rule rather than a dark chat bubble. Citations become warm-white paper-0 (`#FFFDF7`) ruled rows with footnote numbers, filename, and page in mono. The composer uses paper-0. Preserve new/select/rename/delete, source disclosure, message sending, desktop thread scrolling, and mobile page scrolling.

### 10.5 Documents list

**Files:**

- `frontend/src/pages/DocumentsPage.jsx`
- `frontend/src/components/documents/DocumentRow.jsx`
- `frontend/src/hooks/useDocumentsPrototype.js` (behavior preserved)

**Design:** Search and Upload sit on one toolbar at desktop and stack on mobile. The document list is a ruled index/table with no card container. Use one icon family, compact file-type labels, explicit status labels, mono metadata, and a visible empty state. Preserve case-insensitive filtering, row navigation, all metadata, and intentional horizontal scrolling.

### 10.6 Document details and actions

**Files:**

- `frontend/src/pages/DocumentDetailsPage.jsx`
- `frontend/src/components/documents/DocumentActions.jsx`

**Design:** Breadcrumb, document title, status, and upload time form a header separated by a rule. Replace the icon tile and Overview accent bar with typographic hierarchy. Metadata becomes a definition-list index with vertical rules at wide widths and stacked rows on mobile. Actions use the standard Menu and Button. Preserve view/download/reindex/rename/delete feedback, menu dismissal, not-found, and deleted states.

### 10.7 Upload

**File:** `frontend/src/pages/UploadPage.jsx`

**Design:** Left-align the page heading. The drop area resembles a paper inbox: strong dashed rule, upload icon, clear accepted types, and standard primary Choose File button. Recent uploads are a ruled list, not a floating card. Drag-active state uses oxide border plus oxide-soft fill. Preserve file type validation, drag/drop, Processing-to-Ready simulation, and test IDs.

### 10.8 Settings

**File:** `frontend/src/pages/SettingsPage.jsx`

**Design:** Keep the compact 480px account control column, 44px controls, password visibility, Change password, Save changes, local storage key, safe fallback behavior, persistent live region, and stale-feedback clearing. Replace dark card styling with a ruled section and standard Field/Button/Status treatments. Fields use paper-0 (`#FFFDF7`); icons use ink gray and oxide only for active/focus states. Keep full-width controls at 320/375px.

## 11. Shared Component/File Plan

### Foundations to modify

- `frontend/index.html`: font preconnects, font stylesheet, paper theme color.
- `frontend/public/favicon.svg`: replace the old purple mark with the Paper & Ink BrandMark geometry and oxide/ink palette.
- `frontend/src/index.css`: three token layers, base typography, focus, scrollbar colors, reduced motion.
- `frontend/src/components/ui/Button.jsx`: make the existing unused component the shared action primitive.
- `frontend/src/components/ui/PageHeading.jsx`: Newsreader hierarchy and readable subtitle measure.
- `frontend/src/components/ui/StatusBadge.jsx`: Paper & Ink status variants.
- `frontend/src/components/ui/Icon.jsx`: complete the single icon family.

### Foundations to add

- `frontend/src/components/ui/BrandMark.jsx`
- `frontend/src/components/ui/Field.jsx`
- `frontend/src/components/ui/Surface.jsx`
- `frontend/src/components/ui/Rule.jsx`

Add no package dependency for these primitives.

### Assets to retire after migration

- Ambient glow SVGs.
- Purple avatar backgrounds and chevrons.
- Per-screen action, chat, document, search, source, and upload SVGs replaced by `Icon` glyphs.
- Old purple DocMind icon replaced by `BrandMark`.

Delete an asset only after no production or test import remains.

## 12. Interaction and Accessibility

- Keep semantic links for navigation and native buttons for actions.
- Preserve existing controlled fields and accessible Testing Library queries.
- Every focusable element gets a visible 2px focus ring that is not clipped.
- Menus close on Escape/outside click and remain operable by keyboard.
- Disclosure controls keep `aria-expanded` and `aria-controls`.
- Status/error feedback uses persistent or appropriate live regions; do not regress Settings announcements.
- Error/success/processing states use text and optional icons, never color alone.
- Keep form values after validation failures.
- Do not block paste or password managers.
- Honor reduced motion globally.
- At 200% zoom, navigation switches to the compact shell when the effective viewport requires it.
- Normal text contrast target: at least 4.5:1; meaningful non-text controls: at least 3:1.

## 13. Test Migration Contract

The current baseline is 100 passing tests. The redesign must update visual assertions, not delete behavior coverage.

### Keep behavior tests intact

- `auth-session.test.jsx`: session, restore, logout, route protection.
- `signin.test.jsx` and `signup.test.jsx`: validation, password toggles, navigation.
- `chat.test.jsx`: select/new/rename/delete/send/source disclosure.
- `documents.test.jsx`: search, details, actions, mutations.
- `upload-settings.test.jsx`: upload validation and Settings storage/accessibility.
- route and shell navigation behavior.

### Intentionally update visual/data assertions

- `visual-system.test.jsx`: replace old purple/dark exact classes with token, component, type, focus, layout, and contrast contracts.
- `dashboard.test.jsx`: remove weekday/fake-chart expectations; assert the data strip, ask action, recent conversation links, and library summary.
- `assets.test.jsx`: stop requiring retired Figma SVGs; test `BrandMark` and the unified `Icon` contract.
- `shell.test.jsx`: assert the horizontal desktop header, three-link primary navigation, compact menu below 1024px, and profile-only Upload/Settings access while preserving menu behavior.
- auth route visual assertions: update the old decorative-circle and dark-card assumptions.

### Add system-level contracts

- No raw six-digit hex values in JSX except a documented external/brand asset edge case.
- Font stylesheet contains Newsreader, Inter, and JetBrains Mono with `display=swap`.
- Primary text and button combinations meet documented contrast ratios.
- Controls stay at least 44px.
- Horizontal primary navigation appears at desktop; its three links collapse into the compact menu below 1024px.
- Reduced-motion rule remains present.

## 14. Implementation Sequence

1. **Foundations:** tokens, font loading, BrandMark/Icon, Button, PageHeading, Badge, Field, Surface, Rule.
2. **Shell and auth:** initial responsive shell, profile menu, sign-in, sign-up.
3. **Overview:** data strip, ask action, linked recent conversations, library summary; remove fake chart.
4. **Documents:** list, row, details, actions.
5. **Upload.**
6. **Approved shell amendment:** replace the interim desktop sidebar with the horizontal header and restrict primary navigation to Overview/Chat/Documents.
7. **Chat.**
8. **Settings.**
9. **Final QA:** contrast, keyboard, focus, reduced motion, 200% zoom, 375/768/1024/1440 widths, empty/error/disabled states. Viewport and zoom checks are a documented manual Chromium browser checklist; do not add browser-test tooling unless separately approved.

Each numbered implementation stage must finish with focused tests, full tests, lint, build, and browser verification before moving on.

## 15. Repository Hygiene

`frontend/.opencode/` contains local agent skills rather than product runtime code and is currently untracked. Add `frontend/.opencode/` to the repository root `.gitignore`; do not include the 175 local skill files in product commits. The globally installed skill remains available to OpenCode.

## 16. Definition of Done

- All screens follow Paper & Ink tokens and component rules.
- No ambient glows, purple gradients, glass panels, fake chart, or old purple UI assets remain in production code.
- No raw UI hex values remain in JSX.
- The shared Button is used rather than dead code.
- One icon family and one BrandMark serve the app.
- All existing behavior remains functional.
- Updated tests pass; lint and production build succeed.
- Browser QA passes at 375, 768, 1024, and 1440px and at 200% zoom.
- Keyboard navigation, visible focus, reduced motion, and live feedback are verified.
