import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp.jsx'

describe('Chat prototype', () => {
  it('shows the designed conversation and cited answer', () => {
    const { container } = renderApp({ route: '/chat' })

    for (const title of ['Annual leave policy', 'Working hours', 'Company benefits', 'IT policy', 'Employee handbook']) {
      expect(screen.getByRole('button', { name: title })).toBeInTheDocument()
    }
    expect(screen.getByRole('heading', { name: 'Annual leave policy' })).toHaveClass('text-2xl')
    const question = screen.getByText('How many annual leave days do employees get?')
    expect(question).toHaveClass('bg-surface-muted', 'border-l-2', 'border-accent', 'rounded-[2px]')
    const answer = screen.getByText('Employees receive 20 days of paid annual leave every year. [1]')
    expect(answer).toHaveClass('bg-transparent', 'max-w-[760px]')
    expect(screen.getByText('Sources (1)')).toBeInTheDocument()
    const source = screen.getByText('Employee Handbook.pdf')
    expect(source.closest('button')).toHaveClass('bg-surface', 'border-y', 'border-border', 'rounded-[2px]')
    expect(screen.getByText('Page 17')).toBeInTheDocument()
    expect(container.querySelectorAll('img')).toHaveLength(0)

    const activeConversation = screen.getByRole('button', { name: 'Annual leave policy' })
    expect(activeConversation.parentElement).toHaveClass('border-l-2', 'border-accent')
    expect(activeConversation.querySelector('svg')).toHaveClass('text-accent')
    expect(screen.getByRole('button', { name: 'Working hours' }).querySelector('svg')).toHaveClass('text-text-secondary')
    expect(activeConversation.querySelector('[data-conversation-index]')).toHaveTextContent('01')
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

  it('renames a recent chat from its actions menu', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/chat' })

    const actions = screen.getByRole('button', { name: 'Actions for Annual leave policy' })
    expect(actions).toHaveAttribute('aria-expanded', 'false')

    await user.click(actions)
    expect(actions).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menu')).toHaveClass('menu-enter')
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))

    const input = screen.getByRole('textbox', { name: 'Rename Annual leave policy' })
    expect(input).toHaveValue('Annual leave policy')
    await user.clear(input)
    await user.type(input, 'Vacation policy{Enter}')

    expect(screen.getByRole('heading', { name: 'Vacation policy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vacation policy' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /Rename/ })).not.toBeInTheDocument()
  })

  it('saves an inline rename when the field loses focus', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/chat' })

    await user.click(screen.getByRole('button', { name: 'Actions for Working hours' }))
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    const input = screen.getByRole('textbox', { name: 'Rename Working hours' })
    await user.clear(input)
    await user.type(input, 'Office hours')
    await user.tab()

    expect(screen.getByRole('button', { name: 'Office hours' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /Rename/ })).not.toBeInTheDocument()
  })

  it('cancels an inline rename with Escape and ignores blank titles', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/chat' })

    await user.click(screen.getByRole('button', { name: 'Actions for Working hours' }))
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    let input = screen.getByRole('textbox', { name: 'Rename Working hours' })
    await user.clear(input)
    await user.type(input, 'Temporary title')
    await user.keyboard('{Escape}')

    expect(screen.getByRole('heading', { name: 'Annual leave policy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Working hours' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Actions for Working hours' }))
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    input = screen.getByRole('textbox', { name: 'Rename Working hours' })
    await user.clear(input)
    await user.type(input, '{Enter}')

    expect(screen.getByRole('button', { name: 'Working hours' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /Rename/ })).not.toBeInTheDocument()
  })

  it('deletes the active chat and falls back to the next conversation', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/chat' })

    await user.click(screen.getByRole('button', { name: 'Actions for Annual leave policy' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

    expect(screen.queryByRole('button', { name: 'Annual leave policy' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Working hours' })).toBeInTheDocument()
  })

  it('selects the next conversation when an active middle chat is deleted', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/chat' })

    await user.click(screen.getByRole('button', { name: 'Company benefits' }))
    expect(screen.getByRole('heading', { name: 'Company benefits' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Actions for Company benefits' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

    expect(screen.getByRole('heading', { name: 'IT policy' })).toBeInTheDocument()
  })

  it('deletes an inactive chat without changing the active conversation', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/chat' })

    await user.click(screen.getByRole('button', { name: 'Actions for IT policy' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

    expect(screen.queryByRole('button', { name: 'IT policy' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Annual leave policy' })).toBeInTheDocument()
  })

  it('keeps a blank chat when the last conversation is deleted', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/chat' })

    for (const title of ['Annual leave policy', 'Working hours', 'Company benefits', 'IT policy', 'Employee handbook']) {
      await user.click(screen.getByRole('button', { name: `Actions for ${title}` }))
      await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    }

    expect(screen.getByRole('heading', { name: 'New Chat' })).toBeInTheDocument()
    expect(screen.getByText('Ask your first question to begin.')).toBeInTheDocument()
    expect(screen.getByText('No recent chats.')).toBeInTheDocument()
  })

  it('closes the chat actions menu with Escape', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/chat' })

    await user.click(screen.getByRole('button', { name: 'Actions for Working hours' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('contains long conversation titles and source filenames locally', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/chat' })

    await user.click(screen.getByRole('button', { name: 'Actions for Annual leave policy' }))
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    const input = screen.getByRole('textbox', { name: 'Rename Annual leave policy' })
    const longTitle = 'Annual leave policy for international employees working across multiple regional offices'
    await user.clear(input)
    await user.type(input, `${longTitle}{Enter}`)

    const conversation = screen.getByRole('button', { name: longTitle })
    expect(conversation).toHaveClass('min-w-0')
    expect(conversation.querySelector('[data-conversation-title]')).toHaveClass('min-w-0', 'truncate')
    expect(screen.getByText('Employee Handbook.pdf')).toHaveClass('min-w-0', 'break-words')
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
    const thread = document.querySelector('.chat-thread')
    const composer = input.closest('form')
    expect(thread).toContainElement(screen.getByText('What is the remote work policy?'))
    expect(thread).toContainElement(screen.getByText('I found this in your documents. [1]'))
    expect(thread).not.toContainElement(composer)
    expect(screen.getAllByText('Employee Handbook.pdf').length).toBeGreaterThan(1)
  })

  it('toggles each answer source panel independently by pointer and keyboard', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/chat' })
    const input = screen.getByPlaceholderText('Ask a question about your documents...')

    await user.type(input, 'What is the remote work policy?')
    await user.click(screen.getByRole('button', { name: 'Send question' }))

    const controls = screen.getAllByRole('button', { name: 'Sources (1)' })
    expect(controls).toHaveLength(2)
    const [first, second] = controls
    const firstPanelId = first.getAttribute('aria-controls')
    const secondPanelId = second.getAttribute('aria-controls')

    expect(first).toHaveAttribute('aria-expanded', 'true')
    expect(second).toHaveAttribute('aria-expanded', 'true')
    expect(firstPanelId).not.toBe(secondPanelId)
    expect(document.getElementById(firstPanelId)).toHaveTextContent('Employee Handbook.pdf')
    expect(document.getElementById(secondPanelId)).toHaveTextContent('Employee Handbook.pdf')

    await user.click(first)

    expect(first).toHaveAttribute('aria-expanded', 'false')
    expect(first.querySelector('svg')).toHaveClass('-rotate-90')
    expect(document.getElementById(firstPanelId)).not.toBeInTheDocument()
    expect(second).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById(secondPanelId)).toBeInTheDocument()
    expect(screen.getByText('Employees receive 20 days of paid annual leave every year. [1]')).toBeInTheDocument()
    expect(screen.getByText('I found this in your documents. [1]')).toBeInTheDocument()
    expect(input.closest('form')).toBeInTheDocument()

    first.focus()
    await user.keyboard('{Enter}')

    expect(first).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById(firstPanelId)).toHaveTextContent('Employee Handbook.pdf')
  })
})
