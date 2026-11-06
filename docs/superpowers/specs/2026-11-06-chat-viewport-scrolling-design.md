# Chat Viewport Scrolling Design

## Intent

Keep the desktop Chat screen fixed within the browser viewport when the current conversation fits, while allowing only the conversation thread to scroll once additional messages exceed its available space.

## Goals

- Prevent document-level vertical scrolling on the desktop Chat screen when the initial single question-and-answer exchange fits.
- Keep the top navigation, recent-chat sidebar, conversation heading, and composer visible while messages scroll.
- Use content overflow rather than a message-count switch: the thread becomes scrollable only when its rendered content exceeds the available height.
- Preserve the current mobile behavior, where the stacked sidebar and conversation may use normal document scrolling.
- Preserve chat interactions, responsive layout, authentication, and routes.

## Non-goals

- Do not introduce JavaScript viewport measurements or message-count-based overflow state.
- Do not automatically scroll to the newest message.
- Do not redesign the sidebar, messages, citations, or composer.
- Do not force the stacked mobile layout into a fixed-height viewport.

## Approaches

### Selected: viewport-sized desktop Chat with an internal auto-overflow thread

Size the desktop Chat section to the viewport space remaining below the 5rem navigation header. Allow the grid and conversation column to shrink with `min-height: 0`, hide overflow at the desktop section boundary, and retain `overflow-y: auto` on the message thread. This removes the browser scrollbar for fitting content and naturally introduces thread scrolling only when content overflows.

### Rejected: toggle scrolling by message count

Conditionally enabling overflow after a fixed number of messages would not account for long questions, answers, citations, viewport height, or text wrapping. A single long exchange could overflow while several short messages might still fit.

### Rejected: disable all scrolling until a second exchange

Clipping a long first exchange would make content inaccessible and would conflict with responsive and accessibility requirements.

## Constraints

- The desktop header remains 5rem (`h-20`) tall.
- Desktop behavior begins at the existing `lg` breakpoint.
- The message thread remains the sole vertical scroll container inside the desktop Chat workspace.
- The existing `min-h-[732px]` mobile canvas may remain for the stacked layout, but desktop must override that minimum.
- No new dependencies.

## Acceptance Criteria

- At `lg` and wider, the Chat section height is `calc(100dvh - 5rem)` and cannot expand the document.
- The initial designed exchange fits without a document scrollbar at the reference desktop viewport.
- Additional messages remain accessible by scrolling the conversation thread.
- The composer stays visible at the bottom of the Chat workspace.
- Below `lg`, the page retains natural document scrolling.
