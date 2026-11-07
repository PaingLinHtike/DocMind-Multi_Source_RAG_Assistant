import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp.jsx'

describe('Dashboard', () => {
  it('shows the Figma metrics, chart labels, and recent chats', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: 'Good morning, Aung' })).toBeInTheDocument()
    expect(screen.queryByText(/👋/)).not.toBeInTheDocument()
    expect(screen.getByText('Your AI document assistant for asking questions and finding answers from your knowledge.')).toBeInTheDocument()
    for (const value of ['12', '28', '146', '82 MB', '↑ +20%', '↑ +17%', '↑ +32%']) {
      expect(screen.getByText(value)).toBeInTheDocument()
    }
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
      expect(screen.getByText(day)).toBeInTheDocument()
    }
    for (const chat of ['Annual leave policy', 'Working hours', 'Company benefits']) {
      expect(screen.getByText(chat)).toBeInTheDocument()
    }
  })

  it('navigates from the profile menu to Settings and Upload Document', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Open profile menu' }))
    await user.click(within(screen.getByRole('menu')).getByRole('link', { name: 'Settings' }))
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open profile menu' }))
    await user.click(within(screen.getByRole('menu')).getByRole('link', { name: 'Upload document' }))
    expect(screen.getByRole('heading', { name: 'Upload Document' })).toBeInTheDocument()
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
