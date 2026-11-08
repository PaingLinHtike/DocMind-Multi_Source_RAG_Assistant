const stages = [
  ['queued', 'Uploaded'],
  ['parsing', 'Parsing'],
  ['preprocessing', 'Preprocessing'],
  ['chunking', 'Chunking'],
  ['embedding', 'Embedding'],
  ['storing', 'Storing'],
  ['ready', 'Ready'],
]

export default function RagPipeline({ document }) {
  const currentIndex = stages.findIndex(([key]) => key === document.ragStage)
  const ready = document.status === 'Ready'
  const failed = document.status === 'Failed'

  return (
    <section aria-labelledby="rag-pipeline-heading" className="mt-12 border-t border-border-strong pt-8">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.06em] text-accent">Knowledge preparation</p>
          <h2 className="mt-2 font-display text-2xl font-medium" id="rag-pipeline-heading">RAG indexing pipeline</h2>
        </div>
        <p aria-atomic="true" className="text-sm text-text-secondary" role="status">
          {failed ? 'Indexing failed' : ready ? 'Ready for semantic search' : `Currently ${document.ragStage}`}
        </p>
      </div>

      <ol className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
        {stages.map(([key, label], index) => {
          const complete = ready || index < currentIndex
          const active = !failed && index === currentIndex
          return <li className={`border-t-2 px-3 py-4 ${active ? 'border-accent bg-accent-soft' : complete ? 'border-success bg-surface' : failed && index === currentIndex ? 'border-danger bg-danger-soft' : 'border-border bg-surface-muted'}`} key={key}><span className="block font-mono text-xs text-text-muted">{String(index + 1).padStart(2, '0')}</span><span className="mt-2 block text-sm font-medium text-text">{label}</span><span className="mt-1 block text-xs text-text-muted">{active ? 'In progress' : complete ? 'Complete' : 'Waiting'}</span></li>
        })}
      </ol>

      {failed && document.failureReason && <p className="mt-4 border-l-2 border-danger bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">{document.failureReason}</p>}

      <dl className="mt-6 grid border-t border-border sm:grid-cols-2 lg:grid-cols-4">
        {[['Chunks', document.chunks], ['Embedding model', document.embeddingModel || '—'], ['Vector collection', document.vectorCollection || '—'], ['Indexed', document.indexedAt || '—']].map(([label, value]) => <div className="border-b border-border py-4 sm:px-4 sm:first:pl-0" key={label}><dt className="text-xs text-text-muted">{label}</dt><dd className="mt-2 break-words font-mono text-sm text-text">{value}</dd></div>)}
      </dl>
    </section>
  )
}
