import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DocumentActions from '../components/documents/DocumentActions.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import useDocumentsPrototype from '../hooks/useDocumentsPrototype.js'

function renamedFile(name) { const i = name.lastIndexOf('.'); return i > 0 ? `${name.slice(0, i)} (Renamed)${name.slice(i)}` : `${name} (Renamed)` }
const returnLink = 'mt-6 inline-flex min-h-11 items-center font-semibold text-accent underline'

export default function DocumentDetailsPage() {
  const { documentId } = useParams(); const { documents, reindex, rename, remove } = useDocumentsPrototype(); const activeDocument = documents.find((item) => item.id === documentId)
  const [menuOpen, setMenuOpen] = useState(false); const [feedback, setFeedback] = useState(''); const [deleted, setDeleted] = useState(false); const menuRef = useRef(null)
  useEffect(() => { function key(e) { if (e.key === 'Escape') setMenuOpen(false) } function outside(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) } document.addEventListener('keydown', key); document.addEventListener('pointerdown', outside); return () => { document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', outside) } }, [])
  if (deleted) return <section className="mx-auto max-w-[1120px] px-6 py-16 lg:px-8"><h1 className="font-display text-3xl font-medium">Document deleted</h1><Link className={returnLink} to="/documents">Return to documents</Link></section>
  if (!activeDocument) return <section className="mx-auto max-w-[1120px] px-6 py-16 lg:px-8"><h1 className="font-display text-3xl font-medium">Document not found</h1><Link className={returnLink} to="/documents">Return to documents</Link></section>
  function handleReindex() { reindex(activeDocument.id); setFeedback('Reindexing started.') } function handleRename() { rename(activeDocument.id, renamedFile(activeDocument.name)); setFeedback('Document renamed.') } function handleDelete() { remove(activeDocument.id); setDeleted(true) }
  const statusTone = activeDocument.status === 'Ready' ? 'success' : activeDocument.status === 'Processing' ? 'warning' : 'danger'
  return <section className="mx-auto w-full max-w-[1200px] px-6 pb-16 pt-8 lg:px-8 lg:pt-10 xl:px-12">
    <nav aria-label="Breadcrumb" className="flex min-h-11 flex-wrap items-center gap-2 font-mono text-xs text-text-muted"><Link className="inline-flex min-h-11 items-center text-text-secondary no-underline hover:text-accent" to="/documents">Documents</Link><Icon name="chevronRight" size={14} /><span className="min-w-0 break-all">{activeDocument.name}</span></nav>
    <header className="mt-7 flex flex-col justify-between gap-6 border-y border-border-strong py-6 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-start gap-4"><Icon className="mt-1 shrink-0 text-accent" name="file" size={32} /><div className="min-w-0"><h1 className="break-words font-display text-3xl font-medium leading-tight text-text lg:text-[2.5rem]">{activeDocument.name}</h1><div className="mt-3 flex flex-wrap items-center gap-3"><StatusBadge tone={statusTone}>{activeDocument.status}</StatusBadge><span className="font-mono text-xs text-text-muted">Uploaded {activeDocument.uploadedAt}</span></div></div></div>
      <div className="relative self-start" ref={menuRef}><Button aria-expanded={menuOpen} aria-haspopup="menu" aria-label="Actions" onClick={() => setMenuOpen((open) => !open)} variant="secondary"><span>Actions</span><Icon name="chevronDown" size={16} /></Button>{menuOpen && <DocumentActions document={activeDocument} onClose={() => setMenuOpen(false)} onDelete={handleDelete} onDownload={() => setFeedback('Download prepared.')} onReindex={handleReindex} onRename={handleRename} onView={() => setFeedback('Original opened.')} />}</div>
    </header>
    {feedback && <p aria-live="polite" className="mt-4 border-l-2 border-accent bg-surface px-4 py-3 text-sm text-text">{feedback}</p>}
    <h2 className="mt-10 font-display text-2xl font-medium">Overview</h2>
    <dl className="mt-4 grid border-t border-border-strong sm:grid-cols-2 lg:grid-cols-5">{[['Type', activeDocument.type], ['Chunks', activeDocument.chunks], ['Size', activeDocument.size], ['Source', activeDocument.source], ['Storage', activeDocument.storage]].map(([label, value]) => <div className="border-b border-border py-5 sm:px-4 sm:first:pl-0 lg:border-r lg:last:border-r-0" key={label}><dt className="text-sm text-text-muted">{label}</dt><dd className={`mt-2 font-medium text-text ${label === 'Storage' ? 'break-all font-mono text-sm' : 'text-lg'}`}>{value}</dd></div>)}</dl>
  </section>
}
