import { Link } from 'react-router-dom'
import failedFileIcon from '../../assets/figma/document-file-failed.svg'
import fileIcon from '../../assets/figma/document-file.svg'
import linkIcon from '../../assets/figma/document-link.svg'

const statusClasses = {
  Ready: 'bg-[#13a88d]/25',
  Processing: 'bg-[#6c63ff]/25',
  Failed: 'bg-[#f26a7c]/25',
}

export default function DocumentRow({ document }) {
  const isWeb = document.type === 'WEB'
  const icon = isWeb ? linkIcon : document.status === 'Failed' ? failedFileIcon : fileIcon

  return (
    <Link
      className="grid min-h-[72px] grid-cols-[minmax(240px,2.3fr)_0.9fr_1.2fr_0.7fr_1.25fr] items-center gap-4 border-b border-border px-3 text-heading no-underline transition hover:bg-white/[0.03] focus-visible:bg-white/[0.03]"
      to={`/documents/${document.id}`}
    >
      <span className="flex min-w-0 items-center gap-3 text-base">
        <span className="grid size-5 shrink-0 place-items-center"><img alt="" className="size-full" src={icon} /></span>
        <span className="truncate">{document.name}</span>
      </span>
      <span className="inline-flex h-6 w-fit items-center justify-center rounded-md bg-[#536084]/25 px-2 text-xs font-medium">{document.type}</span>
      <span className={`inline-flex h-6 w-fit items-center justify-center rounded-md px-2 text-xs font-medium ${statusClasses[document.status]}`}>{document.status}</span>
      <span className="text-sm">{document.chunks}</span>
      <span className="text-xs text-muted">{document.uploadedAt}</span>
    </Link>
  )
}
