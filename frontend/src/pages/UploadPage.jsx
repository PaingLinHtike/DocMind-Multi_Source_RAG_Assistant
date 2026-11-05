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
    <section className="mx-auto w-full max-w-[1278px] px-6 pb-12 pt-[42px] lg:px-0">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-heading sm:text-[46px]">Upload Document</h1>
        <p className="mt-3 text-base text-muted sm:text-[19px]">Add knowledge files for DocMind to read, understand, and answer questions from.</p>
      </header>

      <div className="mt-[58px] grid gap-[38px] xl:grid-cols-[845px_402px]">
        <div className="min-h-[411px] rounded-[17px] border border-border bg-surface p-[34px]">
          <div
            className={`flex min-h-[340px] flex-col items-center justify-center rounded-[18px] border px-6 text-center transition ${dragActive ? 'border-[#a66cff] bg-[#a66cff]/10' : 'border-[#7a68b3]'}`}
            onDragEnter={(event) => { event.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <img alt="" src={uploadArrow} />
            <h2 className="mt-4 text-2xl font-semibold sm:text-[27px]">Drag &amp; drop your document here</h2>
            <p className="mt-1 text-lg text-muted">or choose a file from your computer</p>
            <p className="mt-7 text-base text-muted">Supported: PDF • DOCX • TXT</p>
            <label className="mt-3 grid h-[49px] w-full max-w-[256px] cursor-pointer place-items-center rounded-[13px] border border-[#866aff] bg-[#5932d2] text-sm font-semibold">
              Choose File
              <input accept=".pdf,.docx,.txt" className="sr-only" onChange={(event) => processFile(event.target.files?.[0])} type="file" />
            </label>
            {error && <p aria-live="polite" className="mt-2 text-sm text-[#f26a7c]">{error}</p>}
          </div>
        </div>

        <aside className="h-fit min-h-[336px] rounded-[17px] border border-border bg-surface px-5 py-4">
          <h2 className="text-2xl font-semibold">Recent Uploads</h2>
          <div className="mt-3 divide-y divide-border">
            {recentUploads.slice(0, 4).map((upload) => (
              <div className="flex min-h-[77px] items-center gap-3" data-testid={`recent-upload-${upload.name}`} key={upload.name}>
                <img alt="" src={upload.name.toLocaleLowerCase().endsWith('.docx') ? uploadFileDocx : uploadFilePdf} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm text-heading">{upload.name}</p><p className="mt-1 text-xs text-muted">{upload.date}</p></div>
                <span className={`rounded-full px-4 py-1.5 text-xs font-semibold ${upload.status === 'Ready' ? 'bg-[#13a88d]/25' : 'bg-[#6c63ff]/25'}`}>{upload.status}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}
