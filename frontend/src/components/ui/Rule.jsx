export default function Rule({ orientation = 'horizontal', className = '', ...props }) {
  if (orientation === 'vertical') {
    return <div aria-orientation="vertical" className={`w-px self-stretch bg-border ${className}`} role="separator" {...props} />
  }

  return <hr className={`m-0 border-0 border-t border-border ${className}`} {...props} />
}
