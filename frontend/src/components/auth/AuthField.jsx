import Icon from '../ui/Icon.jsx'

export default function AuthField({ id, label, icon, error, trailingControl, className = '', ...inputProps }) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-heading" htmlFor={id}>{label}</label>
      <div className={`flex min-h-12 items-center rounded-xl border bg-[#202b4b] transition-colors focus-within:border-primary-border ${error ? 'border-red-400' : 'border-[#506184]'}`}>
        <span className="ml-4 grid size-5 shrink-0 place-items-center text-muted"><Icon name={icon} size={20} /></span>
        <input
          aria-describedby={errorId}
          aria-invalid={Boolean(error)}
          className="auth-input min-h-11 min-w-0 flex-1 bg-transparent px-4 text-base text-heading outline-none placeholder:text-muted"
          id={id}
          {...inputProps}
        />
        {trailingControl}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-300" id={errorId} role="alert">{error}</p>}
    </div>
  )
}
