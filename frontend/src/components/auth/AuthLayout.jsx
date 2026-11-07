import { Link } from 'react-router-dom'
import BrandMark from '../ui/BrandMark.jsx'
import Icon from '../ui/Icon.jsx'
import Rule from '../ui/Rule.jsx'

const variants = {
  signin: { label: 'Sign in workspace', features: [{ icon: 'chat', title: 'Chat with documents' }, { icon: 'bookOpen', title: 'Cited answers' }, { icon: 'lock', title: 'Private knowledge base' }] },
  signup: { label: 'Create account workspace', features: [{ icon: 'upload', title: 'Upload documents' }, { icon: 'chat', title: 'Ask questions' }, { icon: 'bookOpen', title: 'Trace every answer' }] },
}

export default function AuthLayout({ children, variant }) {
  const config = variants[variant]
  return (
    <div className="min-h-screen bg-canvas text-text">
      <header className="mx-auto flex h-20 w-full max-w-[1200px] items-center px-6 lg:px-12">
        <Link className="flex min-h-11 items-center gap-3 text-xl font-semibold text-text no-underline" to="/signin"><BrandMark className="text-accent" /><span>DocMind</span></Link>
      </header>
      <main className="mx-auto flex w-full max-w-[1100px] items-center px-6 pb-12 pt-4 lg:min-h-[680px] lg:px-12 lg:pt-0">
        <section aria-label={config.label} className="grid w-full grid-cols-1 overflow-hidden rounded-[2px] border border-border bg-surface lg:grid-cols-[1fr_1px_1fr]" role="region">
          <div className="min-w-0 px-6 py-8 sm:px-10 lg:px-12 lg:py-12">{children}</div>
          <Rule className="hidden lg:block" orientation="vertical" />
          <aside className="border-t border-border px-6 py-8 sm:px-10 lg:border-0 lg:px-12 lg:py-12">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-accent">DocMind workspace</p>
            <h2 className="mt-4 max-w-[12ch] font-display text-[2.375rem] font-medium leading-[1.04] text-text lg:text-5xl">Your documents, read closely.</h2>
            <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-text-secondary">Ask questions, trace every answer to its source, and keep your knowledge in one quiet workspace.</p>
            <div className="mt-8 space-y-2 border-t border-border pt-5">
              {config.features.map((feature) => <div className="flex min-h-11 items-center gap-3 text-sm font-medium text-text" key={feature.title}><Icon className="text-accent" name={feature.icon} /><h3 className="text-sm font-medium">{feature.title}</h3></div>)}
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}
