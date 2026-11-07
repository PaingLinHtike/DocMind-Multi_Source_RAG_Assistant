import { cloneElement, isValidElement } from 'react'
import Icon from './Icon.jsx'

export default function Field({ id, label, error, helperText, description, leadingIcon, trailingControl, className = '', labelClassName = '', controlClassName = '', inputClassName = '', ...inputProps }) {
  const messageId = error ? `${id}-error` : helperText ? `${id}-helper` : undefined
  const descriptionId = description ? `${id}-description` : undefined
  const describedBy = [messageId, descriptionId].filter(Boolean).join(' ') || undefined
  const leading = typeof leadingIcon === 'string' ? <Icon name={leadingIcon} /> : leadingIcon
  const trailing = isValidElement(trailingControl)
    ? cloneElement(trailingControl, { className: `min-h-11 min-w-11 ${trailingControl.props.className ?? ''}`.trim() })
    : trailingControl

  return (
    <div className={className}>
      <label className={`mb-1.5 block text-sm font-semibold text-text ${labelClassName}`} htmlFor={id}>{label}</label>
      <div className={`field-control flex min-h-11 min-w-0 items-center rounded-[2px] border bg-surface transition-colors focus-within:border-focus focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus ${error ? 'border-danger' : 'border-border-strong'} ${controlClassName}`}>
        {leading && <span className="ml-3 grid size-5 shrink-0 place-items-center text-text-muted">{leading}</span>}
        <input aria-describedby={describedBy} aria-invalid={Boolean(error)} className={`min-h-11 min-w-0 flex-1 bg-transparent px-3 text-base text-text outline-none placeholder:text-text-muted ${inputClassName}`} id={id} {...inputProps} />
        {trailing}
      </div>
      {helperText && !error && <p className="mt-1.5 text-sm text-text-muted" id={`${id}-helper`}>{helperText}</p>}
      {error && <p className="mt-1.5 text-sm text-danger" id={`${id}-error`} role="alert">{error}</p>}
      {description && <div className="mt-1.5" id={descriptionId}>{description}</div>}
    </div>
  )
}
