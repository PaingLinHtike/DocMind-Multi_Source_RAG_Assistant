import { useEffect, useRef, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import useChatPrototype from '../hooks/useChatPrototype.js'

const menuItem = 'flex min-h-11 w-full items-center gap-3 rounded-[2px] px-3 text-left text-sm font-medium transition-colors'

function Citation({ citation, messageId }) {
  const [expanded, setExpanded] = useState(true)
  const panelId = `sources-${messageId}`

  return (
    <div className="mt-4 max-w-[760px]">
      <button
        aria-controls={panelId}
        aria-expanded={expanded}
        className="flex min-h-11 w-full items-center gap-2 text-left text-sm font-medium text-text"
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        <Icon className={`transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`} name="chevronDown" size={16} />
        Sources (1)
      </button>
      {expanded && (
        <div id={panelId}>
          <button className="flex w-full items-center gap-3 rounded-[2px] border-y border-border bg-surface px-4 py-3 text-left shadow-none" type="button">
            <span className="shrink-0 font-mono text-xs font-medium text-accent">[1]</span>
            <Icon className="shrink-0 text-text-secondary" name="file" size={18} />
            <span className="min-w-0 flex-1 break-words text-sm text-text">{citation.file}</span>
            <span className="shrink-0 font-mono text-xs text-text-muted">{citation.page}</span>
            <Icon className="shrink-0 text-text-secondary" name="externalLink" size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

function ChatActions({ conversation, onDelete, onRename }) {
  return (
    <div aria-label={`Actions for ${conversation.title}`} className="menu-enter absolute right-1 top-12 z-40 w-44 rounded-[2px] border border-border-strong bg-surface p-1.5" role="menu">
      <button className={`${menuItem} text-text hover:bg-surface-muted`} onClick={() => onRename(conversation)} role="menuitem" type="button">
        <Icon className="text-text-secondary" name="edit" size={18} />
        <span>Rename</span>
      </button>
      <button className={`${menuItem} bg-danger-soft text-danger hover:bg-danger-soft-hover`} onClick={() => onDelete(conversation.id)} role="menuitem" type="button">
        <Icon name="trash" size={18} />
        <span>Delete</span>
      </button>
    </div>
  )
}

export default function ChatPage() {
  const { conversations, activeConversation, selectConversation, createConversation, renameConversation, deleteConversation, sendQuestion } = useChatPrototype()
  const [question, setQuestion] = useState('')
  const [openActionsId, setOpenActionsId] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameDraft, setRenameDraft] = useState('')
  const renameInputRef = useRef(null)
  const recentConversations = conversations.filter((conversation) => !conversation.id.startsWith('new-'))

  useEffect(() => {
    if (!renamingId) return
    renameInputRef.current?.focus()
    renameInputRef.current?.select()
  }, [renamingId])

  useEffect(() => {
    if (!openActionsId) return
    function handleEscape(event) {
      if (event.key === 'Escape') setOpenActionsId(null)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [openActionsId])

  function handleSubmit(event) {
    event.preventDefault()
    if (sendQuestion(question)) setQuestion('')
  }

  function toggleActions(id) {
    setOpenActionsId((current) => current === id ? null : id)
  }

  function startRename(conversation) {
    setOpenActionsId(null)
    setRenamingId(conversation.id)
    setRenameDraft(conversation.title)
  }

  function finishRename(conversationId) {
    renameConversation(conversationId, renameDraft)
    setRenamingId(null)
    setRenameDraft('')
  }

  function handleRenameKeyDown(event, conversationId) {
    if (event.key === 'Enter') {
      event.preventDefault()
      finishRename(conversationId)
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setRenamingId(null)
      setRenameDraft('')
    }
  }

  function handleDelete(conversationId) {
    setOpenActionsId(null)
    deleteConversation(conversationId)
  }

  return (
    <section className="chat-page mx-auto grid min-h-[732px] max-w-[1380px] grid-cols-1 px-5 pb-8 sm:px-6 lg:h-[calc(100dvh-4rem)] lg:min-h-0 lg:grid-cols-[320px_1fr] lg:gap-8 lg:overflow-hidden lg:px-8">
      <aside className="border-border pt-10 lg:border-r lg:pr-7">
        <Button className="w-full" onClick={createConversation} type="button">
          <Icon name="plus" size={18} />
          New Chat
        </Button>
        <h2 className="mb-2 mt-6 font-mono text-xs font-medium uppercase tracking-[0.06em] text-text-muted">Recent chats</h2>
        <div className="space-y-1">
          {recentConversations.length === 0 && <p className="px-3 py-2 text-sm text-text-muted">No recent chats.</p>}
          {recentConversations.map((conversation, index) => {
            const isActive = activeConversation.id === conversation.id
            return (
            <div className={`relative flex items-center rounded-[2px] border-l-2 transition-colors ${isActive ? 'border-accent bg-surface-muted' : 'border-transparent hover:bg-surface-muted'}`} key={conversation.id}>
              {renamingId === conversation.id ? (
                <div className="flex min-h-11 w-full items-center gap-3 px-3">
                  <span aria-hidden="true" className="font-mono text-xs text-text-muted">{String(index + 1).padStart(2, '0')}</span>
                  <Icon className={isActive ? 'text-accent' : 'text-text-secondary'} name="chat" size={18} />
                  <input
                    aria-label={`Rename ${conversation.title}`}
                    className="min-h-11 min-w-0 flex-1 rounded-[2px] border border-border-strong bg-surface px-2 text-sm text-text outline-none focus:border-focus"
                    onBlur={() => finishRename(conversation.id)}
                    onChange={(event) => setRenameDraft(event.target.value)}
                    onKeyDown={(event) => handleRenameKeyDown(event, conversation.id)}
                    ref={renameInputRef}
                    value={renameDraft}
                  />
                </div>
              ) : (
                <>
                  <button className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-[2px] px-3 text-left text-sm text-text" onClick={() => { setOpenActionsId(null); selectConversation(conversation.id) }} type="button">
                    <span aria-hidden="true" className="font-mono text-xs text-text-muted" data-conversation-index>{String(index + 1).padStart(2, '0')}</span>
                    <Icon className={isActive ? 'text-accent' : 'text-text-secondary'} name="chat" size={18} />
                    <span className="min-w-0 flex-1 truncate" data-conversation-title>{conversation.title}</span>
                  </button>
                  <button
                    aria-expanded={openActionsId === conversation.id}
                    aria-haspopup="menu"
                    aria-label={`Actions for ${conversation.title}`}
                    className="mr-1 grid size-11 shrink-0 place-items-center rounded-[2px] text-text-secondary transition-colors hover:bg-surface hover:text-text"
                    onClick={() => toggleActions(conversation.id)}
                    type="button"
                  >
                    <Icon name="more" size={18} />
                  </button>
                  {openActionsId === conversation.id && <ChatActions conversation={conversation} onDelete={handleDelete} onRename={startRename} />}
                </>
              )}
            </div>
          )})}
        </div>
      </aside>

      <div className="chat-panel flex min-w-0 flex-col pt-10 lg:min-h-0 lg:pr-3">
        <h1 className="break-words border-b border-border pb-4 font-display text-2xl font-medium">{activeConversation.title}</h1>
        <div className="chat-thread min-h-[450px] flex-1 space-y-8 py-6 lg:min-h-0 lg:overflow-y-auto">
          {activeConversation.messages.length === 0 && <p className="pt-16 text-center text-sm text-text-muted">Ask your first question to begin.</p>}
          {activeConversation.messages.map((message) => message.role === 'user' ? (
            <div className="ml-auto max-w-[610px]" key={message.id}>
              <p className="min-w-0 break-words rounded-[2px] border-l-2 border-accent bg-surface-muted px-4 py-3 text-base leading-relaxed text-text">{message.text}</p>
            </div>
          ) : (
            <div className="min-w-0" key={message.id}>
              <p className="max-w-[760px] break-words bg-transparent text-base leading-[1.65] text-text">{message.text}</p>
              <p className="mt-2 font-mono text-xs text-text-muted">{message.time}</p>
              <Citation citation={message.citation} messageId={message.id} />
            </div>
          ))}
        </div>
        <form className="chat-composer flex min-h-14 items-center rounded-[2px] border border-border-strong bg-surface p-1.5 transition-colors focus-within:border-focus" onSubmit={handleSubmit}>
          <input className="chat-input min-h-11 min-w-0 flex-1 bg-transparent px-3 text-base text-text outline-none placeholder:text-text-muted" onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about your documents..." value={question} />
          <Button aria-label="Send question" className="shrink-0" size="icon" type="submit">
            <Icon name="send" size={20} />
          </Button>
        </form>
      </div>
    </section>
  )
}
