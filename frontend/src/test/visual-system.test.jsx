import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Button from '../components/ui/Button.jsx'
import { buttonClasses } from '../components/ui/buttonStyles.js'
import Field from '../components/ui/Field.jsx'
import Icon from '../components/ui/Icon.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import ChatPage from '../pages/ChatPage.jsx'
import { renderApp } from './renderApp.jsx'

const stylesheet = readFileSync(resolve('src/index.css'), 'utf8')
const documentHtml = readFileSync(resolve('index.html'), 'utf8')

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? collectFiles(path) : [path]
  })
}

const productionJsx = collectFiles(resolve('src'))
  .filter((path) => extname(path) === '.jsx' && !relative(resolve('src'), path).startsWith('test'))

const iconNames = [
  'menu', 'plus', 'send', 'chevronDown', 'eye', 'eyeOff', 'logout', 'more',
  'mail', 'lock', 'user', 'messageCircle', 'layers', 'fileText', 'bookOpen',
  'dashboard', 'chat', 'documents', 'upload', 'settings', 'search', 'file',
  'link', 'externalLink', 'download', 'refresh', 'edit', 'trash',
  'chevronRight', 'arrowRight', 'check', 'circle',
]

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)

  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2])
}

function contrastRatio(first, second) {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('shared visual system', () => {
  it('keeps production JSX free of retired visual-system drift', () => {
    const sources = productionJsx.map((path) => ({ path: relative(resolve('src'), path), source: readFileSync(path, 'utf8') }))
    const combined = sources.map(({ path, source }) => `/* ${path} */\n${source}`).join('\n')

    expect(combined).not.toMatch(/#[0-9a-f]{6}\b/i)
    expect(combined).not.toMatch(/assets\/figma|bg-gradient|shadow-(?!none)|backdrop-blur|(?:^|\s)blur(?:-|\s)|bg-white\/|hover:bg-white\//i)
    expect(combined).not.toMatch(/863bff|7e14ff|ede6ff|7861bf|202a47|383e6e|navy|purple|blue-/i)
    expect(combined).not.toMatch(/Chat Activity|↑ \+20%|↑ \+17%|↑ \+32%/)
    expect(combined).toMatch(/import Button from ['"].*components\/ui\/Button\.jsx['"]/)
  })

  it('keeps global assets free of the retired purple palette', () => {
    const favicon = readFileSync(resolve('public/favicon.svg'), 'utf8')
    const globalSources = `${stylesheet}\n${documentHtml}\n${favicon}`

    expect(globalSources).not.toMatch(/#(?:863bff|7e14ff|ede6ff|7861bf|202a47|383e6e)/i)
    expect(stylesheet).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
    expect(stylesheet).toMatch(/@media\s*\(forced-colors:\s*active\)/)
  })

  it('defines the Paper & Ink primitive semantic and component token layers', () => {
    for (const declaration of [
      '--paper-100: #F4F1E8',
      '--ink-950: #171610',
      '--oxide-600: #B23A2B',
      '--color-border-strong: var(--paper-500)',
      '--button-primary-bg-active: var(--color-accent-active)',
      '--button-destructive-bg-hover: var(--color-danger-soft-hover)',
      '--control-disabled-fg: var(--color-disabled-fg)',
    ]) {
      expect(stylesheet).toContain(declaration)
    }
  })

  it('loads the approved fonts with resilient fallbacks', () => {
    expect(documentHtml).toContain('fonts.googleapis.com')
    expect(documentHtml).toContain('family=Newsreader:wght@500;600')
    expect(documentHtml).toContain('family=Inter:wght@400;500;600')
    expect(documentHtml).toContain('family=JetBrains+Mono:wght@400;500')
    expect(documentHtml).toContain('display=swap')
    expect(stylesheet).toContain('--font-display: "Newsreader", Georgia, "Times New Roman", serif')
    expect(stylesheet).toContain('--font-ui: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif')
    expect(stylesheet).toContain('--font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Consolas, monospace')
  })

  it.each(iconNames)('renders the %s icon as a decorative 20px SVG', (name) => {
    const { container } = render(<Icon name={name} />)
    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('width', '20')
    expect(svg).toHaveAttribute('height', '20')
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
    expect(svg).toHaveAttribute('stroke', 'currentColor')
    expect(svg).toHaveAttribute('stroke-width', '1.75')
  })

  it('uses an explicit icon size when provided', () => {
    const { container } = render(<Icon name="plus" size={16} />)
    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('width', '16')
    expect(svg).toHaveAttribute('height', '16')
  })

  it('uses the shared button variants and accessible sizes', () => {
    render(<Button>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })

    expect(button).toHaveClass('min-h-11', 'rounded-[2px]', 'bg-accent')
    expect(buttonClasses({ variant: 'secondary', size: 'icon' })).toContain('size-11')
    expect(buttonClasses({ variant: 'destructive' })).toContain('text-danger')
  })

  it('provides accessible shared field, surface, and rule primitives', async () => {
    for (const path of [
      'src/components/ui/Field.jsx',
      'src/components/ui/Surface.jsx',
      'src/components/ui/Rule.jsx',
    ]) expect(existsSync(resolve(path))).toBe(true)

    const componentPaths = ['../components/ui/Field.jsx', '../components/ui/Surface.jsx', '../components/ui/Rule.jsx']
    const [{ default: Field }, { default: Surface }, { default: Rule }] = await Promise.all(
      componentPaths.map((path) => import(/* @vite-ignore */ path)),
    )
    const onChange = vi.fn()
    const { container } = render(
      <Surface padding="compact">
        <Field id="query" label="Search" error="Required" value="" onChange={onChange} trailingControl={<button type="button">Clear</button>} />
        <Rule />
      </Surface>,
    )

    const field = screen.getByLabelText('Search')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAttribute('aria-describedby', 'query-error')
    fireEvent.change(field, { target: { value: 'policy' } })
    expect(onChange).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Clear' })).toHaveClass('min-h-11', 'min-w-11')
    expect(container.querySelector('[data-surface]')).toHaveClass('rounded-[2px]', 'p-4')
    expect(container.querySelector('hr')).toHaveClass('border-border')
  })

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

  it('normalizes page heading typography for desktop and mobile', () => {
    render(<PageHeading title="Documents" subtitle="Manage sources." />)

    const heading = screen.getByRole('heading', { name: 'Documents' })
    expect(heading).toHaveClass('font-display', 'text-[2rem]', 'lg:text-[2.5rem]')
    expect(heading).toHaveClass('leading-[1.1]')
    expect(screen.getByText('Manage sources.')).toHaveClass('text-base')
  })

  it('normalizes the compact status badge treatment', () => {
    render(<StatusBadge>Ready</StatusBadge>)

    const badge = screen.getByText('Ready')
    expect(badge).toHaveClass('h-6', 'font-mono', 'text-xs', 'font-medium', 'rounded-[2px]')
  })

  it('uses one ruled Overview data strip instead of four metric cards', async () => {
    renderApp()
    await screen.findByRole('heading', { name: 'Good morning, Aung' })

    const strip = screen.getByRole('list', { name: 'Library statistics' })
    expect(strip).toHaveClass('border-y', 'border-border')
    expect(within(strip).getAllByRole('listitem')).toHaveLength(4)
    expect(within(strip).getByText('12')).toHaveClass('font-mono')
    expect(screen.getByRole('heading', { name: 'Recent conversations' })).toHaveClass('font-display')
    expect(screen.queryByRole('heading', { name: 'Chat Activity' })).not.toBeInTheDocument()
  })

  it('reserves one 64px header row instead of a desktop sidebar', () => {
    const { container } = renderApp()
    const main = container.querySelector('main')

    expect(main).toHaveClass('min-h-screen', 'pt-16')
    expect(main).not.toHaveClass('lg:pl-60', 'lg:pt-0')
  })

  it('uses the chat icon sizes and heading scale', () => {
    render(<ChatPage />)

    expect(screen.getByRole('heading', { name: 'Annual leave policy' })).toHaveClass('text-2xl')
    expect(screen.getByRole('button', { name: 'New Chat' }).querySelector('svg')).toHaveAttribute('width', '18')
    expect(screen.getByRole('button', { name: 'Send question' }).querySelector('svg')).toHaveAttribute('width', '20')
    expect(screen.getByText('Sources (1)').querySelector('svg')).toHaveAttribute('width', '16')
  })

  it('uses an accessible full-row disclosure control for answer sources', () => {
    render(<ChatPage />)
    const control = screen.getByRole('button', { name: 'Sources (1)' })
    const panelId = control.getAttribute('aria-controls')

    expect(control).toHaveClass('min-h-11')
    expect(control).toHaveAttribute('aria-expanded', 'true')
    expect(panelId).toBeTruthy()
    expect(document.getElementById(panelId)).toBeInTheDocument()
    expect(control.querySelector('svg')).toHaveClass('transition-transform')
  })

  it('keeps the chat composer free of attachment controls', () => {
    const { container } = render(<ChatPage />)
    const input = screen.getByPlaceholderText('Ask a question about your documents...')

    expect(screen.queryByRole('button', { name: /attach/i })).not.toBeInTheDocument()
    expect(input).toHaveClass('chat-input')
    expect(input.closest('form')).toHaveClass('chat-composer', 'bg-surface', 'rounded-[2px]')
    expect(container.querySelectorAll('img')).toHaveLength(0)
  })

  it('gives the chat composer a visible 2px oxide focus ring', () => {
    render(<ChatPage />)
    const form = screen.getByPlaceholderText('Ask a question about your documents...').closest('form')

    expect(form).toHaveClass('focus-within:outline', 'focus-within:outline-2', 'focus-within:outline-offset-2', 'focus-within:outline-focus')
  })

  it('contains desktop Chat within the viewport and assigns overflow to the message thread', () => {
    const { container } = render(<ChatPage />)
    const page = container.querySelector('.chat-page')
    const panel = container.querySelector('.chat-panel')
    const thread = container.querySelector('.chat-thread')

    expect(page).toHaveClass('min-h-[732px]', 'lg:h-[calc(100dvh-4rem)]', 'lg:min-h-0', 'lg:overflow-hidden')
    expect(page).not.toHaveClass('h-[calc(100dvh-4rem)]', 'overflow-hidden')
    expect(panel).toHaveClass('flex', 'flex-col', 'lg:min-h-0')
    expect(thread).toHaveClass('min-h-[450px]', 'lg:min-h-0', 'flex-1', 'lg:overflow-y-auto')
    expect(thread).not.toHaveClass('overflow-y-auto')
  })

  it('uses paper message surfaces without legacy chat bubbles', () => {
    render(<ChatPage />)
    expect(screen.getByText('How many annual leave days do employees get?')).toHaveClass('bg-surface-muted', 'border-accent')
    expect(screen.getByText('Employees receive 20 days of paid annual leave every year. [1]')).toHaveClass('bg-transparent')
    expect(screen.getByText('Employee Handbook.pdf').closest('button')).toHaveClass('bg-surface', 'shadow-none')
  })

  it('uses compact unified document rows and status badges', () => {
    renderApp({ route: '/documents' })

    const row = screen.getByRole('link', { name: /Employee Handbook\.pdf/ })
    expect(row).toHaveClass('min-h-[52px]')
    expect(row.querySelector('svg')).toHaveAttribute('width', '20')
    expect(within(row).getByText('Ready')).toHaveClass('h-6', 'font-mono', 'rounded-[2px]')
  })

  it('styles the intentional documents table scroller', () => {
    renderApp({ route: '/documents' })

    expect(document.querySelector('.table-scroll')).toHaveClass('overflow-x-auto')
  })

  it('keeps reduced motion and accessible native scrollbars', () => {
    expect(stylesheet).toMatch(/@supports not selector\(::-webkit-scrollbar\)\s*{[\s\S]*?\*\s*{[\s\S]*?scrollbar-color:\s*var\(--paper-500\) transparent;[\s\S]*?scrollbar-width:\s*thin;/)
    expect(stylesheet).toMatch(/\*::-webkit-scrollbar\s*{[^}]*width:\s*8px;[^}]*height:\s*8px;/)
    expect(stylesheet).toMatch(/\*::-webkit-scrollbar-track,\s*\*::-webkit-scrollbar-corner\s*{[^}]*background:\s*transparent;/)
    expect(stylesheet).toMatch(/\*::-webkit-scrollbar-thumb\s*{[^}]*background:\s*var\(--paper-500\);[^}]*border:\s*2px solid transparent;[^}]*background-clip:\s*padding-box;[^}]*border-radius:\s*var\(--radius-full\);/)
    expect(stylesheet).not.toMatch(/\.table-scroll::-webkit-scrollbar/)
    expect(contrastRatio('#8A8274', '#FFFDF7')).toBeGreaterThanOrEqual(3)
    expect(stylesheet).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*transition-duration:\s*0\.01ms !important;/)
  })

  it('styles Upload as a paper inbox and ruled list', () => {
    renderApp({ route: '/upload' })
    const dropArea = screen.getByTestId('upload-drop-area')
    expect(dropArea).toHaveClass('border-dashed', 'border-border-strong', 'rounded-[2px]')
    expect(screen.getByRole('heading', { name: 'Recent uploads' })).toHaveClass('font-display')
    expect(screen.getByTestId('recent-upload-Employee Handbook.pdf')).toHaveClass('border-b')
  })

  it('pins long-value safety in settings', () => {
    renderApp({ route: '/settings' })

    const password = screen.getByLabelText('New Password')
    expect(password).toHaveClass('min-w-0')
    expect(password.parentElement).toHaveClass('min-w-0')

    const toggle = screen.getByRole('button', { name: 'Show passwords' })
    expect(toggle.querySelector('svg')).toHaveAttribute('width', '18')
    expect(toggle).toHaveClass('size-11')
  })

  it('uses a ruled 480px account column and a Save changes submit action', () => {
    const { container } = renderApp({ route: '/settings' })
    const fields = container.querySelector('.account-fields')
    const save = screen.getByRole('button', { name: 'Save changes' })

    expect(fields).toHaveClass('w-full', 'max-w-[480px]')
    expect(save).toHaveAttribute('type', 'submit')
    expect(save).toHaveClass('min-h-11', 'rounded-[2px]', 'bg-accent')
    expect(screen.getByRole('button', { name: 'Change password' })).toHaveClass('bg-surface', 'text-text')

    const form = fields.closest('form')
    expect(form).toHaveClass('border-t', 'border-border')
    expect(form).not.toHaveClass('rounded-xl', 'bg-surface')

    expect(form).not.toBeNull()
    expect(save.closest('form')).toBe(form)
  })

  it('keeps Sign in controls, typography, and password icon accessible', () => {
    renderApp({ route: '/signin', authenticated: false })

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toHaveClass('font-display', 'text-[2rem]')
    expect(screen.getByText('Sign in to access your AI document workspace.')).toHaveClass('text-base')
    expect(screen.getByLabelText('Email')).toHaveClass('min-h-12', 'auth-input')
    expect(screen.getByLabelText('Password')).toHaveClass('min-h-12', 'auth-input')
    expect(screen.getByLabelText('Email').parentElement).toHaveClass('auth-field-control', 'focus-within:border-focus')
    expect(screen.getByRole('button', { name: 'Sign in' })).toHaveClass('min-h-12', 'rounded-[2px]')

    expect(stylesheet).toMatch(/\.auth-input:focus-visible\s*{\s*outline:\s*none;/)
    expect(stylesheet).toMatch(/@media\s*\(forced-colors:\s*active\)[\s\S]*\.auth-field-control:focus-within\s*{[\s\S]*outline:/)

    const passwordToggle = screen.getByRole('button', { name: 'Show password' })
    expect(passwordToggle).toHaveClass('size-11')
    expect(passwordToggle.querySelector('svg')).toHaveAttribute('width', '20')
    expect(passwordToggle.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('keeps Create account responsive and touch-friendly without decorative artwork', () => {
    const { container } = renderApp({ route: '/signup', authenticated: false })
    const authCard = screen.getByRole('region', { name: 'Create account workspace' })

    expect(authCard).toHaveClass('grid-cols-1', 'lg:grid-cols-[1fr_1px_1fr]')
    expect(screen.getByRole('heading', { name: 'Create your account' })).toHaveClass('font-display', 'text-[2rem]')
    expect(screen.getByLabelText('Full name')).toHaveClass('min-h-12')
    expect(screen.getByLabelText('Email')).toHaveClass('min-h-12')
    expect(screen.getByLabelText('Password')).toHaveClass('min-h-12')
    expect(screen.getByLabelText('Confirm password')).toHaveClass('min-h-12')
    for (const label of ['Full name', 'Email', 'Password', 'Confirm password']) {
      const input = screen.getByLabelText(label)
      expect(input).toHaveClass('auth-input')
      expect(input.parentElement).toHaveClass('auth-field-control', 'focus-within:border-focus')
    }
    expect(screen.getByRole('button', { name: 'Create account' })).toHaveClass('min-h-12')
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveClass('size-11')
    expect(screen.getByRole('button', { name: 'Show confirm password' })).toHaveClass('size-11')

    expect(container.querySelectorAll('[aria-hidden="true"].pointer-events-none')).toHaveLength(0)
    expect(container.querySelectorAll('img')).toHaveLength(0)
  })
})
