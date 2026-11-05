import actionDownload from '../../assets/figma/action-download.svg'
import actionEdit from '../../assets/figma/action-edit.svg'
import actionExternal from '../../assets/figma/action-external.svg'
import actionRefresh from '../../assets/figma/action-refresh.svg'
import actionTrash from '../../assets/figma/action-trash.svg'

const actions = [
  { label: 'View Original', icon: actionExternal, handler: 'onView' },
  { label: 'Download', icon: actionDownload, handler: 'onDownload' },
  { label: 'Reindex', icon: actionRefresh, handler: 'onReindex' },
  { label: 'Rename', icon: actionEdit, handler: 'onRename' },
  { label: 'Delete', icon: actionTrash, handler: 'onDelete', danger: true },
]

export default function DocumentActions({ document, onClose, onView, onDownload, onReindex, onRename, onDelete }) {
  const handlers = { onView, onDownload, onReindex, onRename, onDelete }

  function run(handler) {
    handlers[handler]?.(document)
    onClose()
  }

  return (
    <div className="absolute left-0 top-14 z-40 w-60 rounded-xl border border-[#7861bf] bg-surface p-1.5 shadow-2xl sm:left-auto sm:right-0" role="menu">
      {actions.map((action) => (
        <button
          className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors ${action.danger ? 'bg-red-500/10 text-red-200 hover:bg-red-500/15' : 'text-heading hover:bg-white/5'}`}
          key={action.label}
          onClick={() => run(action.handler)}
          type="button"
        >
          <span className="grid size-5 shrink-0 place-items-center"><img alt="" className="size-full" src={action.icon} /></span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  )
}
