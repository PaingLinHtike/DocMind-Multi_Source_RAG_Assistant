import { useDeferredValue, useState } from 'react'
import { documents as initialDocuments } from '../data/mockData.js'

export default function useDocumentsPrototype() {
  const [documents, setDocuments] = useState(initialDocuments)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLocaleLowerCase()
  const filteredDocuments = normalizedQuery
    ? documents.filter((document) => document.name.toLocaleLowerCase().includes(normalizedQuery))
    : documents

  function addUpload(file) {
    const extension = file.name.split('.').pop()?.toUpperCase() || 'FILE'
    const document = {
      id: `doc-${Date.now()}`,
      name: file.name,
      type: extension,
      status: 'Processing',
      chunks: '—',
      uploadedAt: 'Just now',
      size: file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : '—',
      source: 'Upload',
      storage: `documents/user_001/${file.name}`,
    }
    setDocuments((current) => [document, ...current])
    return document
  }

  function reindex(id) {
    setDocuments((current) => current.map((document) => document.id === id ? { ...document, status: 'Processing' } : document))
  }

  function rename(id, name) {
    setDocuments((current) => current.map((document) => document.id === id ? { ...document, name } : document))
  }

  function remove(id) {
    setDocuments((current) => current.filter((document) => document.id !== id))
  }

  return { documents, query, setQuery, filteredDocuments, addUpload, reindex, rename, remove }
}
