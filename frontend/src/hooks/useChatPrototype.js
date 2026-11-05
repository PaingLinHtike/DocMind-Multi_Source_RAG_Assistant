import { useState } from 'react'
import { chatConversations } from '../data/mockData.js'

export default function useChatPrototype() {
  const [conversations, setConversations] = useState(chatConversations)
  const [activeId, setActiveId] = useState(chatConversations[0].id)
  const activeConversation = conversations.find((conversation) => conversation.id === activeId)

  function selectConversation(id) {
    setActiveId(id)
  }

  function createConversation() {
    const conversation = { id: `new-${Date.now()}`, title: 'New Chat', messages: [] }
    setConversations((current) => [conversation, ...current])
    setActiveId(conversation.id)
  }

  function sendQuestion(text) {
    const question = text.trim()
    if (!question) return false
    setConversations((current) => current.map((conversation) => conversation.id === activeId ? {
      ...conversation,
      messages: [
        ...conversation.messages,
        { id: `q-${Date.now()}`, role: 'user', text: question },
        { id: `a-${Date.now()}`, role: 'assistant', text: 'I found this in your documents. [1]', time: 'Just now', citation: { file: 'Employee Handbook.pdf', page: 'Page 17' } },
      ],
    } : conversation))
    return true
  }

  return { conversations, activeConversation, selectConversation, createConversation, sendQuestion }
}
