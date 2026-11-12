import { Link } from 'react-router-dom'
import Icon from '../ui/Icon.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'

const statusTones = { Ready: 'success', Pending: 'warning', Processing: 'warning', Failed: 'danger', Uploaded: 'neutral' }

export default function DocumentRow({ document }) {
  return (
    <Link className="grid min-h-[52px] grid-cols-[minmax(260px,2.3fr)_0.8fr_1fr_0.65fr_1.35fr] items-center gap-4 border-b border-border px-3 text-text no-underline transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted" to={`/documents/${document.id}`}>
      <span className="flex min-w-0 items-center gap-3 text-sm font-medium"><Icon className="shrink-0 text-accent" name={document.type === 'WEB' ? 'link' : 'file'} /><span className="min-w-0 truncate">{document.name}</span></span>
      <span className="font-mono text-xs text-text-secondary">{document.type}</span>
      <StatusBadge tone={statusTones[document.status]}>{document.status}</StatusBadge>
      <span className="font-mono text-xs text-text-secondary">{document.chunks}</span>
      <span className="font-mono text-xs text-text-muted">{document.uploadedAt}</span>
    </Link>
  )
}
