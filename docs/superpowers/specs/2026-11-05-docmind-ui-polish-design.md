# DocMind Systematic UI Polish Design

## Intent

Refine all DocMind screens so the product feels deliberate and professionally designed rather than generated from disconnected UI patterns. Preserve the existing information architecture, dark visual identity, responsive behavior, mock interactions, and locally stored Figma assets while making typography, icons, spacing, radii, and control hierarchy consistent.

## Goals

- Apply one restrained typography scale across all eight visual states.
- Give every icon a defined semantic role, size, alignment, and accessible treatment.
- Replace emoji and font-dependent Unicode control glyphs with consistent vector icons.
- Reduce oversized headings, controls, pills, radii, and empty spacing.
- Establish clear hierarchy between page titles, section titles, labels, values, metadata, and actions.
- Keep the interface recognizable as the approved DocMind design.
- Preserve keyboard operation, visible focus, mobile navigation, and responsive layouts.

## Non-goals

- No route, data model, feature, or interaction-flow changes.
- No backend or persistence work.
- No light theme or brand redesign.
- No new component library or icon dependency.
- No pixel-for-pixel recreation of a different design.

## Anti-goals

- Do not replace one set of arbitrary values with another.
- Do not use emoji or text characters as structural icons.
- Do not make every card, badge, and button equally prominent.
- Do not add gradients, glass effects, decorative glows, or motion merely to create visual novelty.
- Do not remove accessible labels, focus indication, or minimum 44px interactive targets.

## Constraints

- Continue using React, Tailwind CSS 4, and the existing component structure.
- Preserve the user's deleted `frontend/.env` file.
- Reuse the existing local Figma SVGs where their semantics and visual style fit.
- Add small local React SVG icon primitives only for controls currently represented by Unicode glyphs.
- Maintain the tested desktop, tablet, and mobile behavior.

## Approaches considered

### 1. Systematic polish — selected

Keep the layout and product identity, but normalize typography, icon geometry, spacing, radii, and component emphasis. This provides the strongest improvement without discarding the completed responsive implementation.

### 2. Full product redesign

Recompose navigation, screen structure, and the card system into a new enterprise workspace. This could create a more distinctive product but would substantially depart from the approved Figma and expand the task beyond visual polish.

### 3. Minimal font and icon cleanup

Only reduce typography and normalize icons. This is lower risk, but the oversized controls, repetitive pills, arbitrary spacing, and card treatment would continue to feel synthetic.

The user selected approach 1.

## Foundation system

### Typography

Use Inter with a compact, reusable scale rather than arbitrary pixel sizes:

| Role | Desktop | Mobile | Weight |
|---|---:|---:|---:|
| Page title | 32px | 28px | 650–700 |
| Upload focal title | 36px | 30px | 650–700 |
| Section title | 20–24px | 20px | 600 |
| Card title | 18px | 18px | 600 |
| Body | 16px | 15–16px | 400 |
| Control/label | 14px | 14px | 500–600 |
| Metadata/table header | 12–13px | 12–13px | 500–600 |

Use approximately 1.2 line height for headings and 1.5 for body copy. Reserve bold weight for page titles, key metric values, and essential emphasis. Remove the greeting emoji so the main heading reads as product UI rather than generated marketing copy.

### Icons

Use a consistent outlined visual language:

- 16px: metadata and inline indicators.
- 18px: navigation and compact menu items.
- 20px: buttons, form controls, document rows, and actions.
- 24px: prominent feature controls.
- 32px: upload illustration detail.
- 40–48px: avatars and intentionally prominent document/assistant marks only.

Decorative icons remain hidden from assistive technology. Icon-only buttons retain explicit accessible names and state attributes. Replace the Chat source caret, send arrow, Settings eye, and mobile-menu bars with local SVG icon components. Existing Figma icons receive sized wrappers so their root geometry remains unchanged.

### Spacing and shape

- Use a 4px base spacing rhythm, favoring 8, 12, 16, 24, 32, and 48px.
- Use 8px radius for compact fields/items, 10px for controls, 12px for cards, and 14px for overlays.
- Normalize primary control height to 44px and large touch controls to 48px.
- Reduce page-to-content gaps that exceed the hierarchy they represent.
- Keep borders subtle and use elevation only for overlays.

### Color and emphasis

- Retain the navy, violet, teal, and muted-slate palette.
- Reserve saturated violet for the active navigation state and primary actions.
- Use neutral surfaces for secondary actions instead of making every control purple.
- Use soft semantic backgrounds for status badges.
- Change destructive actions from large saturated red blocks to a quieter danger treatment with red text/icon and a tinted background.

## Component changes

### Shared shell and navigation

- Reduce brand and navigation typography to the shared scale.
- Standardize nav control height and icon sizing.
- Keep active navigation prominent but quieter than the page title.
- Make profile and mobile menus denser, with consistent row heights and restrained destructive styling.

### Dashboard

- Use a 32px page title without emoji and a 16px subtitle.
- Reduce metric labels and values to a balanced dashboard hierarchy.
- Normalize section headings to 20px and recent-chat metadata to 12–14px.
- Preserve the chart and metric layout while reducing card radius and excess visual weight.

### Chat

- Reduce the New Chat button and conversation rows to 44–48px controls.
- Use a 24px conversation title, 15–16px message text, and 12px timestamps.
- Normalize avatar, source, attachment, and send icons.
- Replace the text caret and send glyph with vectors.
- Keep the composer visually dominant through placement and border, not oversized height.

### Documents

- Use a 44px search field and primary action.
- Set table headers to 12px, row titles to 15px, metadata to 13px, and status/type badges to 12px.
- Normalize document glyphs to 20px and reduce pill width/padding.
- Keep the intentional horizontal table scroller on narrow screens.

### Document details and actions

- Reduce the document title to 30–32px and the file-mark container to approximately 72px.
- Use 13px metadata labels and 18–20px values.
- Reduce the action button and dropdown rows while keeping 44px targets.
- Use a soft danger row rather than an oversized red block.

### Upload

- Keep the centered focal composition but reduce the title, explanatory copy, and vertical gaps.
- Normalize the upload illustration to 32px and the drop-zone heading to 24px.
- Use a 44px file-picker control and tighter recent-upload rows.

### Settings

- Use the standard 32px page title and 24px section title.
- Normalize labels to 14px, inputs to 44px, and action text to 14px.
- Replace the Unicode eye with an accessible vector visibility icon.
- Reduce unused vertical space while preserving clear grouping.

## Interaction states

- Use subtle background, border, or opacity changes for hover/pressed states without layout-shifting transforms.
- Keep the existing 2px visible focus ring.
- Preserve `aria-expanded` and accessible labels on menu and icon controls.
- Continue closing menus with Escape and outside interaction.
- Respect reduced-motion preferences; no new motion is required for this pass.

## Responsive behavior

- Preserve the existing desktop compositions and mobile navigation.
- Keep at least 44px interactive targets at all viewport sizes.
- Allow headings to wrap naturally without forced line breaks.
- Recheck 1440×810, 1024×768, 768×1024, 390×844, and a 375px small-phone viewport.
- Verify no document-level horizontal overflow; the Documents table remains the sole intentional horizontal scroller.

## Verification

- Keep all existing behavior tests passing.
- Add focused tests for replacement icon controls where accessible state or labels change.
- Run tests, lint, production build, and the local-asset audit.
- Capture and inspect every route plus open document/profile menu states.
- Verify type hierarchy, icon sizing, focus order, Escape dismissal, responsive overflow, and dark-theme contrast.

## Builder decisions

- Implement shared local icon primitives rather than adding a dependency.
- Introduce reusable Tailwind/CSS token classes only where they remove repeated arbitrary values.
- Prefer consistency over preserving incidental one-off Figma measurements.
- Keep exact Figma assets for brand, document, upload, avatar, and action imagery, sizing them through wrappers.
