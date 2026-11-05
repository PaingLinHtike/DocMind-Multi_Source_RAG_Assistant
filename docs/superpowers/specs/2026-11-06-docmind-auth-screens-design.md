# DocMind Authentication Screens Design

## Intent

Add responsive Sign In and Sign Up screens to the existing DocMind frontend, closely matching the two supplied preview images while making the forms useful as a frontend-only prototype.

## Goals

- Add `/signin` and `/signup` routes outside the existing authenticated application shell.
- Match the previews' dark navy canvas, purple accents, two-column desktop card, branded header, form hierarchy, feature callouts, and ambient corner decoration.
- Stack the form and benefits content cleanly on smaller screens without horizontal scrolling.
- Accept the dummy account `user@gmail.com` / `userUSER1234@@` on Sign In and navigate to `/` after success.
- Validate Sign Up fields, matching password confirmation, Terms acceptance, and a password that is at least 8 characters and includes uppercase, lowercase, numeric, and symbol characters.
- Preserve accessible labels, visible keyboard focus, 44px minimum controls, password visibility toggles, and useful inline errors.

## Non-goals

- No backend, API, token, session persistence, or route protection.
- Sign Up does not create a persistent account; a valid submission redirects to Sign In with success feedback.
- Forgot Password, Terms, and Privacy Policy do not require full destination pages in this prototype.

## Constraints

- Use React 19, React Router, Tailwind CSS, and existing local DocMind assets.
- Do not add component or icon dependencies.
- Keep the existing application routes and visual identity unchanged.
- Keep the user's deleted `frontend/.env` and pre-existing untracked planning/spec files untouched.

## Approaches

### Chosen: functional frontend prototype

Build reusable authentication layout and field components, shared validation helpers, and real client-side form behavior. This adds modest code but makes the supplied dummy credentials, password rules, errors, navigation, and responsive design testable.

### Rejected: static visual-only screens

This would reproduce the screenshots faster but would not use the supplied dummy account or password requirements and would leave the primary actions misleadingly inert.

## Interaction Design

### Sign In

- Email and password start empty and use the preview copy as placeholders.
- Password visibility is toggleable.
- Remember Me is an interactive checkbox but does not persist a session.
- Submission trims and lowercases the email, compares the password exactly, and shows an inline error for invalid credentials.
- Valid credentials navigate to the Dashboard at `/`.
- “Sign Up” links to `/signup`.

### Sign Up

- Requires full name, a syntactically valid email, password, matching confirmation, and accepted Terms.
- Password validation requires at least 8 characters plus uppercase, lowercase, number, and symbol.
- Both password fields have visibility controls.
- Errors appear inline and are announced accessibly without clearing entered values.
- A valid submission navigates to `/signin` with a success message.
- “Sign In” links to `/signin`.

## Visual Design

- Authentication pages use a standalone full-height shell with the local DocMind book mark and wordmark.
- On desktop, the centered card is split into a wider form panel and a benefits panel by a subtle vertical border.
- On mobile/tablet, the card becomes one column with a horizontal divider and compact spacing.
- Inputs use the app's existing surface and border colors, leading icons, rounded corners, and restrained purple focus styling.
- Primary actions use a full-width purple gradient treatment matching the references.
- Decorative teal and purple curves remain non-interactive and hidden or simplified where viewport space is limited.

## Success Criteria

- Both routes visually correspond to their supplied preview at desktop size and remain usable at 320px width.
- The dummy credentials sign in successfully; incorrect credentials do not navigate.
- Every password rule is independently enforced on Sign Up.
- Existing DocMind tests, lint, and production build continue to pass.
