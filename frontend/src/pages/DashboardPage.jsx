import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../api/dashboard.js'
import { useAuth } from '../auth/authSessionStore.js'
import Icon from '../components/ui/Icon.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'
import Rule from '../components/ui/Rule.jsx'

const metricDefinitions = [
  ['documents', 'Documents'],
  ['conversations', 'Conversations'],
  ['messages', 'Messages'],
  ['storage_bytes', 'Storage used'],
]

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024)} MB`
}

function formatMetric(key, value) {
  return key === 'storage_bytes' ? formatBytes(value) : new Intl.NumberFormat('en-US').format(value)
}

function formatDate(value, options = { month: 'short', day: 'numeric' }) {
  return new Date(value).toLocaleString('en-US', options)
}

export default function DashboardPage() {
  const { handleUnauthorized } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    getDashboard({ signal: controller.signal })
      .then((data) => {
        if (active) setDashboard(data)
      })
      .catch((requestError) => {
        if (!active || handleUnauthorized(requestError)) return
        setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [handleUnauthorized, requestVersion])

  function retry() {
    setError('')
    setLoading(true)
    setRequestVersion((version) => version + 1)
  }

  if (loading) return <p className="px-6 py-16 text-center text-sm text-text-muted" role="status">Loading dashboard…</p>

  if (error) {
    return (
      <section className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="text-danger" role="alert">{error}</p>
        <button className="mt-5 min-h-11 rounded-[2px] bg-accent px-5 text-sm font-semibold text-white" onClick={retry} type="button">Try again</button>
      </section>
    )
  }

  if (!dashboard) return null

  const latestUpload = dashboard.recent_uploads[0]

  return (
    <section className="mx-auto w-full max-w-[1360px] px-6 pb-16 pt-10 lg:px-8 lg:pt-12 xl:px-12">
      <PageHeading title={`Good morning, ${dashboard.user.name}`} subtitle="Your AI document assistant for asking questions and finding answers from your knowledge." />

      <ul aria-label="Library statistics" className="mt-10 grid grid-cols-2 border-y border-border sm:grid-cols-4" role="list">
        {metricDefinitions.map(([key, label], index) => (
          <li className={`py-5 pr-4 sm:px-5 sm:first:pl-0 sm:last:pr-0 ${index % 2 === 1 ? 'border-l border-border pl-4' : ''} ${index > 1 ? 'border-t border-border sm:border-t-0' : ''} ${index > 0 ? 'sm:border-l sm:border-border' : ''}`} key={key}>
            <p className="font-mono text-xs uppercase tracking-[0.06em] text-text-muted">{label}</p>
            <p className="mt-2 font-mono text-2xl font-medium text-text sm:text-3xl">{formatMetric(key, dashboard.metrics[key].value)}</p>
          </li>
        ))}
      </ul>

      <Link className="group mt-8 flex min-h-20 items-center justify-between gap-5 border-y border-border bg-surface px-4 py-4 text-text no-underline transition-colors hover:bg-surface-muted sm:px-6" to="/chat">
        <span><span className="block font-display text-2xl font-medium leading-tight sm:text-3xl">Ask your documents anything…</span><span className="mt-1 block text-sm text-text-secondary">Start a source-backed conversation</span></span>
        <span className="grid size-11 shrink-0 place-items-center rounded-[2px] bg-accent text-white transition-colors group-hover:bg-accent-hover"><Icon name="arrowRight" /></span>
      </Link>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)] lg:gap-12">
        <section aria-label="Recent conversations">
          <div className="flex items-end justify-between gap-4"><h2 className="font-display text-2xl font-medium text-text sm:text-3xl">Recent conversations</h2><span className="font-mono text-xs text-text-muted">{String(dashboard.recent_conversations.length).padStart(2, '0')} entries</span></div>
          {dashboard.recent_conversations.length === 0 ? <p className="border-y border-border py-8 text-sm text-text-muted">No recent conversations yet.</p> : (
            <div className="mt-4 border-t border-border-strong">
              {dashboard.recent_conversations.map((conversation, index) => (
                <Link className="group grid min-h-20 grid-cols-[36px_1fr_auto] items-center gap-3 border-b border-border py-3 text-text no-underline hover:bg-surface-muted" key={conversation.id} to="/chat">
                  <span className="font-mono text-xs text-accent">{String(index + 1).padStart(2, '0')}</span>
                  <span className="min-w-0"><span className="block truncate font-medium">{conversation.title}</span><span className="mt-1 block font-mono text-xs text-text-muted">{formatDate(conversation.updated_at)}</span></span>
                  <Icon className="text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" name="arrowRight" size={18} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section aria-label="Library" className="border-t border-border-strong pt-4">
          <h2 className="font-display text-2xl font-medium text-text sm:text-3xl">Library</h2>
          <dl className="mt-5 space-y-4">
            <div className="flex items-baseline justify-between gap-4"><dt className="text-sm text-text-secondary">Documents</dt><dd className="font-mono text-lg text-text">{formatMetric('documents', dashboard.metrics.documents.value)} documents</dd></div>
            <Rule />
            <div className="flex items-baseline justify-between gap-4"><dt className="text-sm text-text-secondary">Storage</dt><dd className="font-mono text-lg text-text">{formatBytes(dashboard.metrics.storage_bytes.value)}</dd></div>
            <Rule />
            <div><dt className="text-sm text-text-secondary">Latest upload</dt>{latestUpload ? <><dd className="mt-2 text-sm font-medium text-text">{latestUpload.name}</dd><dd className="mt-1 font-mono text-xs text-text-muted">{formatDate(latestUpload.uploaded_at, { dateStyle: 'medium', timeStyle: 'short' })}</dd></> : <dd className="mt-2 text-sm text-text-muted">No uploads yet.</dd>}</div>
          </dl>
          <Link className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-accent no-underline hover:text-accent-hover hover:underline" to="/documents">View documents <Icon name="arrowRight" size={18} /></Link>
        </section>
      </div>
    </section>
  )
}
