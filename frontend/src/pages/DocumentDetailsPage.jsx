import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteDocument, downloadDocument, getDocument, getDocumentContent, reindexDocument, renameDocument } from '../api/documents.js'
import { useAuth } from '../auth/authSessionStore.js'
import DocumentActions from '../components/documents/DocumentActions.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import RagPipeline from '../components/documents/RagPipeline.jsx'

function renamedFile(name) { const i = name.lastIndexOf('.'); return i > 0 ? `${name.slice(0, i)} (Renamed)${name.slice(i)}` : `${name} (Renamed)` }
const returnLink = 'mt-6 inline-flex min-h-11 items-center font-semibold text-accent underline'

export default function DocumentDetailsPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const { handleUnauthorized } = useAuth()
  const [activeDocument, setActiveDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [mutating, setMutating] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    getDocument(documentId, { signal: controller.signal })
      .then((document) => { if (active) setActiveDocument(document) })
      .catch((requestError) => {
        if (!active || handleUnauthorized(requestError)) return
        if (requestError.status === 404) setNotFound(true)
        else setError(requestError.message)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [documentId, handleUnauthorized])

  useEffect(() => {
    if (!activeDocument || !['Pending', 'Processing'].includes(activeDocument.status)) return undefined
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      getDocument(documentId, { signal: controller.signal })
        .then(setActiveDocument)
        .catch((requestError) => { if (!controller.signal.aborted && !handleUnauthorized(requestError)) setError(requestError.message) })
    }, 2000)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [activeDocument, documentId, handleUnauthorized])

  useEffect(() => {
    function closeOnEscape(event) { if (event.key === 'Escape') setMenuOpen(false) }
    function closeOnOutside(event) { if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false) }
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOnOutside)
    return () => { document.removeEventListener('keydown', closeOnEscape); document.removeEventListener('pointerdown', closeOnOutside) }
  }, [])

  async function runMutation(operation, successMessage) {
    setMutating(true); setError(''); setFeedback('')
    try {
      const updated = await operation()
      if (updated) setActiveDocument(updated)
      if (successMessage) setFeedback(successMessage)
      return true
    } catch (requestError) {
      if (!handleUnauthorized(requestError)) setError(requestError.message)
      return false
    } finally { setMutating(false) }
  }

  function handleReindex() { return runMutation(() => reindexDocument(activeDocument.id), 'Reindexing started.') }
  function handleRename() { return runMutation(() => renameDocument(activeDocument.id, renamedFile(activeDocument.name)), 'Document renamed.') }
  async function handleDelete() { if (await runMutation(() => deleteDocument(activeDocument.id))) navigate('/documents', { replace: true }) }
  async function handleView() {
    const succeeded = await runMutation(async () => {
      const content = await getDocumentContent(activeDocument.id)
      const url = URL.createObjectURL(content)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
    })
    if (succeeded) setFeedback('Original opened.')
  }
  async function handleDownload() {
    const succeeded = await runMutation(async () => {
      const content = await downloadDocument(activeDocument.id)
      const url = URL.createObjectURL(content)
      const anchor = document.createElement('a')
      anchor.href = url; anchor.download = activeDocument.name; document.body.append(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url)
    })
    if (succeeded) setFeedback('Download started.')
  }

  if (loading) return <p className="px-6 py-16 text-center text-sm text-text-muted" role="status">Loading document…</p>
  if (notFound) return <section className="mx-auto max-w-[1120px] px-6 py-16 lg:px-8"><h1 className="font-display text-3xl font-medium">Document not found</h1><Link className={returnLink} to="/documents">Return to documents</Link></section>
  if (!activeDocument) return error ? <p className="px-6 py-16 text-center text-danger" role="alert">{error}</p> : null

  const statusTone = activeDocument.status === 'Ready' ? 'success' : activeDocument.status === 'Failed' ? 'danger' : 'warning'
  return (
    <section className="mx-auto w-full max-w-[1200px] px-6 pb-16 pt-8 lg:px-8 lg:pt-10 xl:px-12">
      <nav aria-label="Breadcrumb" className="flex min-h-11 flex-wrap items-center gap-2 font-mono text-xs text-text-muted"><Link className="inline-flex min-h-11 items-center text-text-secondary no-underline hover:text-accent" to="/documents">Documents</Link><Icon name="chevronRight" size={14} /><span className="min-w-0 break-all">{activeDocument.name}</span></nav>
      <header className="mt-7 flex flex-col justify-between gap-6 border-y border-border-strong py-6 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-4"><Icon className="mt-1 shrink-0 text-accent" name="file" size={32} /><div className="min-w-0"><h1 className="break-words font-display text-3xl font-medium leading-tight text-text lg:text-[2.5rem]">{activeDocument.name}</h1><div className="mt-3 flex flex-wrap items-center gap-3"><StatusBadge tone={statusTone}>{activeDocument.status}</StatusBadge><span className="font-mono text-xs text-text-muted">Uploaded {activeDocument.uploadedAt}</span></div></div></div>
        <div className="relative self-start" ref={menuRef}><Button aria-expanded={menuOpen} aria-haspopup="menu" aria-label="Actions" disabled={mutating} onClick={() => setMenuOpen((open) => !open)} variant="secondary"><span>Actions</span><Icon name="chevronDown" size={16} /></Button>{menuOpen && <DocumentActions document={activeDocument} onClose={() => setMenuOpen(false)} onDelete={handleDelete} onDownload={handleDownload} onReindex={handleReindex} onRename={handleRename} onView={handleView} />}</div>
      </header>
      {error && <p aria-live="polite" className="mt-4 border-l-2 border-danger bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">{error}</p>}
      {feedback && <p aria-live="polite" className="mt-4 border-l-2 border-accent bg-surface px-4 py-3 text-sm text-text">{feedback}</p>}
      <h2 className="mt-10 font-display text-2xl font-medium">Overview</h2>
      <dl className="mt-4 grid border-t border-border-strong sm:grid-cols-2 lg:grid-cols-5">{[['Type', activeDocument.type], ['Chunks', activeDocument.chunks], ['Size', activeDocument.size ?? '—'], ['Source', activeDocument.source], ['Storage', activeDocument.storage]].map(([label, value]) => <div className="border-b border-border py-5 sm:px-4 sm:first:pl-0 lg:border-r lg:last:border-r-0" key={label}><dt className="text-sm text-text-muted">{label}</dt><dd className={`mt-2 font-medium text-text ${label === 'Storage' ? 'break-all font-mono text-sm' : 'text-lg'}`}>{value}</dd></div>)}</dl>
      <RagPipeline document={activeDocument} />
    </section>
  )
}
