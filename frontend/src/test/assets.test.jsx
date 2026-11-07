import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp.jsx'
describe('Paper & Ink brand assets', () => {
  it('renders a decorative current-color open-book BrandMark', async () => {
    expect(existsSync(resolve('src/components/ui/BrandMark.jsx'))).toBe(true)
    const modulePath = '../components/ui/BrandMark.jsx'
    const { default: BrandMark } = await import(/* @vite-ignore */ modulePath)
    const { container, rerender } = render(<BrandMark />)
    const mark = container.querySelector('svg')

    expect(mark).toHaveAttribute('width', '24')
    expect(mark).toHaveAttribute('height', '24')
    expect(mark).toHaveAttribute('stroke', 'currentColor')
    expect(mark).toHaveAttribute('aria-hidden', 'true')
    expect(mark).toHaveAttribute('focusable', 'false')

    rerender(<BrandMark size={32} />)
    expect(container.querySelector('svg')).toHaveAttribute('width', '32')
  })

  it('uses the Paper & Ink book favicon without legacy purple', () => {
    const favicon = readFileSync(resolve('public/favicon.svg'), 'utf8')
    expect(favicon).toContain('#B23A2B')
    expect(favicon).toContain('#171610')
    expect(favicon).not.toMatch(/#(?:863bff|7e14ff|ede6ff)/i)
    expect(favicon).toContain('<path')
  })

  it('uses the unified inline icon family throughout document screens', () => {
    const list = renderApp({ route: '/documents' })
    expect(list.container.querySelectorAll('img')).toHaveLength(0)
    list.unmount()
    const detail = renderApp({ route: '/documents/doc-123' })
    expect(detail.container.querySelectorAll('img')).toHaveLength(0)
  })

  it('uses unified inline icons throughout Upload', () => {
    const { container } = renderApp({ route: '/upload' })
    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(3)
  })
})
