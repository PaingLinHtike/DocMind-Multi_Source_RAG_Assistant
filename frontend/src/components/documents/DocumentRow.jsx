import { Link } from 'react-router-dom'

const statusClasses = {
  Ready: 'bg-[#13a88d]/25',
  Processing: 'bg-[#6c63ff]/25',
  Failed: 'bg-[#f26a7c]/25',
}

export default function DocumentRow({ document }) {
  const isWeb = document.type === 'WEB'

  return (
    <Link
      className="grid min-h-[76px] grid-cols-[minmax(240px,2.3fr)_0.9fr_1.2fr_0.7fr_1.25fr] items-center gap-4 border-b border-border px-4 text-heading no-underline transition hover:bg-white/[0.03] focus-visible:bg-white/[0.03]"
      to={`/documents/${document.id}`}
    >
      <span className="flex min-w-0 items-center gap-7 text-[17px]">
        <span aria-hidden="true" className={isWeb ? 'text-cyan-300' : document.status === 'Failed' ? 'text-[#f26a7c]' : 'text-[#a66cff]'}>{isWeb ? '⌁' : '▤'}</span>
        <span className="truncate">{document.name}</span>
      </span>
      <span className="inline-flex h-[30px] w-[85px] items-center justify-center rounded-full bg-[#536084]/25 text-xs font-semibold">{document.type}</span>
      <span className={`inline-flex h-[30px] w-fit min-w-[94px] items-center justify-center rounded-full px-4 text-xs font-semibold ${statusClasses[document.status]}`}>{document.status}</span>
      <span>{document.chunks}</span>
      <span className="text-sm text-muted">{document.uploadedAt}</span>
    </Link>
  )
}
