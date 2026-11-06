import { useEffect, useRef, useState } from 'react'
import actionEdit from '../assets/figma/action-edit.svg'
import actionTrash from '../assets/figma/action-trash.svg'
import assistantBook from '../assets/figma/chat-assistant-book.svg'
import assistantCircle from '../assets/figma/chat-assistant-circle.svg'
import conversationIcon from '../assets/figma/chat-conversation.svg'
import userAvatar from '../assets/figma/chat-user-avatar.svg'
import sourceFile from '../assets/figma/source-file.svg'
import sourceOpen from '../assets/figma/source-open.svg'
import Icon from '../components/ui/Icon.jsx'
import useChatPrototype from '../hooks/useChatPrototype.js'

const menuItem = 'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors'

function Citation({ citation }) {
  return (
    <div className="mt-4 pl-2 sm:pl-14">
      <p className="mb-2 flex items-center gap-1 text-sm font-medium text-heading">
        <Icon name="chevronDown" size={16} />
        Sources (1)
      </p>
      <button className="flex w-full max-w-[545px] items-center gap-3 rounded-xl border border-border bg-[#202a47] px-4 py-3 text-left" type="button">
        <span className="grid size-5 shrink-0 place-items-center"><img alt="" className="size-full" src={sourceFile} /></span>
        <span className="min-w-0 flex-1 break-words text-sm text-heading">{citation.file}</span>
        <span className="shrink-0 text-xs text-muted">{citation.page}</span>
        <span className="grid size-5 shrink-0 place-items-center"><img alt="" className="size-full" src={sourceOpen} /></span>
      </button>
    </div>
  )
}

function ChatActions({ conversation, onDelete, onRename }) {
  return (
    <div aria-label={`Actions for ${conversation.title}`} className="menu-enter absolute right-1 top-12 z-40 w-44 rounded-xl border border-[#7861bf] bg-surface p-1.5 shadow-2xl" role="menu">
      <button className={`${menuItem} text-heading hover:bg-white/5`} onClick={() => onRename(conversation)} role="menuitem" type="button">
        <span className="grid size-5 shrink-0 place-items-center"><img alt="" className="size-full" src={actionEdit} /></span>
        <span>Rename</span>
      </button>
      <button className={`${menuItem} bg-red-500/10 text-red-200 hover:bg-red-500/15`} onClick={() => onDelete(conversation.id)} role="menuitem" type="button">
        <span className="grid size-5 shrink-0 place-items-center"><img alt="" className="size-full" src={actionTrash} /></span>
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
    <section className="chat-page mx-auto grid min-h-[732px] max-w-[1380px] grid-cols-1 px-5 pb-8 lg:h-[calc(100dvh-5rem)] lg:min-h-0 lg:grid-cols-[340px_1fr] lg:gap-8 lg:overflow-hidden">
      <aside className="border-border pt-10 lg:border-r lg:pr-7">
        <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary-border bg-primary text-sm font-semibold text-heading transition-colors hover:bg-primary/90" onClick={createConversation} type="button">
          <Icon name="plus" size={18} />
          New Chat
        </button>
        <h2 className="mb-2 mt-6 text-sm font-semibold text-heading">Recent Chats</h2>
        <div className="space-y-1">
          {recentConversations.length === 0 && <p className="px-3 py-2 text-sm text-muted">No recent chats.</p>}
          {recentConversations.map((conversation) => (
            <div className={`relative flex items-center rounded-xl transition-colors ${activeConversation.id === conversation.id ? 'bg-primary/50' : 'hover:bg-white/5'}`} key={conversation.id}>
              {renamingId === conversation.id ? (
                <div className="flex min-h-11 w-full items-center gap-3 px-3">
                  <span className="grid size-5 shrink-0 place-items-center"><img alt="" className="size-full" src={conversationIcon} /></span>
                  <input
                    aria-label={`Rename ${conversation.title}`}
                    className="min-h-11 min-w-0 flex-1 rounded-lg border border-primary-border bg-[#202a47] px-2 text-sm text-heading outline-none"
                    onBlur={() => finishRename(conversation.id)}
                    onChange={(event) => setRenameDraft(event.target.value)}
                    onKeyDown={(event) => handleRenameKeyDown(event, conversation.id)}
                    ref={renameInputRef}
                    value={renameDraft}
                  />
                </div>
              ) : (
                <>
                  <button className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-3 text-left text-sm text-heading" onClick={() => { setOpenActionsId(null); selectConversation(conversation.id) }} type="button">
                    <span className="grid size-5 shrink-0 place-items-center"><img alt="" className="size-full" src={conversationIcon} /></span>
                    <span className="min-w-0 flex-1 truncate">{conversation.title}</span>
                  </button>
                  <button
                    aria-expanded={openActionsId === conversation.id}
                    aria-haspopup="menu"
                    aria-label={`Actions for ${conversation.title}`}
                    className="mr-1 grid size-11 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-heading"
                    onClick={() => toggleActions(conversation.id)}
                    type="button"
                  >
                    <Icon name="more" size={18} />
                  </button>
                  {openActionsId === conversation.id && <ChatActions conversation={conversation} onDelete={handleDelete} onRename={startRename} />}
                </>
              )}
            </div>
          ))}
        </div>
      </aside>

      <div className="chat-panel flex min-w-0 flex-col pt-10 lg:min-h-0 lg:pr-3">
        <h1 className="break-words border-b border-border pb-4 text-2xl font-semibold">{activeConversation.title}</h1>
        <div className="chat-thread min-h-[450px] flex-1 space-y-6 overflow-y-auto py-6 lg:min-h-0">
          {activeConversation.messages.length === 0 && <p className="pt-16 text-center text-sm text-muted">Ask your first question to begin.</p>}
          {activeConversation.messages.map((message) => message.role === 'user' ? (
            <div className="ml-auto flex max-w-[610px] items-start justify-end gap-3" key={message.id}>
              <p className="min-w-0 break-words rounded-xl bg-[#383e6e] px-4 py-3 text-base leading-relaxed text-heading">{message.text}</p>
              <span className="relative grid size-10 shrink-0 place-items-center text-sm font-semibold"><img alt="" className="absolute inset-0 size-full" src={userAvatar} /><span className="relative">A</span></span>
            </div>
          ) : (
            <div key={message.id}>
              <div className="flex items-start gap-3">
                <span className="relative grid size-10 shrink-0 place-items-center" aria-hidden="true"><img alt="" className="absolute inset-0 size-full" src={assistantCircle} /><img alt="" className="relative" src={assistantBook} /></span>
                <div className="min-w-0 w-full max-w-[760px]">
                  <p className="break-words rounded-xl border border-border bg-[#202a47] px-4 py-3 text-base leading-relaxed text-heading">{message.text}</p>
                  <p className="mt-1 text-xs text-muted">{message.time}</p>
                </div>
              </div>
              <Citation citation={message.citation} />
            </div>
          ))}
        </div>
        <form className="chat-composer flex min-h-14 items-center rounded-xl border border-border bg-[#202a47] p-1.5 transition-colors focus-within:border-primary-border" onSubmit={handleSubmit}>
          <input className="chat-input min-h-11 min-w-0 flex-1 bg-transparent px-3 text-base text-heading outline-none placeholder:text-muted" onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about your documents..." value={question} />
          <button aria-label="Send question" className="grid size-11 shrink-0 place-items-center rounded-lg border border-primary-border bg-primary text-heading transition-colors hover:bg-primary/90" type="submit">
            <Icon name="send" size={20} />
          </button>
        </form>
      </div>
    </section>
  )
}
