const base = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] border px-4 text-sm font-semibold no-underline transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-fg'

const variants = {
  primary: 'border-accent bg-accent text-white hover:border-accent-hover hover:bg-accent-hover active:bg-accent-active',
  secondary: 'border-border-strong bg-surface text-text hover:bg-surface-muted',
  ghost: 'border-transparent bg-transparent text-text hover:bg-surface-muted',
  destructive: 'border-danger bg-danger-soft text-danger hover:border-danger-hover hover:bg-danger-soft-hover hover:text-danger-hover',
  text: 'border-transparent bg-transparent px-0 text-accent hover:text-accent-hover hover:underline',
}

const sizes = {
  default: 'min-h-11 px-4',
  large: 'min-h-12 px-6 text-base',
  icon: 'size-11 min-h-11 min-w-11 p-0',
}

export function buttonClasses({ variant = 'primary', size = 'default', className = '' } = {}) {
  return `${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.default} ${className}`.trim()
}
