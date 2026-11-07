# Password Requirements Checklist Design

**Date:** 2026-11-07

**Status:** Approved

## Intent

On the Create account screen, make the existing password policy visible while the user types. Show the five rules under the Password field and switch each rule to a check mark as soon as it becomes true, without changing validation or submission behavior.

## Goals

- Show all five password rules under the Password field at all times, before and during typing.
- Mark each rule met or unmet live from the existing `getPasswordValidation` result.
- Communicate state with shape and words, never color alone.
- Link the checklist to the Password input through `aria-describedby`.
- Preserve routes, authentication, validation messages, submission behavior, password toggles, test IDs, and storage keys.
- Reuse the shared `Field` primitive and the single `Icon` family.

## Non-goals

- Do not change the password policy, its error message, or when the form accepts a password.
- Do not put a checklist under Confirm password.
- Do not show a password-strength meter, estimate, or score.
- Do not add a dependency, storage key, route, or backend call.
- Do not make the checklist a focus-only popover or tooltip.

## Approaches

### Selected: always-visible checklist as a Field description

Add a `description` slot to the shared `Field` primitive, rendered below the control and linked through `aria-describedby`. Build a small `PasswordRequirements` component that calls `getPasswordValidation` and renders five fixed rules. The Password field supplies the component as its description.

This keeps the policy in one place, makes the rules discoverable before typing, and gives every field a reusable way to describe itself.

### Rejected: checklist markup inline in `SignUpPage`

Inlining the list and state logic in the page would work but would put presentation, validation mapping, and accessibility wiring in an already busy form. A component keeps those concerns together and makes the state easy to test.

### Rejected: checklist appears only on focus or in a tooltip

A focus-only panel hides the rules from anyone scanning the form, is harder to use with touch and screen readers, and can obscure other fields. The rules are short enough to stay visible.

### Rejected: password-strength meter

A score is a different feature: it would imply policy beyond the five binary rules and would need new thresholds and copy. The request is a per-rule checklist.

## Design

### Field extension

`frontend/src/components/ui/Field.jsx` gains an optional `description` prop (a React node).

- The description renders below the control, after any error or helper message.
- It gets the stable ID `${id}-description`.
- The input's `aria-describedby` lists the error or helper ID first, then the description ID, space-separated. With no error, helper, or description, the attribute remains absent.
- Existing fields that do not pass `description` render and behave exactly as before.

### Password requirements component

New file: `frontend/src/components/auth/PasswordRequirements.jsx`.

Prop: `password`.

- Calls `getPasswordValidation(password)`; it does not restate the policy.
- Renders a five-item list in this order and wording:
  1. At least 8 characters (`minLength`)
  2. One uppercase letter (`uppercase`)
  3. One lowercase letter (`lowercase`)
  4. One number (`number`)
  5. One symbol (`symbol`)
- The list has `aria-label="Password requirements"`, `aria-live="polite"`, and `aria-atomic="false"`, so a rule changing state is announced without repeating the entire checklist.
- Unmet item: hollow `circle` icon, `text-text-muted`, and screen-reader text `Not met:` before the rule.
- Met item: `check` icon, `text-success`, and screen-reader text `Met:` before the rule.
- Icons are 16px and decorative (`aria-hidden` comes from `Icon`); the visible rule text plus the screen-reader state carry the meaning.
- The list wraps cleanly at narrow widths and the icon never squeezes the text.

### Create account wiring

`frontend/src/pages/SignUpPage.jsx` passes:

```jsx
description={<PasswordRequirements password={form.password} />}
```

to the Password `AuthField` only. No other signup field changes. The Field
description wrapper carries the ID `signup-password-description`, which is the
Password input's description target.

### Icons

Add two glyphs to `frontend/src/components/ui/Icon.jsx` using the existing 24×24 outline family:

- `check`: a check mark path.
- `circle`: an unfilled circle.

Add both names to the icon contract test in `frontend/src/test/visual-system.test.jsx`.

### Visual treatment

- Checklist text: Inter 14px, line height 20px, 4px between rows.
- Met text uses `--color-success` (`green-700`); unmet text uses `--color-text-muted` (`ink-600`).
- No background, border, or card; the checklist is persistent helper text on the paper canvas.
- No animation, so reduced-motion behavior is unchanged.

## Accessibility

- The Password input's accessible description contains the five rule states.
- When a password error is present, the input references both the error and the checklist.
- State is conveyed by icon shape, text color, and the screen-reader words `Met` / `Not met`; color is never the only signal.
- The list uses native list semantics and is not focusable.
- Contrast: `green-700` on `paper-0` is above 4.5:1; `ink-600` on `paper-0` is above 4.5:1.
- No new focus target and no focus-ring change.

## Acceptance Criteria

- Before typing, the Password field is followed by all five requirements, each showing the hollow circle and `Not met`.
- Typing a password updates each rule independently and immediately; satisfying all five shows five check marks and `Met` for each.
- The Password input's `aria-describedby` includes `signup-password-description`.
- After an invalid submit, `aria-describedby` includes both `signup-password-error` and `signup-password-description`.
- The checklist appears only under Password, not Confirm password.
- Existing validation, error text, submission, redirect, and password visibility tests still pass.
- The checklist fits at 320px and 375px without page overflow and remains readable at 200% zoom.
- `npm test -- --run`, `npm run lint`, and `npm run build` pass.
- Real-browser verification covers the checklist states, accessibility wiring, layout at 375/1440, and 200% zoom equivalent.

## Documentation

- Update `docs/design-system/docmind/MASTER.md` section 9.2 to record the Field description slot.
- Update section 10.2 to record the always-visible password checklist.
- Record executed browser evidence for this change in `docs/design-system/docmind/QA.md`.
