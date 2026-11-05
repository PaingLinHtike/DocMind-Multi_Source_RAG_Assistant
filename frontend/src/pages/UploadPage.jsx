import { useEffect, useRef, useState } from 'react'
import uploadArrow from '../assets/figma/upload-arrow.svg'
import uploadFileDocx from '../assets/figma/upload-file-docx.svg'
import uploadFilePdf from '../assets/figma/upload-file-pdf.svg'
import useDocumentsPrototype from '../hooks/useDocumentsPrototype.js'

const initialUploads = [
  { name: 'Employee Handbook.pdf', date: 'Nov 5, 2026', status: 'Ready' },
  { name: 'Company Policies.docx', date: 'Nov 4, 2026', status: 'Ready' },
  { name: 'Benefits Guide.pdf', date: 'Nov 3, 2026', status: 'Ready' },
]

const supportedExtensions = ['pdf', 'docx', 'txt']

export default function UploadPage() {
  const { addUpload } = useDocumentsPrototype()
  const [recentUploads, setRecentUploads] = useState(initialUploads)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const completionTimer = useRef(null)

  useEffect(() => () => clearTimeout(completionTimer.current), [])

  function processFile(file) {
    if (!file) {
      setError('Choose a file first.')
      return
    }
    const extension = file.name.split('.').pop()?.toLocaleLowerCase()
    if (!supportedExtensions.includes(extension)) {
      setError('PDF, DOCX, and TXT files only.')
      return
    }

    setError('')
    addUpload(file)
    setRecentUploads((current) => [{ name: file.name, date: 'Just now', status: 'Processing' }, ...current])
    completionTimer.current = setTimeout(() => {
      setRecentUploads((current) => current.map((upload) => upload.name === file.name ? { ...upload, status: 'Ready' } : upload))
    }, 75)
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragActive(false)
    processFile(event.dataTransfer.files?.[0])
  }

  return (
    <section className="mx-auto w-full max-w-[1278px] px-6 pb-12 pt-10 lg:px-0">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-heading sm:text-4xl">Upload Document</h1>
        <p className="mt-3 text-base text-muted">Add knowledge files for DocMind to read, understand, and answer questions from.</p>
      </header>

      <div className="mt-10 grid gap-6 xl:grid-cols-[845px_402px]">
        <div className="rounded-xl border border-border bg-surface p-6">
          <div
            className={`flex min-h-[320px] flex-col items-center justify-center rounded-xl border px-6 text-center transition ${dragActive ? 'border-[#a66cff] bg-[#a66cff]/10' : 'border-[#7a68b3]'}`}
            onDragEnter={(event) => { event.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <span className="grid size-8 place-items-center"><img alt="" className="size-full" src={uploadArrow} /></span>
            <h2 className="mt-4 text-2xl font-semibold">Drag &amp; drop your document here</h2>
            <p className="mt-1 text-base text-muted">or choose a file from your computer</p>
            <p className="mt-6 text-sm text-muted">Supported: PDF • DOCX • TXT</p>
            <label className="mt-3 grid h-11 w-full max-w-[256px] cursor-pointer place-items-center rounded-lg border border-primary-border bg-primary text-sm font-semibold transition-colors hover:bg-primary/90 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
              Choose File
              <input accept=".pdf,.docx,.txt" className="sr-only" onChange={(event) => processFile(event.target.files?.[0])} type="file" />
            </label>
            {error && <p aria-live="polite" className="mt-2 text-sm text-[#f26a7c]">{error}</p>}
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-border bg-surface px-5 py-4">
          <h2 className="text-xl font-semibold">Recent Uploads</h2>
          <div className="mt-3 divide-y divide-border">
            {recentUploads.slice(0, 4).map((upload) => (
              <div className="flex min-h-16 items-center gap-3" data-testid={`recent-upload-${upload.name}`} key={upload.name}>
                <span className="grid size-5 shrink-0 place-items-center"><img alt="" className="size-full" src={upload.name.toLocaleLowerCase().endsWith('.docx') ? uploadFileDocx : uploadFilePdf} /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm text-heading">{upload.name}</p><p className="mt-1 text-xs text-muted">{upload.date}</p></div>
                <span className={`inline-flex h-6 shrink-0 items-center rounded-md px-2 text-xs font-medium ${upload.status === 'Ready' ? 'bg-[#13a88d]/25' : 'bg-[#6c63ff]/25'}`}>{upload.status}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}
