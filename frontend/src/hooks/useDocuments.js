import { useDeferredValue, useEffect, useState } from 'react'
import { deleteDocument, listDocuments, renameDocument } from '../api/documents.js'
import { useAuth } from '../auth/authSessionStore.js'

export default function useDocuments() {
  const { handleUnauthorized } = useAuth()
  const [documents, setDocuments] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLocaleLowerCase()
  const filteredDocuments = normalizedQuery
    ? documents.filter((document) => document.name.toLocaleLowerCase().includes(normalizedQuery))
    : documents

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    listDocuments({ signal: controller.signal })
      .then((result) => {
        if (!active) return
        setDocuments(result.documents)
        setMeta(result.meta)
      })
      .catch((requestError) => {
        if (!active || handleUnauthorized(requestError)) return
        setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [handleUnauthorized, requestVersion])

  function refetch() {
    setError('')
    setLoading(true)
    setRequestVersion((version) => version + 1)
  }

  async function rename(id, name) {
    const updated = await renameDocument(id, name)
    setDocuments((current) => current.map((document) => document.id === id ? updated : document))
    return updated
  }

  async function remove(id) {
    await deleteDocument(id)
    setDocuments((current) => current.filter((document) => document.id !== id))
  }

  return {
    documents,
    meta,
    loading,
    error,
    query,
    setQuery,
    filteredDocuments,
    refetch,
    rename,
    remove,
  }
}
