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
    return <section className="mx-auto max-w-[1290px] px-6 py-16"><h1 className="text-4xl font-bold">Document deleted</h1><Link className="mt-6 inline-block text-primary-border" to="/documents">Return to Documents</Link></section>
  }

  if (!activeDocument) {
    return <section className="mx-auto max-w-[1290px] px-6 py-16"><h1 className="text-4xl font-bold">Document not found</h1></section>
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
    <section className="mx-auto w-full max-w-[1290px] px-6 pb-12 pt-[47px] lg:px-0">
      <nav aria-label="Breadcrumb" className="text-[17px] text-muted"><Link className="text-muted no-underline" to="/documents">Documents</Link><span className="mx-3">›</span><span>{activeDocument.name}</span></nav>

      <div className="mt-[58px] flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
        <div className="flex items-center gap-6">
          <div className="grid h-[100px] w-[95px] shrink-0 place-items-center rounded-2xl bg-surface"><img alt="" src={pdfIcon} /></div>
          <div>
            <h1 className="text-3xl font-bold text-heading sm:text-[37px]">{activeDocument.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <span className="inline-flex h-[30px] min-w-[112px] items-center justify-center rounded-full bg-[#13a88d]/25 text-sm font-semibold">{activeDocument.status}</span>
              <span className="text-[17px] text-muted">Uploaded {activeDocument.uploadedAt}</span>
            </div>
          </div>
        </div>

        <div className="relative self-start sm:self-auto" ref={menuRef}>
          <button aria-expanded={menuOpen} aria-haspopup="menu" aria-label="Actions" className="flex h-[51px] w-[169px] items-center justify-center gap-1 rounded-[13px] border border-border bg-[#202a47] text-lg font-semibold" onClick={() => setMenuOpen((open) => !open)} type="button"><span>Actions</span><img alt="" src={actionsChevron} /></button>
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

      <div className="mt-[55px]"><h2 className="text-[23px] font-semibold">Overview</h2><div className="mt-3 h-1 w-[171px] bg-[#a66cff]" /></div>

      <dl className="mt-[58px] grid min-h-[160px] gap-7 rounded-[17px] border border-border bg-surface px-5 py-6 sm:grid-cols-2 lg:grid-cols-[0.8fr_0.8fr_0.75fr_0.7fr_1.4fr] lg:px-[30px]">
        {[
          ['Type', activeDocument.type],
          ['Chunks', activeDocument.chunks],
          ['Size', activeDocument.size],
          ['Source', activeDocument.source],
          ['Storage', activeDocument.storage],
        ].map(([label, value]) => <div key={label}><dt className="text-[17px] text-muted">{label}</dt><dd className={`mt-4 font-medium text-heading ${label === 'Storage' ? 'break-all text-base' : 'text-[23px]'}`}>{value}</dd></div>)}
      </dl>
    </section>
  )
}
