# Password Requirements Checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the five existing password rules under the Create account Password field and switch each to a check mark live as it becomes true.

**Architecture:** Extend the shared `Field` primitive with a persistent `description` slot linked by `aria-describedby`. Add a small `PasswordRequirements` component that maps `getPasswordValidation` results to a five-item list with shape-plus-text state, then pass it as the Password field's description. No policy, route, auth, storage, or submission changes.

**Tech Stack:** React 19, Vite 8, Vitest 5, Testing Library, Tailwind CSS 4, Playwright-core for real-browser verification.

**Spec:** `docs/superpowers/specs/2026-11-07-password-requirements-checklist-design.md`

## Global Constraints

- Reuse `getPasswordValidation` from `frontend/src/auth/auth.js`; do not restate or change the policy.
- Keep the existing error copy: `Use 8+ characters with uppercase, lowercase, number, and symbol.`
- Exact rule labels: `At least 8 characters`, `One uppercase letter`, `One lowercase letter`, `One number`, `One symbol`.
- State is never color-only: hollow circle + `Not met:`, check + `Met:`.
- Use Paper & Ink tokens: unmet `text-text-muted`, met `text-success`, paper surfaces, 2px oxide focus rings.
- Add no dependencies, routes, storage keys, or backend calls.
- Do not change authentication, redirects, password toggles, test IDs, or existing test expectations.
- Do not commit `frontend/.opencode/` and do not push without authorization.
- Run commands from `frontend/` unless stated otherwise.

## Review Focus

- **Non-ASCII letters:** `Ää1!aaaa` must show uppercase/lowercase unmet because the existing policy is ASCII-only; the checklist must mirror the validator, not intuition (Task 3 table).
- **Whitespace as symbol:** `Aa1 aaaa` counts the space as the symbol and is therefore fully met; this is existing policy (Task 3 table).
- **Error plus checklist:** an invalid submit must keep both `signup-password-error` and `signup-password-description` in `aria-describedby`, in that order (Task 3).
- **Very long password:** a 128-character value at 375px must not create page overflow or clip the checklist (Task 5).
- **Scope and toggling:** the checklist appears only on Create account, not Sign in or Confirm password, and show/hide password does not reset it (Task 3).

---

### Task 1: Add check and circle icons

**Files:**
- Modify: `frontend/src/test/visual-system.test.jsx:26-32`
- Modify: `frontend/src/components/ui/Icon.jsx:1-32`

**Interfaces:**
- Consumes: the existing `Icon` contract (`name`, optional `size`, 24×24 viewBox, 1.75 stroke, decorative).
- Produces: `Icon name="check"` and `Icon name="circle"` render valid decorative SVGs at any supported size.

- [ ] **Step 1: Add both names to the icon contract array**

In `frontend/src/test/visual-system.test.jsx`, extend `iconNames`:

```js
const iconNames = [
  'menu', 'plus', 'send', 'chevronDown', 'eye', 'eyeOff', 'logout', 'more',
  'mail', 'lock', 'user', 'messageCircle', 'layers', 'fileText', 'bookOpen',
  'dashboard', 'chat', 'documents', 'upload', 'settings', 'search', 'file',
  'link', 'externalLink', 'download', 'refresh', 'edit', 'trash',
  'chevronRight', 'arrowRight', 'check', 'circle',
]
```

- [ ] **Step 2: Run the icon contract test to verify it fails**

Run: `npm test -- --run src/test/visual-system.test.jsx -t "renders the check icon"`
Expected: FAIL — `container.querySelector('svg')` is `null`, so `toHaveAttribute` fails.

- [ ] **Step 3: Add the glyphs to `frontend/src/components/ui/Icon.jsx`**

Add these entries to the `icons` object, keeping the family's stroke-only style:

```jsx
check: <path d="m20 6-11 11-5-5" />,
circle: <circle cx="12" cy="12" r="5" />,
```

- [ ] **Step 4: Run the icon contract tests to verify they pass**

Run: `npm test -- --run src/test/visual-system.test.jsx -t "icon"`
Expected: PASS — both new cases render a 20px decorative SVG with the existing attributes.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Icon.jsx frontend/src/test/visual-system.test.jsx
git commit -m "feat(frontend): add check and circle icons"
```

---

### Task 2: Link a persistent field description

**Files:**
- Modify: `frontend/src/components/ui/Field.jsx:4-23`
- Modify: `frontend/src/test/visual-system.test.jsx` (import and new test)

**Interfaces:**
- Consumes: existing `Field` props and error/helper IDs.
- Produces: `Field` accepts `description?: ReactNode`, renders it after the control with ID `${id}-description`, and sets `aria-describedby` to `[error|helper, description]` joined by spaces. With no description, behavior is unchanged.

- [ ] **Step 1: Write the failing Field description test**

Add `import Field from '../components/ui/Field.jsx'` to `frontend/src/test/visual-system.test.jsx`, then add:

```jsx
it('links a persistent field description alongside errors and helpers', () => {
  const { rerender } = render(
    <Field description={<p>At least 8 characters</p>} id="query" label="Search" onChange={() => {}} value="" />,
  )

  expect(screen.getByLabelText('Search')).toHaveAttribute('aria-describedby', 'query-description')
  expect(document.getElementById('query-description')).toHaveTextContent('At least 8 characters')

  rerender(
    <Field description={<p>At least 8 characters</p>} error="Required" id="query" label="Search" onChange={() => {}} value="" />,
  )
  expect(screen.getByLabelText('Search')).toHaveAttribute('aria-describedby', 'query-error query-description')
  expect(document.getElementById('query-description')).toHaveTextContent('At least 8 characters')

  rerender(
    <Field description={<p>At least 8 characters</p>} helperText="Searches titles and text." id="query" label="Search" onChange={() => {}} value="" />,
  )
  expect(screen.getByLabelText('Search')).toHaveAttribute('aria-describedby', 'query-helper query-description')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/test/visual-system.test.jsx -t "persistent field description"`
Expected: FAIL — `aria-describedby` is absent and no `query-description` element exists.

- [ ] **Step 3: Implement the description slot in `frontend/src/components/ui/Field.jsx`**

Accept `description` in the signature. Replace the single `descriptionId` computation with:

```js
const messageId = error ? `${id}-error` : helperText ? `${id}-helper` : undefined
const descriptionId = description ? `${id}-description` : undefined
const describedBy = [messageId, descriptionId].filter(Boolean).join(' ') || undefined
```

Use `aria-describedby={describedBy}` on the input. Keep the existing helper and error rendering, and append:

```jsx
{description && <div className="mt-1.5" id={descriptionId}>{description}</div>}
```

- [ ] **Step 4: Run the Field and visual-system tests**

Run: `npm test -- --run src/test/visual-system.test.jsx`
Expected: PASS — the new description test and all existing field/visual contracts pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Field.jsx frontend/src/test/visual-system.test.jsx
git commit -m "feat(frontend): link persistent field descriptions"
```

---

### Task 3: Build the checklist and wire it into Create account

**Files:**
- Create: `frontend/src/components/auth/PasswordRequirements.jsx`
- Modify: `frontend/src/pages/SignUpPage.jsx` (import and Password field)
- Modify: `frontend/src/test/signup.test.jsx`
- Modify: `frontend/src/test/signin.test.jsx`

**Interfaces:**
- Consumes: `getPasswordValidation(password)` returning `{ minLength, uppercase, lowercase, number, symbol, valid }`; `Icon` `check`/`circle`; `Field` `description`.
- Produces: `<PasswordRequirements password={string} />` renders a named five-item list. The Password input's description ID is `signup-password-description`.

- [ ] **Step 1: Write the failing signup checklist tests**

In `frontend/src/test/signup.test.jsx`, change the Testing Library import to include `within`:

```js
import { screen, within } from '@testing-library/react'
```

Add these tests inside the existing `describe('Sign Up', ...)`:

```jsx
it('shows every password requirement unmet and links the list to the password field', () => {
  renderApp({ route: '/signup', authenticated: false })

  const list = screen.getByRole('list', { name: 'Password requirements' })
  const items = within(list).getAllByRole('listitem')

  expect(items).toHaveLength(5)
  for (const label of [
    'At least 8 characters',
    'One uppercase letter',
    'One lowercase letter',
    'One number',
    'One symbol',
  ]) {
    expect(within(list).getByText(label)).toBeInTheDocument()
  }
  expect(within(list).getAllByText('Not met:')).toHaveLength(5)
  expect(screen.getByLabelText('Password')).toHaveAttribute('aria-describedby', 'signup-password-description')
  expect(document.getElementById('signup-password-description')).toContainElement(list)
  expect(list).toHaveAttribute('aria-live', 'polite')
  expect(list).toHaveAttribute('aria-atomic', 'false')
  expect(screen.getByLabelText('Confirm password')).not.toHaveAttribute('aria-describedby')
})

it.each([
  ['', [false, false, false, false, false]],
  ['Aa1!aaa', [false, true, true, true, true]],
  ['aa1!aaaa', [true, false, true, true, true]],
  ['AA1!AAAA', [true, true, false, true, true]],
  ['Aa!!aaaa', [true, true, true, false, true]],
  ['Aa11aaaa', [true, true, true, true, false]],
  ['Aa1!aaaa', [true, true, true, true, true]],
  ['Ää1!aaaa', [true, false, false, true, true]],
  ['Aa1 aaaa', [true, true, true, true, true]],
])('marks requirements for %j', async (password, states) => {
  const user = userEvent.setup()
  renderApp({ route: '/signup', authenticated: false })
  if (password) await user.type(screen.getByLabelText('Password'), password)

  const list = screen.getByRole('list', { name: 'Password requirements' })
  const items = within(list).getAllByRole('listitem')

  items.forEach((item, index) => {
    expect(item).toHaveClass(states[index] ? 'text-success' : 'text-text-muted')
    expect(within(item).getByText(states[index] ? 'Met:' : 'Not met:')).toBeInTheDocument()

    const icon = item.querySelector('svg')
    expect(icon).toHaveAttribute('width', '16')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    if (states[index]) expect(icon.querySelector('path')).not.toBeNull()
    else expect(icon.querySelector('circle')).not.toBeNull()
  })
})

it('keeps the checklist linked when the password error appears', async () => {
  const user = userEvent.setup()
  renderApp({ route: '/signup', authenticated: false })
  await user.type(screen.getByLabelText('Password'), 'short')
  await user.click(screen.getByRole('button', { name: 'Create account' }))

  expect(screen.getByText('Use 8+ characters with uppercase, lowercase, number, and symbol.')).toBeInTheDocument()
  expect(screen.getByLabelText('Password')).toHaveAttribute(
    'aria-describedby',
    'signup-password-error signup-password-description',
  )
})

it('keeps requirement state when password visibility is toggled', async () => {
  const user = userEvent.setup()
  renderApp({ route: '/signup', authenticated: false })
  await user.type(screen.getByLabelText('Password'), 'Aa1!aaaa')

  const list = screen.getByRole('list', { name: 'Password requirements' })
  expect(within(list).getAllByText('Met:')).toHaveLength(5)

  await user.click(screen.getByRole('button', { name: 'Show password' }))
  expect(within(list).getAllByText('Met:')).toHaveLength(5)
})
```

In `frontend/src/test/signin.test.jsx`, add:

```jsx
it('does not render the create-account password checklist', () => {
  renderApp({ route: '/signin', authenticated: false })
  expect(screen.queryByRole('list', { name: 'Password requirements' })).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the signup tests to verify they fail**

Run: `npm test -- --run src/test/signup.test.jsx src/test/signin.test.jsx`
Expected: FAIL — no list named `Password requirements`; `aria-describedby` is absent.

- [ ] **Step 3: Create `frontend/src/components/auth/PasswordRequirements.jsx`**

```jsx
import { getPasswordValidation } from '../../auth/auth.js'
import Icon from '../ui/Icon.jsx'

const rules = [
  { key: 'minLength', label: 'At least 8 characters' },
  { key: 'uppercase', label: 'One uppercase letter' },
  { key: 'lowercase', label: 'One lowercase letter' },
  { key: 'number', label: 'One number' },
  { key: 'symbol', label: 'One symbol' },
]

export default function PasswordRequirements({ password }) {
  const validation = getPasswordValidation(password)

  return (
    <ul aria-atomic="false" aria-label="Password requirements" aria-live="polite" className="space-y-1 text-sm leading-5">
      {rules.map(({ key, label }) => {
        const met = validation[key]
        return (
          <li className={`flex items-start gap-2 ${met ? 'text-success' : 'text-text-muted'}`} key={key}>
            <Icon className="mt-0.5 shrink-0" name={met ? 'check' : 'circle'} size={16} />
            <span className="min-w-0">
              <span className="sr-only">{met ? 'Met: ' : 'Not met: '}</span>
              {label}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 4: Wire it into `frontend/src/pages/SignUpPage.jsx`**

Add the import:

```js
import PasswordRequirements from '../components/auth/PasswordRequirements.jsx'
```

Add `description` to the Password `AuthField` only:

```jsx
<AuthField
  autoComplete="new-password"
  description={<PasswordRequirements password={form.password} />}
  error={errors.password}
  id="signup-password"
  icon="lock"
  label="Password"
  onChange={(event) => updateField('password', event.target.value)}
  placeholder="Password"
  trailingControl={visibilityToggle('password')}
  type={passwordVisible ? 'text' : 'password'}
  value={form.password}
/>
```

Keep the Confirm password field unchanged.

- [ ] **Step 5: Run the signup, signin, and visual-system tests**

Run: `npm test -- --run src/test/signup.test.jsx src/test/signin.test.jsx src/test/visual-system.test.jsx`
Expected: PASS — all checklist cases, the ASCII/whitespace policy cases, error linkage, toggle persistence, and existing signup behavior pass.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/auth/PasswordRequirements.jsx frontend/src/pages/SignUpPage.jsx frontend/src/test/signup.test.jsx frontend/src/test/signin.test.jsx
git commit -m "feat(frontend): show password requirements on sign up"
```

---

### Task 4: Document the checklist in the design system

**Files:**
- Modify: `docs/design-system/docmind/MASTER.md` (sections 9.2 and 10.2)

**Interfaces:**
- Consumes: the implemented Field description and checklist behavior.
- Produces: the binding design-system record for future work.

- [ ] **Step 1: Update Field section 9.2**

After the existing error bullet, add:

```markdown
- A field may carry a persistent description block below the control, linked after any error or helper ID through `aria-describedby`; use it for rules that stay visible while typing.
```

- [ ] **Step 2: Update the auth section 10.2**

After the paragraph that preserves validation and password toggles, add:

```markdown
The Password field carries an always-visible five-rule checklist: at least 8 characters, one uppercase letter, one lowercase letter, one number, and one symbol. Each rule switches from a hollow circle with `Not met` to a check mark with `Met` as it becomes true; the list is the field's description and never replaces the existing validation message.
```

- [ ] **Step 3: Verify the documentation**

Run: `Select-String -Path 'docs/design-system/docmind/MASTER.md' -Pattern 'persistent description block|five-rule checklist'`
Expected: two matches.

- [ ] **Step 4: Commit**

```bash
git add docs/design-system/docmind/MASTER.md
git commit -m "docs(frontend): document password checklist"
```

---

### Task 5: Run release gates and real-browser verification

**Files:**
- Modify: `docs/design-system/docmind/QA.md`
- Temporary (not committed): browser script under `C:\Users\pyaes\AppData\Local\Temp\opencode\docmind-qa\`

**Interfaces:**
- Consumes: the shipped checklist from Task 3.
- Produces: executed evidence and a recorded limitation note.

- [ ] **Step 1: Run the whole automated suite**

Run: `npm test -- --run`
Expected: PASS — all test files pass; the previous 138 tests remain and the new checklist/field/icon tests are included.

- [ ] **Step 2: Run lint and the production build**

Run: `npm run lint`
Expected: PASS — no errors.

Run: `npm run build`
Expected: PASS — Vite production build completes.

- [ ] **Step 3: Serve the production build**

Run from the repository root:

```powershell
npm --prefix frontend run preview -- --port 4173 --strictPort
```

Expected: `Local: http://localhost:4173/`.

- [ ] **Step 4: Execute the browser checklist**

Create `password-checklist.js` in `C:\Users\pyaes\AppData\Local\Temp\opencode\docmind-qa\` using the installed `playwright-core` and Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`. Assert:

- `/signup` at 375×812, 768×1024, 1024×768, and 1440×900: no page horizontal overflow; the checklist is visible with five items; screenshot each empty state.
- At 375 and 1440, focus `#signup-password` and type `Aa1!aaa`: exactly four `Met:` items and one `Not met:` item; type the final `a`: five `Met:` items.
- Met text computes to `rgb(47, 107, 79)` (`green-700`) and unmet text to `rgb(107, 101, 90)` (`ink-600`).
- `#signup-password` has `aria-describedby="signup-password-description"` before submit.
- Submit `Aa1!aaa` with the rest of the form empty: the error appears and `aria-describedby` is `signup-password-error signup-password-description`.
- Toggling Show password keeps all five rules met; screenshots of met and error states.
- 720×450 CSS viewport (200% zoom equivalent): no page overflow; checklist visible and readable.
- At 375, a 128-character compliant password (`'Aa1!' + 'a'.repeat(124)`) leaves no page overflow and all five rules met.
- Under `forcedColors: 'active'`, every rule still has visible text and an SVG icon.

Expected: all checks pass. Record any failure and fix it before continuing.

- [ ] **Step 5: Update `docs/design-system/docmind/QA.md`**

Add a dated “Password requirements checklist” subsection with the executed checks, the Chrome version, the 375/768/1024/1440 and 200% zoom results, the state-color values, and the honest limitation that this was scripted headless Chrome rather than a physical-display review.

- [ ] **Step 6: Commit the QA record**

```bash
git add docs/design-system/docmind/QA.md
git commit -m "docs(frontend): record password checklist QA"
```

- [ ] **Step 7: Final repository check**

Run: `git status --short --branch`
Expected: branch `feature/password-checklist` is clean; `frontend/.opencode/` is not staged or committed.

Stop the preview process after verification. Do not push; present finishing options and request authorization first.
