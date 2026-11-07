import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'
import Rule from '../components/ui/Rule.jsx'
import { dashboardMetrics, recentChats } from '../data/mockData.js'

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-[1360px] px-6 pb-16 pt-10 lg:px-8 lg:pt-12 xl:px-12">
      <PageHeading title="Good morning, Aung" subtitle="Your AI document assistant for asking questions and finding answers from your knowledge." />

      <ul aria-label="Library statistics" className="mt-10 grid grid-cols-2 border-y border-border sm:grid-cols-4" role="list">
        {dashboardMetrics.map((metric, index) => (
          <li className={`py-5 pr-4 sm:px-5 sm:first:pl-0 sm:last:pr-0 ${index % 2 === 1 ? 'border-l border-border pl-4' : ''} ${index > 1 ? 'border-t border-border sm:border-t-0' : ''} ${index > 0 ? 'sm:border-l sm:border-border' : ''}`} key={metric.label}>
            <p className="font-mono text-xs uppercase tracking-[0.06em] text-text-muted">{metric.label}</p>
            <p className="mt-2 font-mono text-2xl font-medium text-text sm:text-3xl">{metric.value}</p>
          </li>
        ))}
      </ul>

      <Link className="group mt-8 flex min-h-20 items-center justify-between gap-5 border-y border-border bg-surface px-4 py-4 text-text no-underline transition-colors hover:bg-surface-muted sm:px-6" to="/chat">
        <span>
          <span className="block font-display text-2xl font-medium leading-tight sm:text-3xl">Ask your documents anything…</span>
          <span className="mt-1 block text-sm text-text-secondary">Start a source-backed conversation</span>
        </span>
        <span className="grid size-11 shrink-0 place-items-center rounded-[2px] bg-accent text-white transition-colors group-hover:bg-accent-hover"><Icon name="arrowRight" /></span>
      </Link>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)] lg:gap-12">
        <section aria-label="Recent conversations">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-medium text-text sm:text-3xl">Recent conversations</h2>
            <span className="font-mono text-xs text-text-muted">{String(recentChats.length).padStart(2, '0')} entries</span>
          </div>
          <div className="mt-4 border-t border-border-strong">
            {recentChats.map((chat, index) => (
              <Link className="group grid min-h-20 grid-cols-[36px_1fr_auto] items-center gap-3 border-b border-border py-3 text-text no-underline hover:bg-surface-muted" key={chat.id} to="/chat">
                <span className="font-mono text-xs text-accent">{String(index + 1).padStart(2, '0')}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{chat.title}</span>
                  <span className="mt-1 block font-mono text-xs text-text-muted">{chat.time}</span>
                </span>
                <Icon className="text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" name="arrowRight" size={18} />
              </Link>
            ))}
          </div>
        </section>

        <section aria-label="Library" className="border-t border-border-strong pt-4">
          <h2 className="font-display text-2xl font-medium text-text sm:text-3xl">Library</h2>
          <dl className="mt-5 space-y-4">
            <div className="flex items-baseline justify-between gap-4"><dt className="text-sm text-text-secondary">Documents</dt><dd className="font-mono text-lg text-text">12 documents</dd></div>
            <Rule />
            <div className="flex items-baseline justify-between gap-4"><dt className="text-sm text-text-secondary">Storage</dt><dd className="font-mono text-lg text-text">82 MB</dd></div>
            <Rule />
            <div><dt className="text-sm text-text-secondary">Latest upload</dt><dd className="mt-2 text-sm font-medium text-text">Employee Handbook.pdf</dd><dd className="mt-1 font-mono text-xs text-text-muted">Nov 5, 2026 · 10:24 AM</dd></div>
          </dl>
          <Link className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-accent no-underline hover:text-accent-hover hover:underline" to="/documents">View documents <Icon name="arrowRight" size={18} /></Link>
        </section>
      </div>
    </section>
  )
}
