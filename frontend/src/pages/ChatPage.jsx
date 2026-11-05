import { useState } from 'react'
import attachIcon from '../assets/figma/attach.svg'
import assistantBook from '../assets/figma/chat-assistant-book.svg'
import assistantCircle from '../assets/figma/chat-assistant-circle.svg'
import conversationIcon from '../assets/figma/chat-conversation.svg'
import userAvatar from '../assets/figma/chat-user-avatar.svg'
import sourceFile from '../assets/figma/source-file.svg'
import sourceOpen from '../assets/figma/source-open.svg'
import Icon from '../components/ui/Icon.jsx'
import useChatPrototype from '../hooks/useChatPrototype.js'

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

export default function ChatPage() {
  const { conversations, activeConversation, selectConversation, createConversation, sendQuestion } = useChatPrototype()
  const [question, setQuestion] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (sendQuestion(question)) setQuestion('')
  }

  return (
    <section className="mx-auto grid min-h-[732px] max-w-[1380px] grid-cols-1 px-5 pb-8 lg:grid-cols-[340px_1fr] lg:gap-8">
      <aside className="border-border pt-10 lg:border-r lg:pr-7">
        <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary-border bg-primary text-sm font-semibold text-heading transition-colors hover:bg-primary/90" onClick={createConversation} type="button">
          <Icon name="plus" size={18} />
          New Chat
        </button>
        <h2 className="mb-2 mt-6 text-sm font-semibold text-heading">Recent Chats</h2>
        <div className="space-y-1">
          {conversations.filter((conversation) => !conversation.id.startsWith('new-')).map((conversation) => (
            <button className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-heading transition-colors ${activeConversation.id === conversation.id ? 'bg-primary/50' : 'hover:bg-white/5'}`} key={conversation.id} onClick={() => selectConversation(conversation.id)} type="button">
              <span className="grid size-5 shrink-0 place-items-center"><img alt="" className="size-full" src={conversationIcon} /></span>
              <span className="min-w-0 flex-1 truncate">{conversation.title}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pt-10 lg:pr-3">
        <h1 className="break-words border-b border-border pb-4 text-2xl font-semibold">{activeConversation.title}</h1>
        <div className="min-h-[450px] flex-1 space-y-6 overflow-y-auto py-6">
          {activeConversation.messages.length === 0 && <p className="pt-16 text-center text-sm text-muted">Ask your first question to begin.</p>}
          {activeConversation.messages.map((message) => message.role === 'user' ? (
            <div className="ml-auto flex max-w-[610px] items-start justify-end gap-3" key={message.id}>
              <p className="min-w-0 break-words rounded-xl bg-[#383e6e] px-4 py-3 text-base leading-relaxed text-heading">{message.text}</p>
              <span className="relative grid size-10 shrink-0 place-items-center text-sm font-semibold"><img alt="" className="absolute inset-0 size-full" src={userAvatar} /><span className="relative">A</span></span>
            </div>
          ) : (
            <div key={message.id}>
              <div className="flex items-start gap-3">
                <span className="relative block size-10 shrink-0" aria-hidden="true"><img alt="" className="absolute inset-0 size-full" src={assistantCircle} /><span className="absolute left-2 top-2"><img alt="" src={assistantBook} /></span></span>
                <div className="min-w-0 w-full max-w-[760px]">
                  <p className="break-words rounded-xl border border-border bg-[#202a47] px-4 py-3 text-base leading-relaxed text-heading">{message.text}</p>
                  <p className="mt-1 text-xs text-muted">{message.time}</p>
                </div>
              </div>
              <Citation citation={message.citation} />
            </div>
          ))}
        </div>
        <form className="flex min-h-14 items-center rounded-xl border border-border bg-[#202a47] p-1.5" onSubmit={handleSubmit}>
          <span className="ml-1 grid size-5 shrink-0 place-items-center"><img alt="" className="size-full" src={attachIcon} /></span>
          <input className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-base text-heading outline-none placeholder:text-muted" onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about your documents..." value={question} />
          <button aria-label="Send question" className="grid size-11 shrink-0 place-items-center rounded-lg border border-primary-border bg-primary text-heading transition-colors hover:bg-primary/90" type="submit">
            <Icon name="send" size={20} />
          </button>
        </form>
      </div>
    </section>
  )
}
