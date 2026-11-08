import { useEffect, useState } from 'react'
import { listRecentUploads, uploadDocument } from '../api/documents.js'
import { useAuth } from '../auth/authSessionStore.js'
import Icon from '../components/ui/Icon.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'

const supportedExtensions = ['pdf', 'docx', 'txt']
function uploadDate(document) { return document.uploadedAt || 'Just now' }

export default function UploadPage() {
  const { handleUnauthorized } = useAuth()
  const [recentUploads, setRecentUploads] = useState([])
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    const controller = new AbortController(); let active = true
    listRecentUploads({ signal: controller.signal })
      .then((documents) => { if (active) setRecentUploads(documents) })
      .catch((requestError) => { if (active && !handleUnauthorized(requestError)) setError(requestError.message) })
      .finally(() => { if (active) setLoadingRecent(false) })
    return () => { active = false; controller.abort() }
  }, [handleUnauthorized])

  async function processFile(file) {
    if (uploading) return
    if (!file) { setError('Choose a file first.'); return }
    const extension = file.name.split('.').pop()?.toLocaleLowerCase()
    if (!supportedExtensions.includes(extension)) { setError('PDF, DOCX, and TXT files only.'); return }
    setUploading(true); setError('')
    try {
      const document = await uploadDocument(file)
      setRecentUploads((current) => [document, ...current.filter((upload) => upload.id !== document.id)].slice(0, 10))
    } catch (requestError) {
      if (!handleUnauthorized(requestError)) setError(requestError.errors?.document?.[0] || requestError.message)
    } finally { setUploading(false) }
  }

  function handleDrop(event) { event.preventDefault(); setDragActive(false); if (!uploading) processFile(event.dataTransfer.files?.[0]) }

  return (
    <section className="mx-auto w-full max-w-[1200px] px-6 pb-16 pt-10 lg:px-8 lg:pt-12 xl:px-12">
      <PageHeading title="Upload document" subtitle="Add knowledge files for DocMind to read, understand, and answer questions from." />
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)] lg:gap-12">
        <div className={`flex min-h-[340px] flex-col items-center justify-center rounded-[2px] border-2 border-dashed px-6 py-10 text-center transition-colors ${dragActive ? 'border-accent bg-accent-soft' : 'border-border-strong bg-surface'}`} data-testid="upload-drop-area" onDragEnter={(event) => { event.preventDefault(); if (!uploading) setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
          <span className="grid size-12 place-items-center rounded-[2px] bg-accent-soft text-accent"><Icon name="upload" size={26} /></span>
          <h2 className="mt-5 font-display text-2xl font-medium">Drag &amp; drop your document here</h2>
          <p className="mt-2 text-base text-text-secondary">or choose a file from your computer</p>
          <p className="mt-6 font-mono text-xs text-text-muted">Supported: PDF • DOCX • TXT</p>
          <label aria-disabled={uploading} className={`mt-4 inline-flex min-h-11 w-full max-w-64 items-center justify-center rounded-[2px] border border-accent bg-accent px-4 text-sm font-semibold text-white transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus ${uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-accent-hover'}`}>{uploading ? 'Uploading…' : 'Choose file'}<input accept=".pdf,.docx,.txt" className="sr-only" disabled={uploading} onChange={(event) => processFile(event.target.files?.[0])} type="file" /></label>
          {error && <p aria-live="assertive" className="mt-3 text-sm text-danger" role="alert">{error}</p>}
        </div>
        <aside className="h-fit border-t border-border-strong pt-4">
          <h2 className="font-display text-2xl font-medium">Recent uploads</h2>
          {loadingRecent ? <p className="py-8 text-center text-sm text-text-muted" role="status">Loading recent uploads…</p> : recentUploads.length === 0 ? <p className="py-8 text-center text-sm text-text-muted">No recent uploads yet.</p> : (
            <div className="mt-4">{recentUploads.slice(0, 4).map((upload) => <div className="flex min-h-16 items-center gap-3 border-b border-border py-2" data-testid={`recent-upload-${upload.name}`} key={upload.id}><Icon className="shrink-0 text-accent" name="file" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-text">{upload.name}</p><p className="mt-1 font-mono text-xs text-text-muted">{uploadDate(upload)}</p></div><StatusBadge tone={upload.status === 'Ready' ? 'success' : upload.status === 'Failed' ? 'danger' : 'warning'}>{upload.status}</StatusBadge></div>)}</div>
          )}
        </aside>
      </div>
    </section>
  )
}
