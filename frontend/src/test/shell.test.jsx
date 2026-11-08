import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp.jsx'

describe('DocMind application shell', () => {
  it('shows the brand, primary routes, and profile control', () => {
    renderApp()

    expect(screen.getByText('DocMind')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'DocMind' })).toHaveAttribute('href', '/dashboard')
    const primary = screen.getByRole('navigation', { name: 'Primary navigation' })
    expect(within(primary).getAllByRole('link')).toHaveLength(3)
    expect(within(primary).getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '/dashboard')
    expect(within(primary).getByRole('link', { name: 'Chat' })).toHaveAttribute('href', '/chat')
    expect(within(primary).getByRole('link', { name: 'Documents' })).toHaveAttribute('href', '/documents')
    expect(within(primary).queryByRole('link', { name: 'Upload' })).not.toBeInTheDocument()
    expect(within(primary).queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open profile menu' })).toBeInTheDocument()
    const banner = screen.getByRole('banner', { name: 'Application shell' })
    expect(banner).toHaveClass('h-16', 'border-b', 'border-border')
    expect(banner).not.toHaveClass('lg:w-60', 'lg:h-screen', 'lg:border-r')
    expect(primary).toHaveClass('hidden', 'lg:flex')
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveClass('lg:hidden')

    const active = within(primary).getByRole('link', { name: 'Overview' })
    expect(active).toHaveClass('border-b-2', 'border-accent', 'text-text')
    expect(active).not.toHaveClass('border-l-2', 'bg-surface-muted')
    expect(active.querySelector('svg')).toHaveClass('text-accent')
    expect(within(primary).getByRole('link', { name: 'Chat' }).querySelector('svg')).toHaveClass('text-text-secondary')
  })

  it('opens the account menu and closes it with Escape', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Open profile menu' }))
    const menu = screen.getByRole('menu')
    expect(within(menu).getByText('Aung')).toBeInTheDocument()
    expect(within(menu).getByText('aung@example.com')).toBeInTheDocument()
    expect(within(menu).getByRole('link', { name: 'Upload document' })).toBeInTheDocument()
    expect(within(menu).getByRole('link', { name: 'Settings' })).toBeInTheDocument()
    expect(within(menu).getByRole('button', { name: 'Log out' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByText('aung@example.com')).not.toBeInTheDocument()
  })

  it('uses a compact profile avatar and animates the menu open', async () => {
    const user = userEvent.setup()
    renderApp()

    const trigger = screen.getByRole('button', { name: 'Open profile menu' })
    const avatar = trigger.querySelector('span.size-9')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveTextContent('A')

    const chevron = trigger.querySelector('.transition-transform')
    expect(chevron).toBeInTheDocument()
    expect(chevron).not.toHaveClass('rotate-180')

    await user.click(trigger)
    expect(chevron).toHaveClass('rotate-180')
    expect(screen.getByRole('menu')).toHaveClass('menu-enter')
  })

  it('navigates between primary screens', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('link', { name: 'Chat' }))
    expect(screen.getByRole('heading', { name: 'Annual leave policy' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Documents' }))
    expect(await screen.findByRole('heading', { name: 'Documents' })).toBeInTheDocument()
  })

  it('provides an operable mobile navigation menu', async () => {
    const user = userEvent.setup()
    renderApp()

    const trigger = screen.getByRole('button', { name: 'Open navigation' })
    expect(trigger.querySelector('svg')).toBeInTheDocument()
    await user.click(trigger)
    const mobileNav = screen.getByRole('navigation', { name: 'Mobile navigation' })
    expect(mobileNav).toBeInTheDocument()
    expect(within(mobileNav).getAllByRole('link')).toHaveLength(3)
    expect(within(mobileNav).queryByRole('link', { name: 'Upload' })).not.toBeInTheDocument()
    expect(within(mobileNav).queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument()

    await user.click(within(mobileNav).getByRole('link', { name: 'Chat' }))
    expect(screen.getByRole('heading', { name: 'Annual leave policy' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open navigation' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument()
  })

  it('closes open shell menus after an outside pointer interaction', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Open navigation' }))
    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeInTheDocument()
    await user.click(screen.getByRole('main'))
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument()
  })
})
