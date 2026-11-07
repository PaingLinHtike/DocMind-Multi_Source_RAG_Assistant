const tones = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-surface-muted text-text-secondary',
  info: 'bg-accent-soft text-accent-hover',
}

export default function StatusBadge({ children, tone = 'neutral' }) {
  return <span className={`inline-flex h-6 items-center justify-center rounded-[2px] px-2 font-mono text-xs font-medium ${tones[tone] ?? tones.neutral}`}>{children}</span>
}
