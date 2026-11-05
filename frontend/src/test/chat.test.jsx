import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp.jsx'

describe('Chat prototype', () => {
  it('shows the designed conversation and cited answer', () => {
    renderApp({ route: '/chat' })

    for (const title of ['Annual leave policy', 'Working hours', 'Company benefits', 'IT policy', 'Employee handbook']) {
      expect(screen.getByRole('button', { name: title })).toBeInTheDocument()
    }
    expect(screen.getByRole('heading', { name: 'Annual leave policy' })).toHaveClass('text-2xl')
    expect(screen.getByText('How many annual leave days do employees get?')).toHaveClass('text-base')
    expect(screen.getByText('How many annual leave days do employees get?')).toBeInTheDocument()
    expect(screen.getByText('How many annual leave days do employees get?')).toBeInTheDocument()
    expect(screen.getByText('Employees receive 20 days of paid annual leave every year. [1]')).toBeInTheDocument()
    expect(screen.getByText('Sources (1)')).toBeInTheDocument()
    expect(screen.getByText('Employee Handbook.pdf')).toBeInTheDocument()
    expect(screen.getByText('Page 17')).toBeInTheDocument()
  })

  it('selects another conversation and creates a blank new chat', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/chat' })

    await user.click(screen.getByRole('button', { name: 'Working hours' }))
    expect(screen.getByRole('heading', { name: 'Working hours' })).toBeInTheDocument()

    const newChat = screen.getByRole('button', { name: 'New Chat' })
    expect(newChat.querySelector('svg')).toBeInTheDocument()
    await user.click(newChat)
    expect(screen.getByRole('heading', { name: 'New Chat' })).toBeInTheDocument()
    expect(screen.getByText('Ask your first question to begin.')).toBeInTheDocument()
  })

  it('ignores whitespace and appends a cited simulated response to valid questions', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/chat' })
    const input = screen.getByPlaceholderText('Ask a question about your documents...')
    const send = screen.getByRole('button', { name: 'Send question' })
    expect(send.querySelector('svg')).toBeInTheDocument()

    await user.type(input, '   ')
    await user.click(send)
    expect(screen.queryByText('I found this in your documents. [1]')).not.toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'What is the remote work policy?')
    await user.click(screen.getByRole('button', { name: 'Send question' }))
    expect(screen.getByText('What is the remote work policy?')).toBeInTheDocument()
    expect(screen.getByText('I found this in your documents. [1]')).toBeInTheDocument()
    expect(screen.getAllByText('Employee Handbook.pdf').length).toBeGreaterThan(1)
  })
})
