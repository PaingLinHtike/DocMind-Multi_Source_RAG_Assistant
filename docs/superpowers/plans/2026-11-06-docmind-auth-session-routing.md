# DocMind Authentication Session Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start DocMind on Sign In, persist successful login through refresh with `sessionStorage`, and prevent logged-out users from reopening protected routes.

**Architecture:** A small React authentication context owns the session flag and login/logout actions. Public-only and protected route boundaries use React Router redirects, while the existing application shell remains unchanged behind the protected boundary.

**Tech Stack:** React 19, React Router 7, browser `sessionStorage`, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-11-06-docmind-auth-session-routing-design.md`

## Global Constraints

- Keep the dummy credential contract `user@gmail.com` / `userUSER1234@@` unchanged.
- Persist only a minimal authenticated flag in `sessionStorage`; add no backend, token, cookie, API, role model, or long-lived login.
- Keep `/chat`, `/documents`, `/documents/:documentId`, `/upload`, and `/settings` paths unchanged.
- Use React Router replacement navigation for login, logout, and guard redirects.
- Add no dependencies.
- Do not alter the user's deleted `frontend/.env` or pre-existing untracked 2026-11-05 planning/spec files.

## Review Focus

- A storage value other than the exact authenticated marker must not unlock protected routes; Task 1 tests this tampering case.
- Direct navigation to nested protected URLs such as `/documents/employee-handbook` must redirect to Sign In; Task 1 tests it.
- An authenticated session visiting either public auth route must redirect to `/dashboard`; Task 1 tests both routes.
- A remount representing browser refresh must read the existing session instead of resetting it; Task 1 tests it.
- Logging out from a non-Dashboard protected route must clear the session and keep that route inaccessible afterward; Task 2 tests it.

---

### Task 1: Session state and route boundaries

**Files:**
- Create: `frontend/src/auth/AuthSession.jsx`
- Create: `frontend/src/auth/AuthRoute.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/pages/SignInPage.jsx`
- Modify: `frontend/src/test/renderApp.jsx`
- Modify: `frontend/src/test/setup.js`
- Create: `frontend/src/test/auth-session.test.jsx`
- Modify: `frontend/src/test/auth-routes.test.jsx`
- Modify: `frontend/src/test/signin.test.jsx`
- Modify: `frontend/src/test/signup.test.jsx`
- Modify: `frontend/src/test/visual-system.test.jsx`

**Interfaces:**
- Produces: `AUTH_SESSION_KEY = 'docmind.authenticated'`; only the exact stored value `'true'` is authenticated.
- Produces: `AuthProvider({ children })` and `useAuth(): { authenticated: boolean, login(): void, logout(): void }`.
- Produces: `ProtectedRoute()` and `PublicOnlyRoute()` outlet guards.
- Produces: `/` → `/signin`, `/dashboard` → existing Dashboard, protected application routes, and public-only `/signin` and `/signup`.

- [ ] **Step 1: Write failing session-routing tests**

In `auth-session.test.jsx`, assert that an unauthenticated `/` visit renders “Welcome back”; `/dashboard` and `/documents/employee-handbook` redirect to Sign In; arbitrary storage data does not authenticate; authenticated `/signin` and `/signup` visits render “Good morning, Aung”; valid dummy credentials store the marker and navigate to `/dashboard`; and unmounting/remounting at `/dashboard` with the existing storage still renders the Dashboard.

Update existing auth tests to request an unauthenticated renderer explicitly, and update Dashboard-oriented route expectations from `/` to `/dashboard` where needed.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run src/test/auth-session.test.jsx src/test/auth-routes.test.jsx src/test/signin.test.jsx src/test/signup.test.jsx src/test/visual-system.test.jsx`

Expected: FAIL because session context, route guards, and `/dashboard` do not exist.

- [ ] **Step 3: Implement session context and guards**

Create `AuthSession.jsx` with the interfaces above. Initialize state by accepting only the exact stored marker, write the marker in `login()`, and remove it in `logout()`.

Create `AuthRoute.jsx`: unauthenticated `ProtectedRoute()` returns `<Navigate to="/signin" replace />`; authenticated `PublicOnlyRoute()` returns `<Navigate to="/dashboard" replace />`; otherwise each returns `<Outlet />`.

- [ ] **Step 4: Rebuild the route tree and Sign In transition**

Wrap routes in `AuthProvider`. Redirect `/` to `/signin`; place `/signin` and `/signup` behind `PublicOnlyRoute`; place `AppLayout` and all application pages behind `ProtectedRoute`; map the Dashboard to `/dashboard`.

In `SignInPage`, call `login()` only after valid credentials and navigate to `/dashboard` with `{ replace: true }`.

- [ ] **Step 5: Make test session setup deterministic**

Implement `renderApp({ route = '/dashboard', authenticated = true, preserveSession = false } = {})`: unless `preserveSession` is true, write or remove the exact session marker before rendering. Clear `sessionStorage` in global test cleanup so tests cannot leak authentication.

- [ ] **Step 6: Run focused and full tests**

Run: `npm test -- --run src/test/auth-session.test.jsx src/test/auth-routes.test.jsx src/test/signin.test.jsx src/test/signup.test.jsx src/test/visual-system.test.jsx`

Expected: all focused tests PASS.

Run: `npm test -- --run`

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/auth frontend/src/App.jsx frontend/src/pages/SignInPage.jsx frontend/src/test
git commit -m "feat(frontend): protect app routes with session auth"
```

### Task 2: Functional Log Out and protected navigation links

**Files:**
- Modify: `frontend/src/components/layout/TopNav.jsx`
- Modify: `frontend/src/components/layout/ProfileMenu.jsx`
- Modify: `frontend/src/test/shell.test.jsx`
- Modify: `frontend/src/test/auth-session.test.jsx`

**Interfaces:**
- Consumes: `useAuth().logout()` and protected `/dashboard` route from Task 1.
- Produces: Dashboard brand/navigation links targeting `/dashboard`.
- Produces: Log Out that clears the session, closes the menu, and navigates to `/signin` with replacement.

- [ ] **Step 1: Write failing navigation and logout tests**

Assert that Dashboard links target `/dashboard`. Starting authenticated on `/documents`, open the profile menu and click Log Out; assert Sign In renders, the session key is absent, and a remount/direct attempt at `/documents` with the existing logged-out session still renders Sign In.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run src/test/shell.test.jsx src/test/auth-session.test.jsx`

Expected: FAIL because links still target `/` and Log Out only closes the menu.

- [ ] **Step 3: Wire protected links and Log Out**

Change the brand and Dashboard navigation destinations in `TopNav.jsx` to `/dashboard` and update active-link end matching.

In `ProfileMenu.jsx`, consume `logout()` and `useNavigate()`. On Log Out, close the menu, clear authentication, and navigate to `/signin` with `{ replace: true }`.

- [ ] **Step 4: Run focused and release checks**

Run: `npm test -- --run src/test/shell.test.jsx src/test/auth-session.test.jsx`

Expected: focused tests PASS.

Run: `npm test -- --run`

Expected: all tests PASS.

Run: `npm run lint`

Expected: ESLint exits successfully.

Run: `npm run build`

Expected: Vite production build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout frontend/src/test
git commit -m "feat(frontend): add secure prototype logout flow"
```
