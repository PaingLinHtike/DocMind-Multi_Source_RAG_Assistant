import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createConversation as createConversationRequest,
  deleteConversation as deleteConversationRequest,
  getConversation,
  listConversations,
  renameConversation as renameConversationRequest,
  sendMessage,
} from '../api/conversations.js'
import { useAuth } from '../auth/authSessionStore.js'

export default function useConversations() {
  const { handleUnauthorized } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [activeConversation, setActiveConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState('')
  const [renameError, setRenameError] = useState('')
  const selectionRequest = useRef({ id: 0, controller: null })

  const selectConversation = useCallback(async (id) => {
    const requestId = selectionRequest.current.id + 1
    selectionRequest.current.controller?.abort()
    const controller = new AbortController()
    selectionRequest.current = { id: requestId, controller }
    setActiveId(id)
    setActiveConversation(null)
    setLoadingThread(true)
    setError('')

    try {
      const conversation = await getConversation(id, { signal: controller.signal })
      if (selectionRequest.current.id === requestId) setActiveConversation(conversation)
      return conversation
    } catch (requestError) {
      if (controller.signal.aborted) return null
      if (!handleUnauthorized(requestError)) setError(requestError.message)
      return null
    } finally {
      if (selectionRequest.current.id === requestId) setLoadingThread(false)
    }
  }, [handleUnauthorized])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    listConversations({ signal: controller.signal })
      .then((result) => {
        if (!active) return
        setConversations(result.conversations)
        if (result.conversations.length > 0) selectConversation(result.conversations[0].id)
      })
      .catch((requestError) => {
        if (!active || controller.signal.aborted || handleUnauthorized(requestError)) return
        setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
      selectionRequest.current.controller?.abort()
    }
  }, [handleUnauthorized, selectConversation])

  useEffect(() => {
    const hasPendingMessage = activeConversation?.messages?.some((message) => ['pending', 'processing'].includes(message.status))
    if (!activeId || !hasPendingMessage) return undefined
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const conversation = await getConversation(activeId, { signal: controller.signal })
        if (!controller.signal.aborted) setActiveConversation((current) => current?.id === activeId ? conversation : current)
      } catch (requestError) {
        if (!controller.signal.aborted && !handleUnauthorized(requestError)) setError(requestError.message)
      }
    }, 500)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [activeConversation, activeId, handleUnauthorized])

  async function createConversation(title) {
    setMutating(true)
    setError('')
    try {
      const created = await createConversationRequest(title)
      const thread = { ...created, messages: [] }
      setConversations((current) => [created, ...current])
      setActiveId(created.id)
      setActiveConversation(thread)
      return thread
    } catch (requestError) {
      if (!handleUnauthorized(requestError)) setError(requestError.message)
      return null
    } finally {
      setMutating(false)
    }
  }

  async function renameConversation(id, title) {
    const nextTitle = title.trim()
    if (!nextTitle) {
      setRenameError('Enter a conversation title.')
      return false
    }
    setMutating(true)
    setError('')
    setRenameError('')
    try {
      const updated = await renameConversationRequest(id, nextTitle)
      setConversations((current) => current.map((conversation) => conversation.id === id ? updated : conversation))
      setActiveConversation((current) => current?.id === id ? { ...current, ...updated, messages: current.messages } : current)
      return true
    } catch (requestError) {
      if (!handleUnauthorized(requestError)) {
        const titleError = requestError.errors?.title?.[0]
        if (titleError) setRenameError(titleError)
        else setError(requestError.message)
      }
      return false
    } finally {
      setMutating(false)
    }
  }

  async function deleteConversation(id) {
    const index = conversations.findIndex((conversation) => conversation.id === id)
    if (index === -1) return false
    setMutating(true)
    setError('')
    try {
      await deleteConversationRequest(id)
      const remaining = conversations.filter((conversation) => conversation.id !== id)
      setConversations(remaining)
      if (activeId === id) {
        const nextConversation = remaining[index] ?? remaining[index - 1] ?? null
        if (nextConversation) await selectConversation(nextConversation.id)
        else {
          setActiveId(null)
          setActiveConversation(null)
        }
      }
      return true
    } catch (requestError) {
      if (!handleUnauthorized(requestError)) setError(requestError.message)
      return false
    } finally {
      setMutating(false)
    }
  }

  async function sendQuestion(content) {
    const question = content.trim()
    if (!question || !activeId || submitting) return false
    setSubmitting(true)
    setError('')
    try {
      const message = await sendMessage(activeId, question)
      setActiveConversation((current) => current?.id === activeId
        ? { ...current, messages: [...current.messages, message] }
        : current)
      return true
    } catch (requestError) {
      if (!handleUnauthorized(requestError)) setError(requestError.errors?.content?.[0] || requestError.message)
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return {
    conversations,
    activeId,
    activeConversation,
    loading,
    loadingThread,
    submitting,
    mutating,
    error,
    renameError,
    clearRenameError: () => setRenameError(''),
    selectConversation,
    createConversation,
    renameConversation,
    deleteConversation,
    sendQuestion,
  }
}
