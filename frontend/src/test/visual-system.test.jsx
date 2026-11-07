import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import attachIcon from '../assets/figma/attach.svg'
import assistantBook from '../assets/figma/chat-assistant-book.svg'
import Button from '../components/ui/Button.jsx'
import { buttonClasses } from '../components/ui/buttonStyles.js'
import Icon from '../components/ui/Icon.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import DashboardPage from '../pages/DashboardPage.jsx'
import ChatPage from '../pages/ChatPage.jsx'
import { renderApp } from './renderApp.jsx'

const stylesheet = readFileSync(resolve('src/index.css'), 'utf8')
const documentHtml = readFileSync(resolve('index.html'), 'utf8')

const iconNames = [
  'menu', 'plus', 'send', 'chevronDown', 'eye', 'eyeOff', 'logout', 'more',
  'mail', 'lock', 'user', 'messageCircle', 'layers', 'fileText', 'bookOpen',
  'dashboard', 'chat', 'documents', 'upload', 'settings', 'search', 'file',
  'link', 'externalLink', 'download', 'refresh', 'edit', 'trash',
  'chevronRight', 'arrowRight',
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

  it('uses the dashboard typographic hierarchy', () => {
    render(<DashboardPage />)

    expect(screen.getByText('Documents')).toHaveClass('text-sm')
    expect(screen.getByText('12')).toHaveClass('text-3xl')
    expect(screen.getByRole('heading', { name: 'Chat Activity' })).toHaveClass('text-xl')
    expect(screen.getByRole('heading', { name: 'Recent Chats' })).toHaveClass('text-xl')
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
    const attachment = [...container.querySelectorAll('img')].find((image) => image.getAttribute('src') === attachIcon)
    const input = screen.getByPlaceholderText('Ask a question about your documents...')

    expect(attachment).toBeUndefined()
    expect(input).toHaveClass('chat-input')
    expect(input.closest('form')).toHaveClass('chat-composer')
  })

  it('contains desktop Chat within the viewport and assigns overflow to the message thread', () => {
    const { container } = render(<ChatPage />)
    const page = container.querySelector('.chat-page')
    const panel = container.querySelector('.chat-panel')
    const thread = container.querySelector('.chat-thread')

    expect(page).toHaveClass('min-h-[732px]', 'lg:h-[calc(100dvh-5rem)]', 'lg:min-h-0', 'lg:overflow-hidden')
    expect(page).not.toHaveClass('h-[calc(100dvh-5rem)]', 'overflow-hidden')
    expect(panel).toHaveClass('flex', 'flex-col', 'lg:min-h-0')
    expect(thread).toHaveClass('min-h-[450px]', 'lg:min-h-0', 'flex-1', 'overflow-y-auto')
  })

  it('centers the assistant book inside its circular badge', () => {
    const { container } = render(<ChatPage />)
    const book = [...container.querySelectorAll('img')].find((image) => image.getAttribute('src') === assistantBook)

    expect(book).toBeInTheDocument()
    expect(book.parentElement).toHaveClass('grid')
    expect(book.parentElement).toHaveClass('place-items-center')
    expect(book.parentElement).not.toHaveClass('absolute')
  })

  it('wraps document row icons at 20px', () => {
    renderApp({ route: '/documents' })

    const row = screen.getByRole('link', { name: /Employee Handbook\.pdf/ })
    expect(row.querySelector('span.size-5')).toBeInTheDocument()
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

  it('pins long-value safety in settings', () => {
    renderApp({ route: '/settings' })

    const password = screen.getByLabelText('Password')
    expect(password).toHaveClass('min-w-0')
    expect(password.parentElement).toHaveClass('min-w-0')

    const toggle = screen.getByRole('button', { name: 'Show password' })
    expect(toggle.querySelector('svg')).toHaveAttribute('width', '18')
    expect(toggle).toHaveClass('size-11')
  })

  it('uses compact account controls and a Save Changes submit action', () => {
    const { container } = renderApp({ route: '/settings' })
    const fields = container.querySelector('.account-fields')
    const save = screen.getByRole('button', { name: 'Save Changes' })

    expect(fields).toHaveClass('lg:grid-cols-[200px_minmax(0,480px)]')
    expect(save).toHaveAttribute('type', 'submit')
    expect(save).toHaveClass('h-11')

    const form = fields.closest('form')
    expect(form).not.toBeNull()
    expect(save.closest('form')).toBe(form)
  })

  it('keeps Sign In controls, typography, and password icon accessible', () => {
    renderApp({ route: '/signin', authenticated: false })

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toHaveClass('text-3xl', 'sm:text-4xl')
    expect(screen.getByText('Sign in to access your AI document workspace.')).toHaveClass('text-base', 'sm:text-lg')
    expect(screen.getByLabelText('Email')).toHaveClass('min-h-11', 'auth-input')
    expect(screen.getByLabelText('Password')).toHaveClass('min-h-11', 'auth-input')
    expect(screen.getByLabelText('Email').parentElement).toHaveClass('auth-field-control', 'focus-within:border-primary-border')
    expect(screen.getByRole('button', { name: 'Sign In' })).toHaveClass('min-h-12')

    expect(stylesheet).toMatch(/\.auth-input:focus-visible\s*{\s*outline:\s*none;/)
    expect(stylesheet).toMatch(/@media\s*\(forced-colors:\s*active\)[\s\S]*\.auth-field-control:focus-within\s*{[\s\S]*outline:/)

    const passwordToggle = screen.getByRole('button', { name: 'Show password' })
    expect(passwordToggle).toHaveClass('size-11')
    expect(passwordToggle.querySelector('svg')).toHaveAttribute('width', '20')
    expect(passwordToggle.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('keeps Sign Up responsive, touch-friendly, and decorative artwork silent', () => {
    const { container } = renderApp({ route: '/signup', authenticated: false })
    const authCard = screen.getByRole('region', { name: 'Create account workspace' })

    expect(authCard).toHaveClass('grid-cols-1', 'lg:grid-cols-[1.4fr_1fr]')
    expect(screen.getByRole('heading', { name: 'Create your account' })).toHaveClass('text-3xl', 'sm:text-4xl')
    expect(screen.getByLabelText('Full Name')).toHaveClass('min-h-11')
    expect(screen.getByLabelText('Email')).toHaveClass('min-h-11')
    expect(screen.getByLabelText('Password')).toHaveClass('min-h-11')
    expect(screen.getByLabelText('Confirm Password')).toHaveClass('min-h-11')
    for (const label of ['Full Name', 'Email', 'Password', 'Confirm Password']) {
      const input = screen.getByLabelText(label)
      expect(input).toHaveClass('auth-input')
      expect(input.parentElement).toHaveClass('auth-field-control', 'focus-within:border-primary-border')
    }
    expect(screen.getByRole('button', { name: 'Create Account' })).toHaveClass('min-h-12')
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveClass('size-11')
    expect(screen.getByRole('button', { name: 'Show confirm password' })).toHaveClass('size-11')

    const decorativeCircles = container.querySelectorAll('[aria-hidden="true"].pointer-events-none')
    expect(decorativeCircles).toHaveLength(2)
    const logos = [...container.querySelectorAll('img')]
    expect(logos.length).toBeGreaterThan(0)
    expect(logos.every((logo) => logo.getAttribute('alt') === '')).toBe(true)
  })
})
