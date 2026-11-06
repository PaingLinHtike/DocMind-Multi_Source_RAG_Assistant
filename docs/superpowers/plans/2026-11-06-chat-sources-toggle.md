# Chat Sources Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Chat answer’s Sources row independently collapse and expand its citation card.

**Architecture:** The existing `Citation` component owns local disclosure state and receives the parent message ID for a unique controlled-panel ID. A semantic button exposes expansion state, rotates the existing chevron, and conditionally renders the unchanged citation card.

**Tech Stack:** React 19, Tailwind CSS 4, Vitest, Testing Library, user-event

**Spec:** `docs/superpowers/specs/2026-11-06-chat-sources-toggle-design.md`

## Global Constraints

- Sources default to expanded.
- Every answer toggles independently.
- The full Sources row is the control and remains at least 44px high.
- Expose `aria-expanded` and `aria-controls` with a unique panel ID based on the message ID.
- Preserve message rendering, chat scrolling, citations, authentication, and routes.
- Add no dependencies.

## Review Focus

- Multiple assistant answers must not share disclosure state; Task 1 tests independent toggling after appending another response.
- Re-expanding must restore the correct citation card; Task 1 tests a complete collapse/expand cycle.
- The controlled panel ID must remain unique for repeated citations; Task 1 compares each control’s `aria-controls` value.
- Keyboard users must receive native button behavior and expansion semantics; Task 1 verifies semantic buttons and `aria-expanded` transitions.
- Collapsing citations must not remove answer content or the composer; Task 1 asserts those surrounding elements remain rendered.

---

### Task 1: Add independent citation disclosure controls

**Files:**
- Modify: `frontend/src/pages/ChatPage.jsx:15-30, 167-178`
- Modify: `frontend/src/test/chat.test.jsx`
- Modify: `frontend/src/test/visual-system.test.jsx`

**Interfaces:**
- Consumes: assistant `message.id`, the existing citation object, and `Icon({ name: 'chevronDown', className })`.
- Produces: `Citation({ citation, messageId })`, a Sources button with `aria-expanded` and `aria-controls`, and a uniquely identified conditional citation panel.

- [ ] **Step 1: Write failing disclosure interaction tests**

In `frontend/src/test/chat.test.jsx`, add a test that:

- Renders `/chat`, sends one additional valid question, and obtains both `Sources (1)` buttons.
- Verifies both start expanded and have distinct `aria-controls` IDs whose panels contain their citation cards.
- Clicks the first control and verifies only its panel is removed, its state becomes collapsed, and the second remains expanded.
- Verifies the first chevron has the collapsed rotation class.
- Clicks the first control again and verifies its panel and expanded state return.
- Confirms both answer texts and the composer remain rendered.

- [ ] **Step 2: Write failing visual/accessibility contract assertions**

In `frontend/src/test/visual-system.test.jsx`, render `ChatPage` and assert the initial Sources control is a button with a minimum 44px target, transition-enabled chevron, `aria-expanded="true"`, and a matching controlled panel.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npm test -- --run src/test/chat.test.jsx src/test/visual-system.test.jsx`

Expected: FAIL because Sources is a paragraph, has no disclosure semantics or state, and the citation card is always rendered.

- [ ] **Step 4: Implement `Citation({ citation, messageId })` in `ChatPage.jsx`**

- Add local `expanded` state initialized to `true`.
- Derive a unique panel ID from `messageId`.
- Replace the Sources paragraph with a full-row button carrying `aria-expanded` and `aria-controls`.
- Give the chevron a rotation transition and rotate it right while collapsed.
- Conditionally render the unchanged citation card wrapper with the controlled panel ID.
- Pass `message.id` into `Citation` for every assistant message.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- --run src/test/chat.test.jsx src/test/visual-system.test.jsx`

Expected: both files pass.

- [ ] **Step 6: Run complete verification**

Run:

```bash
npm test -- --run
npm run lint
npm run build
```

Expected: all tests pass, ESLint reports no errors, and Vite builds successfully.

- [ ] **Step 7: Verify in a browser**

Confirm each Sources row toggles only its own citation card by mouse and keyboard, the arrow rotates between down and right, and the Chat thread/composer layout remains intact.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/ChatPage.jsx frontend/src/test/chat.test.jsx frontend/src/test/visual-system.test.jsx
git commit -m "feat(frontend): toggle chat sources"
```
