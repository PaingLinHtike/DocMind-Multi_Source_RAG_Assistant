const actions = [
  { label: 'View Original', icon: '↗', handler: 'onView' },
  { label: 'Download', icon: '⇩', handler: 'onDownload' },
  { label: 'Reindex', icon: '↻', handler: 'onReindex' },
  { label: 'Rename', icon: '⌕', handler: 'onRename' },
  { label: 'Delete', icon: '♧', handler: 'onDelete', danger: true },
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
          <span aria-hidden="true" className="w-5 text-center">{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  )
}
