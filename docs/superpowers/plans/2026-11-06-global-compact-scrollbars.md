# Global Compact Scrollbars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every DocMind scrollable area a slim, dark, trackless native scrollbar with a proportional thumb and tiny directional buttons where supported.

**Architecture:** A single global scrollbar contract in `frontend/src/index.css` styles viewport, vertical, horizontal, current, and future native scrollbars. Chromium/WebKit receives complete pseudo-element styling, while Firefox receives standards-based thin scrollbar colors; no component behavior or overflow ownership changes.

**Tech Stack:** CSS, Tailwind CSS 4, Vitest

**Spec:** `docs/superpowers/specs/2026-11-06-global-compact-scrollbar-design.md`

## Global Constraints

- Apply the styling to every application scrollbar, including Chat, page/Recent Chats scrolling, and the Documents horizontal table.
- Preserve native scrolling and browser-calculated proportional thumb length.
- Keep scrollbar tracks and corners transparent.
- Use an 8px Chromium/WebKit scrollbar gutter with a rounded muted blue-gray thumb.
- Use 6px directional button boxes in supporting Chromium/WebKit browsers.
- Use `scrollbar-width: thin` and a transparent track in Firefox.
- Do not create scroll containers, change overflow ownership, add JavaScript, add dependencies, or replace native scrolling.

## Review Focus

- A global selector must cover the root viewport as well as nested elements; Task 1 tests universal WebKit selectors rather than page-specific classes.
- The Documents scrollbar is horizontal, so it must receive left/right buttons rather than only vertical controls; Task 1 tests horizontal increment and decrement selectors.
- Firefox must not receive a visible track; Task 1 tests standards-based global `scrollbar-color` and `scrollbar-width` declarations.
- Thumb hover and active colors must remain visible without changing its dimensions; Task 1 tests both state selectors and leaves geometry only on the base thumb rule.
- Existing `.table-scroll` rules must not override or diverge from the global contract; Task 1 tests that the page-specific scrollbar selectors are removed.

---

### Task 1: Add the global native scrollbar contract

**Files:**
- Modify: `frontend/src/index.css:25-52`
- Modify: `frontend/src/test/visual-system.test.jsx:128-132`

**Interfaces:**
- Consumes: native CSS scrollbar APIs and the existing `.chat-thread` and `.table-scroll` overflow behavior.
- Produces: one global CSS scrollbar contract inherited by the root viewport and all nested scrollable elements.

- [ ] **Step 1: Write the failing visual contract test**

In `frontend/src/test/visual-system.test.jsx`, add a test named `styles every native scrollbar with a transparent track and compact controls`. Assert against the existing `stylesheet` string that:

- the Firefox feature-query fallback applies `scrollbar-width: thin` and `scrollbar-color: #4b5878 transparent` globally;
- the global `*::-webkit-scrollbar` rule sets `width: 8px` and `height: 8px`;
- track and corner selectors use `background: transparent`;
- the base thumb uses `#4b5878`, a fully rounded radius, transparent border, and `background-clip: padding-box`;
- hover and active thumb selectors use `#637194` and `#7583a8` respectively;
- the base WebKit button rule is transparent and uses centered, non-repeating 5px arrow artwork;
- vertical and horizontal increment/decrement button selectors exist and use 6px dimensions;
- no `.table-scroll::-webkit-scrollbar` selector remains.

Keep the existing assertion that `.table-scroll` owns `overflow-x-auto`; scrollbar styling must not alter overflow behavior.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --run src/test/visual-system.test.jsx`

Expected: FAIL because scrollbar styling is still scoped to `.table-scroll` and lacks global vertical controls, states, and Firefox declarations.

- [ ] **Step 3: Replace page-specific scrollbar CSS with global standards rules**

In `frontend/src/index.css`, remove the `.table-scroll` scrollbar block. Replace its Firefox feature-query fallback with a universal rule containing `scrollbar-width: thin` and `scrollbar-color: #4b5878 transparent`, so viewport and nested scrollers share the standard contract without overriding Chromium's WebKit pseudo-element styling.

- [ ] **Step 4: Add global Chromium/WebKit track and thumb rules**

Add global WebKit selectors with these exact values:

- gutter: `width: 8px; height: 8px`;
- track and corner: transparent;
- base thumb: `background: #4b5878`, `border: 2px solid transparent`, `background-clip: padding-box`, and `border-radius: 9999px`;
- hover thumb: `#637194`;
- active thumb: `#7583a8`.

Do not set a thumb height or minimum height, leaving length proportional and browser-controlled.

- [ ] **Step 5: Add compact directional WebKit buttons**

Add a transparent base button rule with centered, non-repeating 5px background artwork. Add separate single-button selectors for vertical decrement/up, vertical increment/down, horizontal decrement/left, and horizontal increment/right. Set vertical buttons to `height: 6px`, horizontal buttons to `width: 6px`, and use small encoded SVG chevrons in muted `#6c7898`.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- --run src/test/visual-system.test.jsx`

Expected: the visual-system test file passes.

- [ ] **Step 7: Run complete automated verification**

Run:

```bash
npm test -- --run
npm run lint
npm run build
```

Expected: all tests pass, ESLint reports no errors, and Vite builds successfully.

- [ ] **Step 8: Verify in browsers**

In Chromium on desktop, confirm:

- Chat has no bright track, retains a draggable proportional thumb, and shows tiny up/down controls;
- the Documents table has the same thumb and tiny left/right controls when horizontally overflowing;
- page-level scrolling around Dashboard Recent Chats receives the same treatment when the viewport is short;
- wheel, trackpad, keyboard, and thumb dragging still scroll normally;
- mobile layout and scrolling remain unchanged.

In Firefox, confirm the thumb is thin and visible with a transparent track; directional arrows are not required because Firefox does not expose equivalent styling.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/index.css frontend/src/test/visual-system.test.jsx
git commit -m "style(frontend): compact global scrollbars"
```
