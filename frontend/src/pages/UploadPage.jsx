import { useEffect, useRef, useState } from 'react'
import Icon from '../components/ui/Icon.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'

const initialUploads = [{ name: 'Employee Handbook.pdf', date: 'Nov 5, 2026', status: 'Ready' }, { name: 'Company Policies.docx', date: 'Nov 4, 2026', status: 'Ready' }, { name: 'Benefits Guide.pdf', date: 'Nov 3, 2026', status: 'Ready' }]
const supportedExtensions = ['pdf', 'docx', 'txt']

export default function UploadPage() {
  const [recentUploads, setRecentUploads] = useState(initialUploads); const [error, setError] = useState(''); const [dragActive, setDragActive] = useState(false); const completionTimer = useRef(null)
  useEffect(() => () => clearTimeout(completionTimer.current), [])
  function processFile(file) { if (!file) { setError('Choose a file first.'); return } const extension = file.name.split('.').pop()?.toLocaleLowerCase(); if (!supportedExtensions.includes(extension)) { setError('PDF, DOCX, and TXT files only.'); return } setError(''); setRecentUploads((current) => [{ name: file.name, date: 'Just now', status: 'Processing' }, ...current]); completionTimer.current = setTimeout(() => setRecentUploads((current) => current.map((upload) => upload.name === file.name ? { ...upload, status: 'Ready' } : upload)), 75) }
  function handleDrop(event) { event.preventDefault(); setDragActive(false); processFile(event.dataTransfer.files?.[0]) }
  return <section className="mx-auto w-full max-w-[1200px] px-6 pb-16 pt-10 lg:px-8 lg:pt-12 xl:px-12">
    <PageHeading title="Upload document" subtitle="Add knowledge files for DocMind to read, understand, and answer questions from." />
    <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)] lg:gap-12">
      <div className={`flex min-h-[340px] flex-col items-center justify-center rounded-[2px] border-2 border-dashed px-6 py-10 text-center transition-colors ${dragActive ? 'border-accent bg-accent-soft' : 'border-border-strong bg-surface'}`} data-testid="upload-drop-area" onDragEnter={(event) => { event.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
        <span className="grid size-12 place-items-center rounded-[2px] bg-accent-soft text-accent"><Icon name="upload" size={26} /></span>
        <h2 className="mt-5 font-display text-2xl font-medium">Drag &amp; drop your document here</h2>
        <p className="mt-2 text-base text-text-secondary">or choose a file from your computer</p>
        <p className="mt-6 font-mono text-xs text-text-muted">Supported: PDF • DOCX • TXT</p>
        <label className="mt-4 inline-flex min-h-11 w-full max-w-64 cursor-pointer items-center justify-center rounded-[2px] border border-accent bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-hover focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">Choose file<input accept=".pdf,.docx,.txt" className="sr-only" onChange={(event) => processFile(event.target.files?.[0])} type="file" /></label>
        {error && <p aria-live="polite" className="mt-3 text-sm text-danger">{error}</p>}
      </div>
      <aside className="h-fit border-t border-border-strong pt-4">
        <h2 className="font-display text-2xl font-medium">Recent uploads</h2>
        <div className="mt-4">{recentUploads.slice(0, 4).map((upload) => <div className="flex min-h-16 items-center gap-3 border-b border-border py-2" data-testid={`recent-upload-${upload.name}`} key={upload.name}><Icon className="shrink-0 text-accent" name="file" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-text">{upload.name}</p><p className="mt-1 font-mono text-xs text-text-muted">{upload.date}</p></div><StatusBadge tone={upload.status === 'Ready' ? 'success' : 'warning'}>{upload.status}</StatusBadge></div>)}</div>
      </aside>
    </div>
  </section>
}
