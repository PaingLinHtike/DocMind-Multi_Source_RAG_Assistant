# DocMind Authentication Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build responsive, functional Sign In and Sign Up screens matching the supplied DocMind references.

**Architecture:** Add standalone auth routes beside the current `AppLayout` route tree. Keep credential and password-rule logic in a small pure helper module, and share visual structure through focused auth layout/field components while page components own form state and navigation.

**Tech Stack:** React 19, React Router 7, Tailwind CSS 4, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-11-06-docmind-auth-screens-design.md`

## Global Constraints

- Dummy account is exactly `user@gmail.com` / `userUSER1234@@` after trimming/lowercasing email; password comparison remains exact.
- Sign Up passwords require at least 8 characters and at least one uppercase letter, lowercase letter, number, and symbol.
- No backend, persistent session, route guard, or new dependency.
- Preserve all existing routes, local assets, 44px controls, visible focus, and 320px responsive support.
- Do not restore or stage `frontend/.env`; do not alter pre-existing untracked plan/spec files.

## Review Focus

- Whitespace and email casing: Sign In should normalize only the email and never mutate the password.
- Password-rule boundaries: exactly 8 valid characters passes; each missing character class fails with clear feedback.
- Failed submission: entered values remain, errors are announced, and navigation does not occur.
- Password toggles: changing visibility preserves values and works independently on both Sign Up password fields.
- Narrow screens: form and benefits stack without clipping, overlap, or horizontal page scrolling at 320px.

---

### Task 1: Authentication validation contract

**Files:**
- Create: `frontend/src/auth/auth.js`
- Create: `frontend/src/test/auth-helpers.test.js`

**Interfaces:**
- Produces: `DUMMY_ACCOUNT: { email: string, password: string }`
- Produces: `validateCredentials(email: string, password: string): boolean`
- Produces: `getPasswordValidation(password: string): { minLength: boolean, uppercase: boolean, lowercase: boolean, number: boolean, symbol: boolean, valid: boolean }`

- [ ] **Step 1: Write failing helper tests**

Add tests asserting the exact dummy account, trimmed/case-normalized email acceptance, exact password comparison, the valid 8-character boundary, and separate failures for missing uppercase, lowercase, number, symbol, and minimum length.

- [ ] **Step 2: Run the helper tests and verify RED**

Run: `npm test -- --run src/test/auth-helpers.test.js`

Expected: FAIL because `../auth/auth.js` does not exist.

- [ ] **Step 3: Implement the pure helper module**

Implement the three exported interfaces with no React or browser dependencies. Treat symbols as characters outside ASCII letters and digits.

- [ ] **Step 4: Run the helper tests and verify GREEN**

Run: `npm test -- --run src/test/auth-helpers.test.js`

Expected: all helper tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/auth/auth.js frontend/src/test/auth-helpers.test.js
git commit -m "feat(frontend): add auth validation helpers"
```

### Task 2: Shared authentication visual system and routes

**Files:**
- Create: `frontend/src/components/auth/AuthLayout.jsx`
- Create: `frontend/src/components/auth/AuthField.jsx`
- Modify: `frontend/src/components/ui/Icon.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/index.css`
- Create: `frontend/src/pages/SignInPage.jsx`
- Create: `frontend/src/pages/SignUpPage.jsx`
- Create: `frontend/src/test/auth-routes.test.jsx`

**Interfaces:**
- Consumes: validation exports from Task 1.
- Produces: `AuthLayout({ children, variant })`, where `variant` is `'signin' | 'signup'` and selects the reference-specific benefits content.
- Produces: `AuthField({ id, label, icon, type, value, onChange, placeholder, autoComplete, error, trailingControl })`.
- Produces: `/signin` and `/signup` React Router routes rendered outside `AppLayout`.

- [ ] **Step 1: Write failing route and static-layout tests**

Test that `/signin` renders “Welcome back,” `/signup` renders “Create your account,” each page links to the other, auth routes omit primary app navigation, labels are associated with inputs, local DocMind assets render, and both page cards expose responsive one-column/desktop-two-column classes.

- [ ] **Step 2: Run route tests and verify RED**

Run: `npm test -- --run src/test/auth-routes.test.jsx`

Expected: FAIL because the routes and pages do not exist.

- [ ] **Step 3: Add the standalone auth routes and shared components**

Use the existing local DocMind icon, theme colors, and no external assets. Add only the line icons needed by the references to `Icon.jsx`. Build desktop split cards and mobile stacked cards with CSS/Tailwind; decorative curves must be `aria-hidden` and non-interactive.

- [ ] **Step 4: Run route and existing shell tests**

Run: `npm test -- --run src/test/auth-routes.test.jsx src/test/shell.test.jsx src/test/assets.test.jsx`

Expected: all selected tests pass and existing application routes retain `AppLayout`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/auth frontend/src/components/ui/Icon.jsx frontend/src/pages/SignInPage.jsx frontend/src/pages/SignUpPage.jsx frontend/src/App.jsx frontend/src/index.css frontend/src/test/auth-routes.test.jsx
git commit -m "feat(frontend): add responsive auth screens"
```

### Task 3: Sign In behavior

**Files:**
- Modify: `frontend/src/pages/SignInPage.jsx`
- Create: `frontend/src/test/signin.test.jsx`

**Interfaces:**
- Consumes: `validateCredentials(email, password)` from Task 1 and `AuthLayout`/`AuthField` from Task 2.
- Produces: functional email/password form, Remember Me checkbox, visibility toggle, inline error, and successful navigation to `/`.

- [ ] **Step 1: Write failing Sign In interaction tests**

Test empty and incorrect submission errors, no navigation on failure, email trimming/case normalization, exact password behavior, password visibility preserving its value, Remember Me toggling, success feedback passed from Sign Up route state, and valid dummy credentials navigating to the Dashboard.

- [ ] **Step 2: Run Sign In tests and verify RED**

Run: `npm test -- --run src/test/signin.test.jsx`

Expected: FAIL on missing form behavior.

- [ ] **Step 3: Implement Sign In form behavior**

Keep field values after errors, put error/success feedback in `aria-live` regions, and use React Router navigation only after `validateCredentials` returns true.

- [ ] **Step 4: Run Sign In tests and verify GREEN**

Run: `npm test -- --run src/test/signin.test.jsx`

Expected: all Sign In tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/SignInPage.jsx frontend/src/test/signin.test.jsx
git commit -m "feat(frontend): add dummy sign in flow"
```

### Task 4: Sign Up behavior and password guidance

**Files:**
- Modify: `frontend/src/pages/SignUpPage.jsx`
- Create: `frontend/src/test/signup.test.jsx`

**Interfaces:**
- Consumes: `getPasswordValidation(password)` from Task 1 and shared components from Task 2.
- Produces: validated registration prototype that navigates to `/signin` with `{ state: { signupComplete: true } }` after valid submission.

- [ ] **Step 1: Write failing Sign Up interaction tests**

Test required name/email fields, invalid email, every password-rule failure, the exact 8-character valid boundary, mismatched confirmation, unaccepted Terms, independent password toggles preserving values, retained values after failure, and valid submission redirecting to Sign In with success feedback.

- [ ] **Step 2: Run Sign Up tests and verify RED**

Run: `npm test -- --run src/test/signup.test.jsx`

Expected: FAIL on missing validation and submission behavior.

- [ ] **Step 3: Implement Sign Up behavior**

Show concise password guidance and field-level errors without changing the approved desktop hierarchy. Keep Terms and Privacy Policy visually link-like but do not add destination routes.

- [ ] **Step 4: Run Sign Up tests and verify GREEN**

Run: `npm test -- --run src/test/signup.test.jsx`

Expected: all Sign Up tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/SignUpPage.jsx frontend/src/test/signup.test.jsx
git commit -m "feat(frontend): add validated sign up flow"
```

### Task 5: Responsive visual verification and release checks

**Files:**
- Modify as needed: auth files from Tasks 2-4
- Modify: `frontend/src/test/visual-system.test.jsx`

**Interfaces:**
- Consumes: completed auth screens.
- Produces: verified desktop/mobile presentation with no regressions.

- [ ] **Step 1: Add visual-system regression assertions**

Assert 44px minimum inputs/buttons, standard typography sizes, responsive stacking classes, decorative elements excluded from accessibility, and password toggle icons using established icon sizes.

- [ ] **Step 2: Run all automated checks**

Run: `npm test -- --run`

Expected: all tests pass.

Run: `npm run lint`

Expected: ESLint exits successfully with no output errors.

Run: `npm run build`

Expected: Vite production build succeeds.

- [ ] **Step 3: Verify in a real browser**

Check `/signin` and `/signup` at 1440×810 and 320×800. Compare desktop composition against both supplied PNGs; verify no horizontal overflow, focus visibility, error states, both password toggles, route links, and successful dummy login.

- [ ] **Step 4: Fix any verified gaps and repeat checks**

Repeat the focused tests plus full test, lint, build, and browser screenshots after any correction.

- [ ] **Step 5: Commit**

```bash
git add frontend/src frontend/src/test
git commit -m "test(frontend): verify auth screen experience"
```
