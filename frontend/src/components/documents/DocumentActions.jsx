import Icon from '../ui/Icon.jsx'

const actions = [
  { label: 'View original', icon: 'externalLink', handler: 'onView' },
  { label: 'Download', icon: 'download', handler: 'onDownload' },
  { label: 'Reindex', icon: 'refresh', handler: 'onReindex' },
  { label: 'Rename', icon: 'edit', handler: 'onRename' },
  { label: 'Delete', icon: 'trash', handler: 'onDelete', danger: true },
]

export default function DocumentActions({ document, onClose, onView, onDownload, onReindex, onRename, onDelete }) {
  const handlers = { onView, onDownload, onReindex, onRename, onDelete }
  function run(handler) { handlers[handler]?.(document); onClose() }
  return <div className="menu-enter absolute left-0 top-14 z-40 w-60 rounded-[2px] border border-border-strong bg-surface p-1.5 sm:left-auto sm:right-0" role="menu">{actions.map((action) => <button className={`flex min-h-11 w-full items-center gap-3 rounded-[2px] px-3 text-left text-sm font-medium transition-colors ${action.danger ? 'bg-danger-soft text-danger hover:bg-danger-soft-hover' : 'text-text hover:bg-surface-muted'}`} key={action.label} onClick={() => run(action.handler)} type="button"><Icon name={action.icon} size={18} /><span>{action.label}</span></button>)}</div>
}
