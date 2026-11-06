# Settings Save Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shorten the Settings account controls and add a working **Save Changes** action that persists all three fields locally.

**Architecture:** `SettingsPage` owns one account object, initializes it from versioned `localStorage` with safe defaults, and wraps the account fields in a semantic form. The compact control column and form footer provide the shorter fields and Save action; a submit handler stores the object and announces success or storage failure.

**Tech Stack:** React 19, Tailwind CSS 4, Vitest, Testing Library, user-event

**Spec:** `docs/superpowers/specs/2026-11-06-settings-save-design.md`

## Global Constraints

- Use the storage key `docmind.account-settings.v1`.
- Defaults are `Aung`, `aung@example.com`, and `docmind123`.
- Persist Name, Email, and Password as requested for this prototype.
- Treat missing, malformed, or unreadable storage as defaults without crashing.
- Keep inputs and buttons 44px high and usable at 320px.
- Preserve labels, password visibility, Change Password feedback, authentication, routes, and the existing dark visual system.
- Storing a password in browser storage is a documented prototype limitation, not production credential handling.
- Add no dependencies.

## Review Focus

- Malformed JSON in `localStorage` must render defaults instead of crashing; Task 1 tests broken JSON.
- A partial saved object must fill only missing fields from defaults; Task 1 tests a saved name with default email and password.
- A blocked or full `localStorage` must keep the form usable and report failure; Task 1 mocks a throwing `setItem`.
- Saved values must survive a remount; Task 1 unmounts and rerenders Settings with the same storage.
- The Save action must be keyboard-accessible through native form submission; Task 1 checks the submit button is inside the form and saves through Enter.

---

### Task 1: Add the compact persistent account form

**Files:**
- Modify: `frontend/src/pages/SettingsPage.jsx`
- Modify: `frontend/src/test/upload-settings.test.jsx`
- Modify: `frontend/src/test/visual-system.test.jsx`
- Modify: `frontend/src/test/setup.js`

**Interfaces:**
- Consumes: `Icon`, `PageHeading`, `window.localStorage`, and the existing account defaults.
- Produces: `SETTINGS_STORAGE_KEY = 'docmind.account-settings.v1'`, `readAccountSettings()`, a semantic account form, and a `Save Changes` submit button.

- [ ] **Step 1: Write failing persistence and recovery tests**

In `frontend/src/test/upload-settings.test.jsx`, import `vi` from Vitest and add `const SETTINGS_STORAGE_KEY = 'docmind.account-settings.v1'`. Add these tests inside `describe('Settings', ...)`:

```jsx
it('saves all account fields locally and restores them after remount', async () => {
  const user = userEvent.setup()
  const first = renderApp({ route: '/settings' })
  const name = screen.getByLabelText('Name')
  const email = screen.getByLabelText('Email')
  const password = screen.getByLabelText('Password')

  await user.clear(name)
  await user.type(name, 'Aung Min')
  await user.clear(email)
  await user.type(email, 'aung.min@example.com')
  await user.clear(password)
  await user.type(password, 'new-secret')

  await user.click(screen.getByRole('button', { name: 'Save Changes' }))

  expect(screen.getByText('Account changes saved.')).toBeInTheDocument()
  expect(JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY))).toEqual({
    name: 'Aung Min',
    email: 'aung.min@example.com',
    password: 'new-secret',
  })

  first.unmount()
  renderApp({ route: '/settings' })

  expect(screen.getByLabelText('Name')).toHaveValue('Aung Min')
  expect(screen.getByLabelText('Email')).toHaveValue('aung.min@example.com')
  expect(screen.getByLabelText('Password')).toHaveValue('new-secret')
})

it('falls back to defaults for broken or incomplete stored settings', () => {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, '{broken')
  const first = renderApp({ route: '/settings' })

  expect(screen.getByLabelText('Name')).toHaveValue('Aung')
  expect(screen.getByLabelText('Email')).toHaveValue('aung@example.com')
  expect(screen.getByLabelText('Password')).toHaveValue('docmind123')

  first.unmount()
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ name: 'Stored Name' }))
  renderApp({ route: '/settings' })

  expect(screen.getByLabelText('Name')).toHaveValue('Stored Name')
  expect(screen.getByLabelText('Email')).toHaveValue('aung@example.com')
  expect(screen.getByLabelText('Password')).toHaveValue('docmind123')
})

it('keeps the form usable and reports failure when storage rejects a save', async () => {
  const user = userEvent.setup()
  renderApp({ route: '/settings' })
  const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage blocked')
  })

  try {
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  } finally {
    setItem.mockRestore()
  }

  expect(screen.getByText('Unable to save changes in this browser.')).toBeInTheDocument()
  expect(screen.getByLabelText('Email')).toHaveValue('aung@example.com')
})
```

- [ ] **Step 2: Write failing compact-layout and keyboard-contract tests**

In `frontend/src/test/upload-settings.test.jsx`, add a test that saves by pressing Enter from the Email field:

```jsx
it('submits the account form with Enter from a field', async () => {
  const user = userEvent.setup()
  renderApp({ route: '/settings' })
  const email = screen.getByLabelText('Email')

  await user.clear(email)
  await user.type(email, 'keyboard@example.com{Enter}')

  expect(screen.getByText('Account changes saved.')).toBeInTheDocument()
  expect(JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY)).email).toBe('keyboard@example.com')
})
```

In `frontend/src/test/visual-system.test.jsx`, add this visual contract test:

```jsx
it('uses compact account controls and a Save Changes submit action', () => {
  const { container } = renderApp({ route: '/settings' })
  const fields = container.querySelector('.account-fields')
  const save = screen.getByRole('button', { name: 'Save Changes' })

  expect(fields).toHaveClass('lg:grid-cols-[200px_minmax(0,480px)]')
  expect(save).toHaveAttribute('type', 'submit')
  expect(save).toHaveClass('h-11')
  expect(save.closest('form')).toBe(fields.closest('form'))
})
```

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npm test -- --run src/test/upload-settings.test.jsx src/test/visual-system.test.jsx`

Expected: FAIL because there is no Save button, no `localStorage` persistence, and no `.account-fields` compact grid.

- [ ] **Step 4: Add storage defaults and safe readers in `SettingsPage.jsx`**

Add the exact constant `SETTINGS_STORAGE_KEY = 'docmind.account-settings.v1'` and a `DEFAULT_ACCOUNT` object with `name: 'Aung'`, `email: 'aung@example.com'`, and `password: 'docmind123'`.

Implement `readAccountSettings()` to read and `JSON.parse` the key, return a copy of `DEFAULT_ACCOUNT` when parsing fails or the parsed value is not a plain object (excluding `null` and arrays), and copy the stored value only when that field is a string; otherwise use that field's default. Wrap the whole read in `try/catch`. Add a code comment stating that password persistence is prototype-only and must not be used for production credentials.

- [ ] **Step 5: Convert Settings state to one account object**

Replace the three field states with `const [account, setAccount] = useState(readAccountSettings)`. Keep `passwordVisible` and `feedback`.

Render Name, Email, and Password from `account`, and update through one `handleFieldChange(field, value)` helper or equivalent object spread. Keep `feedback` for both save and Change Password messages.

- [ ] **Step 6: Add the compact form and Save Changes action**

Wrap the account card in `<form onSubmit={handleSave}>`. Give the field grid `className="account-fields mt-6 grid gap-4 lg:grid-cols-[200px_minmax(0,480px)] lg:items-center lg:gap-x-10"`.

Change the password action row to `sm:grid-cols-[minmax(0,1fr)_150px]`. Add a footer grid item in the compact control column with a full-width-on-mobile, right-aligned-on-desktop **Save Changes** button, `type="submit"`, `h-11`, primary purple background/border, rounded corners, and hover state.

Move the feedback paragraph into the grid's compact column with `lg:col-start-2` and `max-w-[480px]`.

Implement `handleSave(event)` to call `event.preventDefault()`, write `JSON.stringify(account)` under `SETTINGS_STORAGE_KEY`, set `Account changes saved.` on success, and set `Unable to save changes in this browser.` when storage throws. Keep Change Password feedback unchanged.

- [ ] **Step 7: Isolate browser storage between tests**

In `frontend/src/test/setup.js`, add `window.localStorage.clear()` beside the existing `sessionStorage.clear()` in `afterEach`.

- [ ] **Step 8: Run focused tests and verify GREEN**

Run: `npm test -- --run src/test/upload-settings.test.jsx src/test/visual-system.test.jsx`

Expected: both files pass.

- [ ] **Step 9: Run complete verification**

Run:

```bash
npm test -- --run
npm run lint
npm run build
```

Expected: all tests pass, ESLint reports no errors, and Vite builds successfully.

- [ ] **Step 10: Verify in a browser**

At desktop and 375px widths, confirm the fields are shorter on desktop, full-width on mobile, password visibility still works, Save Changes persists values across reload, and both save success/failure messages are announced. Confirm Change Password still works and authentication/routes are unchanged.

- [ ] **Step 11: Commit**

```bash
git add frontend/src/pages/SettingsPage.jsx frontend/src/test/upload-settings.test.jsx frontend/src/test/visual-system.test.jsx frontend/src/test/setup.js
git commit -m "feat(frontend): save compact settings form"
```
