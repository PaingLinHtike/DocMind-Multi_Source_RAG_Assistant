import { Link } from 'react-router-dom'
import DocumentRow from '../components/documents/DocumentRow.jsx'
import Field from '../components/ui/Field.jsx'
import Icon from '../components/ui/Icon.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'
import { buttonClasses } from '../components/ui/buttonStyles.js'
import useDocuments from '../hooks/useDocuments.js'

export default function DocumentsPage() {
  const { documents, error, filteredDocuments, loading, query, refetch, setQuery } = useDocuments()

  if (loading) return <p className="px-6 py-16 text-center text-sm text-text-muted" role="status">Loading documents…</p>

  if (error) {
    return (
      <section className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="text-danger" role="alert">{error}</p>
        <button className="mt-5 min-h-11 rounded-[2px] bg-accent px-5 text-sm font-semibold text-white" onClick={refetch} type="button">Try again</button>
      </section>
    )
  }
  return (
    <section className="mx-auto w-full max-w-[1360px] px-6 pb-16 pt-10 lg:px-8 lg:pt-12 xl:px-12">
      <PageHeading title="Documents" subtitle="Manage your uploaded files and knowledge sources." />
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Field className="min-w-0 flex-1" controlClassName="h-11" id="document-search" inputClassName="text-sm" label="Search documents" labelClassName="sr-only" leadingIcon="search" onChange={(event) => setQuery(event.target.value)} placeholder="Search documents..." value={query} />
        <Link className={buttonClasses({ className: 'shrink-0 whitespace-nowrap sm:w-52' })} to="/upload"><Icon name="plus" size={18} />Upload document</Link>
      </div>
      {filteredDocuments.length > 0 ? (
        <div className="table-scroll mt-6 overflow-x-auto border-t border-border-strong">
          <div className="min-w-[900px]">
            <div className="grid h-11 grid-cols-[minmax(260px,2.3fr)_0.8fr_1fr_0.65fr_1.35fr] items-center gap-4 border-b border-border px-3 font-mono text-xs uppercase tracking-[0.04em] text-text-muted">
              <span className="pl-8">Name</span><span>Type</span><span>Status</span><span>Chunks</span><span>Uploaded</span>
            </div>
            {filteredDocuments.map((document) => <DocumentRow document={document} key={document.id} />)}
          </div>
        </div>
      ) : documents.length === 0 ? (
        <p className="border-y border-border py-16 text-center text-sm text-text-muted">No documents uploaded yet.</p>
      ) : (
        <p className="border-y border-border py-16 text-center text-sm text-text-muted">No documents match “{query.trim()}”.</p>
      )}
    </section>
  )
}
