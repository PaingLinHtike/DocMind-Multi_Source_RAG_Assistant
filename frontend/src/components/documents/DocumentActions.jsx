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
    <div className="absolute right-0 top-[58px] z-40 w-[238px] rounded-[15px] border border-[#7861bf] bg-surface p-2 shadow-2xl" role="menu">
      {actions.map((action) => (
        <button
          className={`flex h-[57px] w-full items-center gap-4 border-b border-border px-3 text-left text-[17px] last:border-0 ${action.danger ? 'rounded-[10px] bg-[#482c43] text-[#f26a7c]' : 'text-heading hover:bg-white/5'}`}
          key={action.label}
          onClick={() => run(action.handler)}
          type="button"
        >
          <span className="w-6"><img alt="" src={action.icon} /></span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  )
}
