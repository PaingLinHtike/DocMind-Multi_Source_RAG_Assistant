const tones = {
  success: 'bg-success/20 text-heading',
  info: 'bg-primary/60 text-heading',
  danger: 'bg-red-500/20 text-red-200',
  neutral: 'bg-white/8 text-muted',
}

export default function StatusBadge({ children, tone = 'neutral' }) {
  return <span className={`inline-flex min-h-6 items-center justify-center rounded-md px-2 text-xs font-medium ${tones[tone]}`}>{children}</span>
}
