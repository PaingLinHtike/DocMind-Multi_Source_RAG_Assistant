# Chat Sources Toggle Design

## Intent

Turn each answer’s Sources chevron and label into an accessible disclosure control that independently shows or hides that answer’s citation card.

## Goals

- Sources start expanded, preserving the current screen.
- Clicking the chevron or anywhere on the Sources row collapses the citation card; clicking again expands it.
- The chevron rotates to communicate expanded and collapsed states.
- Every answer’s Sources section toggles independently.
- The control works with keyboard activation and exposes `aria-expanded` and `aria-controls`.
- Preserve message rendering, chat scrolling, citations, authentication, and routes.

## Non-goals

- Do not persist disclosure state across refreshes or conversation changes.
- Do not add an expand-all or collapse-all control.
- Do not redesign or change the citation card action.
- Do not add animation beyond the existing visual transition style.

## Approaches

### Selected: local disclosure state per `Citation`

Each mounted `Citation` owns a boolean `expanded` state initialized to `true`. Its Sources row becomes a semantic button controlling a uniquely identified citation panel. Conditional rendering hides the panel when collapsed, and the chevron rotates from down to right.

### Rejected: one expanded citation in `ChatPage`

Centralizing a single expanded ID would make sections mutually exclusive, conflicting with the requirement that each answer toggle independently.

### Rejected: CSS-only checkbox disclosure

A hidden checkbox would add unnecessary form semantics and make `aria-controls` and clear button behavior harder to maintain than a React disclosure button.

## Constraints

- Use the existing `Icon` component and `chevronDown` glyph.
- Use each message ID to create a stable, unique citation-panel ID.
- Keep the complete Sources row at least 44px high as the click/touch target.
- Add no dependencies.

## Acceptance Criteria

- Every Sources control initially reports `aria-expanded="true"` and its controlled citation card is visible.
- Activating one Sources control sets only that control to collapsed, rotates its chevron, and removes only its citation card.
- Activating the same control again restores its card and expanded state.
- Other answers’ source cards remain unchanged throughout.
