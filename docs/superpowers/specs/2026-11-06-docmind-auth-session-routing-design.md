# DocMind Authentication Session Routing Design

## Intent

Make Sign In the application's first screen and prevent logged-out users from returning to protected application pages, while keeping a successful login active across browser refreshes.

## Goals

- Redirect `/` to `/signin`.
- Navigate successful Sign In attempts to `/dashboard`.
- Protect the Dashboard, Chat, Documents, Upload, and Settings routes.
- Persist the frontend-only authenticated state in `sessionStorage` so it survives refreshes but ends with the browser session.
- Make Log Out clear authentication, replace browser history with `/signin`, and prevent Back or direct URL navigation from reopening protected pages.
- Redirect authenticated users away from `/signin` and `/signup` to `/dashboard`.

## Non-goals

- No backend session, token, cookie, API, or real account persistence.
- No user-specific authorization or role model.
- No long-lived login across browser sessions.
- No changes to the existing dummy credential contract.

## Approaches Considered

### Chosen: sessionStorage-backed route guard

Store a minimal authenticated flag in `sessionStorage`, expose login/logout through a small React authentication context, and guard the application shell with React Router redirects. This survives refreshes, clears when the browser session ends, and lets Log Out invalidate Back and direct navigation.

### Rejected: localStorage-backed route guard

This would also survive browser restarts. That persistence is unnecessary and too durable for a dummy frontend-only session.

### Rejected: in-memory route gate

This would prevent protected access after Log Out but would lose the authenticated state on refresh, contradicting the requested behavior.

## Route Behavior

- `/` redirects to `/signin`.
- `/signin` and `/signup` remain public only while logged out.
- Successful Sign In records the session and replaces the current history entry with `/dashboard`.
- `/dashboard`, `/chat`, `/documents`, `/documents/:documentId`, `/upload`, and `/settings` render inside `AppLayout` only while authenticated.
- Unauthenticated protected-route visits replace the current history entry with `/signin`.
- Authenticated visits to `/signin` or `/signup` replace the current history entry with `/dashboard`.

## Log Out Behavior

The existing profile-menu Log Out button calls the shared logout action, clears the session flag, closes the menu, and replaces the current history entry with `/signin`. Browser Back and direct protected-route navigation then encounter the route guard and remain on Sign In.

## Testing

- Verify `/` starts at Sign In for an unauthenticated session.
- Verify protected routes redirect to Sign In.
- Verify valid dummy credentials create the session and navigate to `/dashboard`.
- Verify the session survives remounting to represent browser refresh behavior.
- Verify Log Out clears the session and navigates to Sign In.
- Verify protected routes remain inaccessible after Log Out.
- Preserve existing application-page tests by making their authentication setup explicit in the shared test renderer.

## Success Criteria

- Opening the app starts on Sign In.
- Successful login reaches the Dashboard and survives refresh.
- Log Out returns to Sign In and protected pages cannot be reopened without another valid login.
- Existing tests, lint, and production build remain green.
