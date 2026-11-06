# Settings Save Design

## Intent

Make the Settings account form compact and give it an explicit save action that persists changes locally.

## Goals

- Shorten the account input controls to a compact width while keeping their 44px height and touch target.
- Add a clear **Save Changes** button below the account fields.
- Persist Name, Email, and Password in browser `localStorage` so saved values survive refreshes and navigation.
- Restore saved values when Settings mounts.
- Show accessible confirmation after a successful save.
- Preserve labels, password visibility, Change Password feedback, typography, routes, authentication, and the existing dark visual system.

## Non-goals

- Do not add a backend account API.
- Do not change authentication behavior.
- Do not redesign the rest of the Settings page.
- Do not add validation beyond the existing email input type.

## Approaches

### Selected: compact form with local storage persistence

Keep the existing label-and-control layout but cap the control column at a compact width. Wrap the account fields in a semantic form with a right-aligned primary **Save Changes** button. Load saved values through lazy state initialization and write all three fields to `localStorage` on submit.

### Rejected: feedback-only Save button

A Save button that only displays a message would make the action appear to work while losing edits on refresh, contradicting the user's choice to save all three fields locally.

### Rejected: backend persistence

The frontend is a prototype with no account API, so adding a backend would expand scope far beyond this UI change.

## Constraints

- Keep the form usable at 320px and retain 44px input and button heights.
- Use the existing `primary`, `border`, `heading`, and `muted` visual tokens.
- Store the account values under one versioned key, `docmind.account-settings.v1`.
- Treat malformed or unavailable stored data as no saved settings rather than breaking the page.
- **Security limitation:** storing a password in browser storage is plain text and is not safe for production. This prototype behavior is explicitly requested; a real implementation must use authenticated backend credential handling instead.

## Acceptance Criteria

- Name, Email, and Password controls render at a shorter width on desktop while remaining full-width on narrow screens.
- A **Save Changes** button appears below the fields and is keyboard accessible.
- Saving writes the current Name, Email, and Password and announces a confirmation.
- Reloading or remounting Settings restores the saved values.
- Password visibility and Change Password behavior still work.
- Existing authentication, routes, and other pages are unaffected.
