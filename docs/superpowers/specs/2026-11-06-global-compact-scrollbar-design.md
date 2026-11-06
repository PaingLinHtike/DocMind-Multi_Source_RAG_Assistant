# Global Compact Scrollbar Design

## Intent

Replace bright native scrollbar tracks throughout DocMind with a compact, dark, trackless treatment while preserving native scrolling, proportional draggable thumbs, and very small directional arrow buttons where the browser supports them.

## Scope

- Apply to every scrollbar in the application rather than a page-specific class.
- This includes the Chat message thread, page scrolling around Recent Chats, the Documents table's horizontal scroller, and future scrollable regions.
- Preserve all current overflow ownership and layout behavior. Styling a region does not make it independently scrollable.

## Visual Treatment

- Use a transparent scrollbar track and corner so no white rail is visible.
- Use an 8px scrollbar gutter on Chromium/WebKit, with a muted blue-gray rounded thumb that fits the existing dark interface.
- Keep native proportional thumb length; do not impose a minimum length that makes the thumb appear longer.
- Add subtle hover and active thumb colors for discoverability.
- Reduce scrollbar button boxes to approximately 6px and draw tiny directional indicators for vertical and horizontal scrollbars where WebKit pseudo-elements are supported.
- Use Firefox's `scrollbar-width: thin` and a transparent track. Firefox controls thumb length and does not expose equivalent arrow-button styling.

## Implementation

- Consolidate scrollbar rules in `frontend/src/index.css` using global element and WebKit scrollbar pseudo-element selectors.
- Replace the current `.table-scroll`-only scrollbar rules; the Documents table will inherit the global treatment.
- Add no JavaScript, React state, dependencies, or custom scrollbar component.

## Accessibility and Compatibility

- Keep native mouse-wheel, touch, trackpad, keyboard, and thumb-drag behavior.
- Keep the thumb visible with sufficient contrast against the dark application surface.
- Browser support is progressive: Chromium/WebKit receives the complete treatment; Firefox receives a thin proportional thumb with a transparent track.
- Operating-system overlay scrollbar preferences may hide arrows or alter when the scrollbar is shown; the application will not override those user settings.

## Non-goals

- Do not force the native thumb to a fixed short length.
- Do not create new scroll containers or change page dimensions.
- Do not hide scrollbars completely.
- Do not implement a custom scrollbar or alter scrolling physics.

## Acceptance Criteria

- No scrollbar displays a bright or white track within the application.
- Chat and Documents use the same slim, rounded, proportional thumb treatment.
- The Documents horizontal scrollbar receives correctly oriented compact end buttons in supporting browsers.
- Existing vertical scrollbars receive compact up/down buttons in supporting browsers.
- Firefox keeps a visible thin thumb with a transparent track.
- Chat viewport containment, mobile page scrolling, Documents overflow, Recent Chats, composer behavior, Sources toggles, authentication, and routes remain unchanged.
