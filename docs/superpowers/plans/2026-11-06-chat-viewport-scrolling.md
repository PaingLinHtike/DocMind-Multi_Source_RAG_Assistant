# Chat Viewport Scrolling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep a fitting desktop Chat conversation within the viewport and move overflow scrolling into the message thread as more content is added.

**Architecture:** The Chat page remains a CSS-only responsive grid. At the existing `lg` breakpoint, the section consumes the viewport below the 5rem header, its grid and conversation column permit shrinking, and the existing message thread owns vertical auto-overflow; mobile retains normal document flow.

**Tech Stack:** React 19, Tailwind CSS 4, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-11-06-chat-viewport-scrolling-design.md`

## Global Constraints

- Do not add JavaScript viewport measurement or message-count overflow state.
- Preserve the current stacked mobile layout and natural mobile document scrolling.
- Preserve all chat interactions, authentication behavior, and routes.
- Keep the 5rem header assumption aligned with `TopNav`'s existing `h-20`.
- Add no dependencies.

## Review Focus

- A short initial exchange must not expand the desktop document; Task 1 pins the viewport-height and boundary-overflow classes.
- Multiple exchanges must remain accessible without moving the composer; Task 1 pins the internal thread overflow and verifies messages still append.
- Empty conversations must retain usable flexible space; Task 1 pins the shrinkable conversation column and thread.
- Long wrapped content must scroll inside the thread rather than clip; Task 1 pins `overflow-y-auto` and removal of the desktop minimum-height constraint.
- Mobile must keep normal page flow; Task 1 verifies viewport locking is `lg`-scoped rather than unconditional.

---

### Task 1: Constrain desktop Chat and assign overflow to the message thread

**Files:**
- Modify: `frontend/src/pages/ChatPage.jsx:109-186`
- Modify: `frontend/src/test/chat.test.jsx`
- Modify: `frontend/src/test/visual-system.test.jsx`

**Interfaces:**
- Consumes: the existing 5rem `TopNav` height and `useChatPrototype()` message appending behavior.
- Produces: `.chat-page` as the responsive viewport boundary, `.chat-panel` as the shrinkable conversation column, and `.chat-thread` as the internal vertical scroll container.

- [ ] **Step 1: Write failing responsive layout tests**

In `frontend/src/test/visual-system.test.jsx`, render `ChatPage` and assert:

- `.chat-page` keeps the base mobile minimum height and has `lg:h-[calc(100dvh-5rem)]`, `lg:min-h-0`, and `lg:overflow-hidden`.
- `.chat-panel` has `min-h-0` at desktop while retaining its flex-column layout.
- `.chat-thread` retains the mobile `min-h-[450px]`, adds `lg:min-h-0`, and keeps `flex-1 overflow-y-auto` so only desktop overrides the fixed minimum.

- [ ] **Step 2: Extend the interaction test for overflowing content ownership**

In `frontend/src/test/chat.test.jsx`, extend the valid-question test to assert that after a new question and simulated response are appended, those messages are contained by `.chat-thread` and the composer remains outside that scroll container.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npm test -- --run src/test/visual-system.test.jsx src/test/chat.test.jsx`

Expected: FAIL because the Chat section lacks the viewport-boundary hooks/classes, the conversation column cannot shrink, and the thread still has `min-h-[450px]`.

- [ ] **Step 4: Implement the CSS-only responsive layout in `ChatPage.jsx`**

- Add the `.chat-page` hook and desktop-only viewport height, minimum-height override, and overflow boundary to the root section.
- Add the `.chat-panel` hook and `min-h-0` to the conversation column at desktop.
- Add the `.chat-thread` hook, retain the mobile `min-h-[450px]`, add `lg:min-h-0`, and keep `flex-1 overflow-y-auto` so the desktop thread can shrink without changing mobile spacing.
- Keep viewport locking behind `lg:` so mobile remains in natural document flow.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- --run src/test/visual-system.test.jsx src/test/chat.test.jsx`

Expected: both test files pass.

- [ ] **Step 6: Run complete verification**

Run:

```bash
npm test -- --run
npm run lint
npm run build
```

Expected: all tests pass, ESLint reports no errors, and Vite builds successfully.

- [ ] **Step 7: Verify the reference desktop behavior in a browser**

At the reference viewport, confirm the initial exchange does not create a document scrollbar, the composer remains visible, and sending additional questions eventually scrolls only `.chat-thread`. At a mobile viewport, confirm the stacked page still scrolls normally.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/ChatPage.jsx frontend/src/test/chat.test.jsx frontend/src/test/visual-system.test.jsx
git commit -m "fix(frontend): contain chat conversation scrolling"
```
