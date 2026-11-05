import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp.jsx'

describe('DocMind application shell', () => {
  it('shows the brand, primary routes, and profile control', () => {
    renderApp()

    expect(screen.getByText('DocMind')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Chat' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Documents' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open profile menu' })).toBeInTheDocument()
  })

  it('opens the account menu and closes it with Escape', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Open profile menu' }))
    expect(screen.getByText('Aung')).toBeInTheDocument()
    expect(screen.getByText('aung@example.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Upload Document' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByText('aung@example.com')).not.toBeInTheDocument()
  })

  it('navigates between primary screens', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('link', { name: 'Chat' }))
    expect(screen.getByRole('heading', { name: 'Annual leave policy' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Documents' }))
    expect(screen.getByRole('heading', { name: 'Documents' })).toBeInTheDocument()
  })

  it('provides an operable mobile navigation menu', async () => {
    const user = userEvent.setup()
    renderApp()

    const trigger = screen.getByRole('button', { name: 'Open navigation' })
    await user.click(trigger)
    const mobileNav = screen.getByRole('navigation', { name: 'Mobile navigation' })
    expect(mobileNav).toBeInTheDocument()

    await user.click(within(mobileNav).getByRole('link', { name: 'Chat' }))
    expect(screen.getByRole('heading', { name: 'Annual leave policy' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open navigation' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument()
  })
})
