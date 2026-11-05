import { Link } from 'react-router-dom'
import searchIcon from '../assets/figma/search.svg'
import DocumentRow from '../components/documents/DocumentRow.jsx'
import Icon from '../components/ui/Icon.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'
import useDocumentsPrototype from '../hooks/useDocumentsPrototype.js'

export default function DocumentsPage() {
  const { query, setQuery, filteredDocuments } = useDocumentsPrototype()

  return (
    <section className="mx-auto w-full max-w-[1296px] px-6 pb-12 pt-10 lg:px-0">
      <PageHeading title="Documents" subtitle="Manage your uploaded files and knowledge sources." />

      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <label className="flex h-11 min-w-0 flex-1 items-center rounded-lg border border-border bg-[#202a47] px-3">
          <span className="mr-2 grid size-5 shrink-0 place-items-center"><img alt="" className="size-full" src={searchIcon} /></span>
          <span className="sr-only">Search documents</span>
          <input className="min-w-0 flex-1 bg-transparent text-sm text-heading outline-none placeholder:text-muted" onChange={(event) => setQuery(event.target.value)} placeholder="Search documents..." value={query} />
        </label>
        <Link className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-primary-border bg-primary px-4 text-sm font-semibold text-heading no-underline transition-colors hover:bg-primary/90 sm:w-[223px]" to="/upload">
          <Icon name="plus" size={18} />
          Upload Document
        </Link>
      </div>

      <div className="table-scroll mt-6 overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid h-12 grid-cols-[minmax(240px,2.3fr)_0.9fr_1.2fr_0.7fr_1.25fr] items-center gap-4 border-b border-border px-3 text-xs font-medium text-muted">
            <span className="pl-8">Name</span><span>Type</span><span>Status</span><span>Chunks</span><span>Uploaded</span>
          </div>
          {filteredDocuments.map((document) => <DocumentRow document={document} key={document.id} />)}
          {filteredDocuments.length === 0 && <p className="py-16 text-center text-sm text-muted">No documents match “{query.trim()}”.</p>}
        </div>
      </div>
    </section>
  )
}
