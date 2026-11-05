import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import actionsChevron from '../assets/figma/actions-chevron.svg'
import pdfIcon from '../assets/figma/pdf.svg'
import DocumentActions from '../components/documents/DocumentActions.jsx'
import useDocumentsPrototype from '../hooks/useDocumentsPrototype.js'

function renamedFile(name) {
  const extensionIndex = name.lastIndexOf('.')
  return extensionIndex > 0 ? `${name.slice(0, extensionIndex)} (Renamed)${name.slice(extensionIndex)}` : `${name} (Renamed)`
}

export default function DocumentDetailsPage() {
  const { documentId } = useParams()
  const { documents, reindex, rename, remove } = useDocumentsPrototype()
  const activeDocument = documents.find((item) => item.id === documentId)
  const [menuOpen, setMenuOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [deleted, setDeleted] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    function closeOnOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOnOutside)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOnOutside)
    }
  }, [])

  if (deleted) {
    return <section className="mx-auto max-w-[1290px] px-6 py-16"><h1 className="text-3xl font-bold">Document deleted</h1><Link className="mt-6 inline-block text-primary-border" to="/documents">Return to Documents</Link></section>
  }

  if (!activeDocument) {
    return <section className="mx-auto max-w-[1290px] px-6 py-16"><h1 className="text-3xl font-bold">Document not found</h1></section>
  }

  function handleReindex() {
    reindex(activeDocument.id)
    setFeedback('Reindexing started.')
  }

  function handleRename() {
    rename(activeDocument.id, renamedFile(activeDocument.name))
    setFeedback('Document renamed.')
  }

  function handleDelete() {
    remove(activeDocument.id)
    setDeleted(true)
  }

  return (
    <section className="mx-auto w-full max-w-[1290px] px-6 pb-12 pt-10 lg:px-0">
      <nav aria-label="Breadcrumb" className="flex min-h-11 flex-wrap items-center gap-2 text-sm text-muted"><Link className="inline-flex min-h-11 items-center text-muted no-underline" to="/documents">Documents</Link><span aria-hidden="true">›</span><span className="min-w-0 break-all">{activeDocument.name}</span></nav>

      <div className="mt-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-5">
          <div className="grid size-[72px] shrink-0 place-items-center rounded-xl bg-surface"><img alt="" src={pdfIcon} /></div>
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-bold leading-tight text-heading">{activeDocument.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex h-6 items-center justify-center rounded-md bg-[#13a88d]/25 px-2 text-xs font-medium">{activeDocument.status}</span>
              <span className="text-sm text-muted">Uploaded {activeDocument.uploadedAt}</span>
            </div>
          </div>
        </div>

        <div className="relative self-start sm:self-auto" ref={menuRef}>
          <button aria-expanded={menuOpen} aria-haspopup="menu" aria-label="Actions" className="flex h-11 w-40 items-center justify-center gap-2 rounded-lg border border-border bg-[#202a47] text-sm font-medium transition-colors hover:bg-white/5" onClick={() => setMenuOpen((open) => !open)} type="button">
            <span>Actions</span>
            <span className="grid size-4 place-items-center"><img alt="" className="size-full" src={actionsChevron} /></span>
          </button>
          {menuOpen && (
            <DocumentActions
              document={activeDocument}
              onClose={() => setMenuOpen(false)}
              onDelete={handleDelete}
              onDownload={() => setFeedback('Download prepared.')}
              onReindex={handleReindex}
              onRename={handleRename}
              onView={() => setFeedback('Original opened.')}
            />
          )}
        </div>
      </div>

      {feedback && <p aria-live="polite" className="mt-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-heading">{feedback}</p>}

      <div className="mt-10"><h2 className="text-xl font-semibold">Overview</h2><div className="mt-2 h-1 w-24 bg-[#a66cff]" /></div>

      <dl className="mt-8 grid min-h-[160px] gap-6 rounded-xl border border-border bg-surface px-6 py-6 sm:grid-cols-2 lg:grid-cols-[0.8fr_0.8fr_0.75fr_0.7fr_1.4fr]">
        {[
          ['Type', activeDocument.type],
          ['Chunks', activeDocument.chunks],
          ['Size', activeDocument.size],
          ['Source', activeDocument.source],
          ['Storage', activeDocument.storage],
        ].map(([label, value]) => <div key={label}><dt className="text-sm text-muted">{label}</dt><dd className={`mt-2 font-medium text-heading ${label === 'Storage' ? 'break-all text-sm' : 'text-lg'}`}>{value}</dd></div>)}
      </dl>
    </section>
  )
}
