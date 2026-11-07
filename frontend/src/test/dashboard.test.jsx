import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp.jsx'

describe('Dashboard', () => {
  it('shows a ruled summary without fabricated analytics', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: 'Good morning, Aung' })).toBeInTheDocument()
    expect(screen.queryByText(/👋/)).not.toBeInTheDocument()
    expect(screen.getByText('Your AI document assistant for asking questions and finding answers from your knowledge.')).toBeInTheDocument()
    const statistics = screen.getByRole('list', { name: 'Library statistics' })
    for (const value of ['12', '28', '146', '82 MB']) {
      expect(within(statistics).getByText(value)).toBeInTheDocument()
    }
    for (const removed of ['Chat Activity', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', '↑ +20%', '↑ +17%', '↑ +32%']) {
      expect(screen.queryByText(removed)).not.toBeInTheDocument()
    }
  })

  it('links the ask prompt, indexed conversations, and library summary', () => {
    renderApp()

    expect(screen.getByRole('link', { name: /Ask your documents anything/i })).toHaveAttribute('href', '/chat')
    const conversations = screen.getByRole('region', { name: 'Recent conversations' })
    for (const [number, chat] of [['01', 'Annual leave policy'], ['02', 'Working hours'], ['03', 'Company benefits']]) {
      const link = within(conversations).getByRole('link', { name: new RegExp(chat) })
      expect(link).toHaveAttribute('href', '/chat')
      expect(within(link).getByText(number)).toBeInTheDocument()
    }

    const library = screen.getByRole('region', { name: 'Library' })
    expect(within(library).getByText('12 documents')).toBeInTheDocument()
    expect(within(library).getByText('82 MB')).toBeInTheDocument()
    expect(within(library).getByText(/Employee Handbook\.pdf/)).toBeInTheDocument()
    expect(within(library).getByText(/Nov 5, 2026/)).toBeInTheDocument()
    expect(within(library).getByRole('link', { name: 'View documents' })).toHaveAttribute('href', '/documents')
  })

  it('navigates from the profile menu to Settings and Upload Document', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Open profile menu' }))
    await user.click(within(screen.getByRole('menu')).getByRole('link', { name: 'Settings' }))
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open profile menu' }))
    await user.click(within(screen.getByRole('menu')).getByRole('link', { name: 'Upload document' }))
    expect(screen.getByRole('heading', { name: 'Upload document' })).toBeInTheDocument()
  })

  it('closes the profile menu when clicking outside', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Open profile menu' }))
    expect(screen.getByText('aung@example.com')).toBeInTheDocument()
    await user.click(screen.getByRole('main'))
    expect(screen.queryByText('aung@example.com')).not.toBeInTheDocument()
  })
})
