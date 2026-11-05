import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import attachIcon from '../assets/figma/attach.svg'
import assistantBook from '../assets/figma/chat-assistant-book.svg'
import Icon from '../components/ui/Icon.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import DashboardPage from '../pages/DashboardPage.jsx'
import ChatPage from '../pages/ChatPage.jsx'
import { renderApp } from './renderApp.jsx'

const iconNames = ['menu', 'plus', 'send', 'chevronDown', 'eye', 'eyeOff', 'logout', 'more']

describe('shared visual system', () => {
  it.each(iconNames)('renders the %s icon as a decorative 20px SVG', (name) => {
    const { container } = render(<Icon name={name} />)
    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('width', '20')
    expect(svg).toHaveAttribute('height', '20')
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
    expect(svg).toHaveAttribute('stroke', 'currentColor')
  })

  it('uses an explicit icon size when provided', () => {
    const { container } = render(<Icon name="plus" size={16} />)
    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('width', '16')
    expect(svg).toHaveAttribute('height', '16')
  })

  it('normalizes page heading typography for desktop and mobile', () => {
    render(<PageHeading title="Documents" subtitle="Manage sources." />)

    const heading = screen.getByRole('heading', { name: 'Documents' })
    expect(heading).toHaveClass('text-3xl')
    expect(heading).toHaveClass('max-sm:text-2xl')
    expect(heading).toHaveClass('leading-tight')
    expect(screen.getByText('Manage sources.')).toHaveClass('text-base')
  })

  it('normalizes the compact status badge treatment', () => {
    render(<StatusBadge>Ready</StatusBadge>)

    const badge = screen.getByText('Ready')
    expect(badge).toHaveClass('text-xs')
    expect(badge).toHaveClass('font-medium')
    expect(badge).toHaveClass('min-h-6')
    expect(badge).toHaveClass('rounded-md')
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

  it('keeps the chat composer free of attachment controls', () => {
    const { container } = render(<ChatPage />)
    const attachment = [...container.querySelectorAll('img')].find((image) => image.getAttribute('src') === attachIcon)
    const input = screen.getByPlaceholderText('Ask a question about your documents...')

    expect(attachment).toBeUndefined()
    expect(input).toHaveClass('chat-input')
    expect(input.closest('form')).toHaveClass('chat-composer')
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

  it('pins long-value safety in settings', () => {
    renderApp({ route: '/settings' })

    const password = screen.getByLabelText('Password')
    expect(password).toHaveClass('min-w-0')
    expect(password.parentElement).toHaveClass('min-w-0')

    const toggle = screen.getByRole('button', { name: 'Show password' })
    expect(toggle.querySelector('svg')).toHaveAttribute('width', '18')
    expect(toggle).toHaveClass('size-11')
  })

  it('keeps Sign In controls, typography, and password icon accessible', () => {
    renderApp({ route: '/signin', authenticated: false })

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toHaveClass('text-3xl', 'sm:text-4xl')
    expect(screen.getByText('Sign in to access your AI document workspace.')).toHaveClass('text-base', 'sm:text-lg')
    expect(screen.getByLabelText('Email')).toHaveClass('min-h-11')
    expect(screen.getByLabelText('Password')).toHaveClass('min-h-11')
    expect(screen.getByRole('button', { name: 'Sign In' })).toHaveClass('min-h-12')

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
