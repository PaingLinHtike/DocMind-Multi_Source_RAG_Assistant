import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Icon from '../components/ui/Icon.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'

const iconNames = ['menu', 'plus', 'send', 'chevronDown', 'eye', 'eyeOff', 'logout']

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
})
