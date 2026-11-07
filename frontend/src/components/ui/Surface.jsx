const paddings = { compact: 'p-4', standard: 'p-6', spacious: 'p-8' }

export default function Surface({ as: Element = 'div', padding = 'standard', className = '', ...props }) {
  return <Element className={`rounded-[2px] border border-border bg-surface ${paddings[padding] ?? paddings.standard} ${className}`} data-surface="" {...props} />
}
