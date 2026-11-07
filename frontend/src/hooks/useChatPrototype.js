import { useState } from 'react'
import { chatConversations } from '../data/mockData.js'

function createBlankConversation() {
  return { id: `new-${Date.now()}`, title: 'New Chat', messages: [] }
}

export default function useChatPrototype() {
  const [conversations, setConversations] = useState(chatConversations)
  const [activeId, setActiveId] = useState(chatConversations[0].id)
  const activeConversation = conversations.find((conversation) => conversation.id === activeId)

  function selectConversation(id) {
    setActiveId(id)
  }

  function createConversation() {
    const conversation = createBlankConversation()
    setConversations((current) => [conversation, ...current])
    setActiveId(conversation.id)
  }

  function renameConversation(id, title) {
    const nextTitle = title.trim()
    if (!nextTitle) return false
    setConversations((current) => current.map((conversation) => conversation.id === id ? { ...conversation, title: nextTitle } : conversation))
    return true
  }

  function deleteConversation(id) {
    const index = conversations.findIndex((conversation) => conversation.id === id)
    if (index === -1) return
    const remaining = conversations.filter((conversation) => conversation.id !== id)
    if (remaining.length === 0) {
      const conversation = createBlankConversation()
      setConversations([conversation])
      setActiveId(conversation.id)
      return
    }
    setConversations(remaining)
    if (activeId === id) {
      const nextConversation = remaining[index] ?? remaining[index - 1]
      setActiveId(nextConversation.id)
    }
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

  return { conversations, activeConversation, selectConversation, createConversation, renameConversation, deleteConversation, sendQuestion }
}
