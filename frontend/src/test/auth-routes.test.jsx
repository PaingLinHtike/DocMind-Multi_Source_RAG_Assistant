import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp.jsx'

describe('authentication routes', () => {
  it('renders the standalone Sign In screen with its reference content', () => {
    const { container } = renderApp({ route: '/signin', authenticated: false })

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByText('Sign in to access your AI document workspace.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password')
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute('href', '/signup')
    expect(screen.getByRole('heading', { name: 'Your documents, read closely.' })).toBeInTheDocument()
    expect(screen.getByText('Ask questions, trace every answer to its source, and keep your knowledge in one quiet workspace.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Chat with documents' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cited answers' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Private knowledge base' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).not.toBeInTheDocument()

    const card = screen.getByRole('region', { name: 'Sign in workspace' })
    expect(card).toHaveClass('grid')
    expect(card).toHaveClass('grid-cols-1')
    expect(card).toHaveClass('lg:grid-cols-[1fr_1px_1fr]')
    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(container.querySelectorAll('[aria-hidden="true"].pointer-events-none')).toHaveLength(0)
  })

  it('renders the standalone Sign Up screen with its reference content', () => {
    renderApp({ route: '/signup', authenticated: false })

    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
    expect(screen.getByText('Start building your private AI knowledge workspace.')).toBeInTheDocument()
    expect(screen.getByLabelText('Full name')).toHaveAttribute('autocomplete', 'name')
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password')
    expect(screen.getByLabelText('Confirm password')).toHaveAttribute('autocomplete', 'new-password')
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/signin')
    expect(screen.getByRole('heading', { name: 'Upload documents' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ask questions' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Trace every answer' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).not.toBeInTheDocument()

    const card = screen.getByRole('region', { name: 'Create account workspace' })
    expect(card).toHaveClass('grid')
    expect(card).toHaveClass('grid-cols-1')
    expect(card).toHaveClass('lg:grid-cols-[1fr_1px_1fr]')
    expect(within(card).getByRole('button', { name: 'Create account' })).toHaveClass('min-h-12')
  })
})
