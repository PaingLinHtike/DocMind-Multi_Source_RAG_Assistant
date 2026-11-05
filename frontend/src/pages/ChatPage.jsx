import { useState } from 'react'
import attachIcon from '../assets/figma/attach.svg'
import assistantBook from '../assets/figma/chat-assistant-book.svg'
import assistantCircle from '../assets/figma/chat-assistant-circle.svg'
import conversationIcon from '../assets/figma/chat-conversation.svg'
import userAvatar from '../assets/figma/chat-user-avatar.svg'
import sourceFile from '../assets/figma/source-file.svg'
import sourceOpen from '../assets/figma/source-open.svg'
import useChatPrototype from '../hooks/useChatPrototype.js'

function Citation({ citation }) {
  return (
    <div className="mt-6 pl-2 sm:pl-[52px]">
      <p className="mb-3 text-lg text-heading"><span aria-hidden="true">⌄&nbsp; </span>Sources (1)</p>
      <button className="flex w-full max-w-[545px] items-center gap-4 rounded-[11px] border border-border bg-[#202a47] px-4 py-4 text-left" type="button">
        <img alt="" src={sourceFile} /><span className="flex-1 text-heading">{citation.file}</span><span className="text-sm text-muted">{citation.page}</span><img alt="" src={sourceOpen} />
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
      <aside className="border-border pt-[51px] lg:border-r lg:pr-7">
        <button className="h-[55px] w-full rounded-[13px] border border-[#866aff] bg-[#5932d2] text-xl font-semibold text-heading" onClick={createConversation} type="button">+ New Chat</button>
        <h2 className="mb-3 mt-7 text-lg font-semibold">Recent Chats</h2>
        <div className="space-y-2">
          {conversations.filter((conversation) => !conversation.id.startsWith('new-')).map((conversation) => (
            <button className={`flex h-[54px] w-full items-center gap-4 rounded-[11px] px-4 text-left text-heading ${activeConversation.id === conversation.id ? 'bg-[#343661]' : 'hover:bg-white/5'}`} key={conversation.id} onClick={() => selectConversation(conversation.id)} type="button">
              <img alt="" src={conversationIcon} /><span>{conversation.title}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pt-[51px] lg:pr-3">
        <h1 className="border-b border-border pb-[21px] text-[27px] font-semibold">{activeConversation.title}</h1>
        <div className="min-h-[450px] flex-1 space-y-10 overflow-y-auto py-7">
          {activeConversation.messages.length === 0 && <p className="pt-20 text-center text-muted">Ask your first question to begin.</p>}
          {activeConversation.messages.map((message) => message.role === 'user' ? (
            <div className="ml-auto flex max-w-[610px] items-center justify-end gap-4" key={message.id}>
              <p className="rounded-[14px] bg-[#383e6e] px-5 py-5 text-heading">{message.text}</p>
              <span className="relative grid size-10 shrink-0 place-items-center font-semibold"><img alt="" className="absolute inset-0" src={userAvatar} /><span className="relative">A</span></span>
            </div>
          ) : (
            <div key={message.id}>
              <div className="flex items-start gap-4">
                <span className="relative block size-[45px] shrink-0" aria-hidden="true"><img alt="" className="absolute inset-0" src={assistantCircle} /><span className="absolute left-2 top-2"><img alt="" src={assistantBook} /></span></span>
                <div className="w-full max-w-[760px]">
                  <p className="rounded-[14px] border border-border bg-[#202a47] px-4 py-5 text-heading">{message.text}</p>
                  <p className="mt-1 text-xs text-muted">{message.time}</p>
                </div>
              </div>
              <Citation citation={message.citation} />
            </div>
          ))}
        </div>
        <form className="flex min-h-[67px] items-center rounded-[11px] border border-border bg-[#202a47] p-2" onSubmit={handleSubmit}>
          <span className="px-2"><img alt="" src={attachIcon} /></span>
          <input className="min-w-0 flex-1 bg-transparent px-2 text-heading outline-none placeholder:text-muted" onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about your documents..." value={question} />
          <button aria-label="Send question" className="grid h-12 w-[57px] place-items-center rounded-[13px] border border-[#866aff] bg-[#5932d2]" type="submit">➤</button>
        </form>
      </div>
    </section>
  )
}
