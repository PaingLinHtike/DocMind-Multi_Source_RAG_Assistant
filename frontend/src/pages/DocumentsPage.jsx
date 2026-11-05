import { Link } from 'react-router-dom'
import searchIcon from '../assets/figma/search.svg'
import DocumentRow from '../components/documents/DocumentRow.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'
import useDocumentsPrototype from '../hooks/useDocumentsPrototype.js'

export default function DocumentsPage() {
  const { query, setQuery, filteredDocuments } = useDocumentsPrototype()

  return (
    <section className="mx-auto w-full max-w-[1296px] px-6 pb-12 pt-[41px] lg:px-0">
      <PageHeading title="Documents" subtitle="Manage your uploaded files and knowledge sources." />

      <div className="mt-[33px] flex flex-col gap-5 sm:flex-row">
        <label className="flex h-[61px] min-w-0 flex-1 items-center rounded-[11px] border border-border bg-[#202a47] px-4">
          <span className="mr-3"><img alt="" src={searchIcon} /></span>
          <span className="sr-only">Search documents</span>
          <input className="min-w-0 flex-1 bg-transparent text-heading outline-none placeholder:text-muted" onChange={(event) => setQuery(event.target.value)} placeholder="Search documents..." value={query} />
        </label>
        <Link className="grid h-[61px] shrink-0 place-items-center rounded-[13px] border border-[#866aff] bg-[#5932d2] px-8 text-lg font-semibold text-heading no-underline sm:w-[223px]" to="/upload">+ Upload Document</Link>
      </div>

      <div className="mt-8 overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid h-[57px] grid-cols-[minmax(240px,2.3fr)_0.9fr_1.2fr_0.7fr_1.25fr] items-center gap-4 border-b border-border px-4 font-semibold text-muted">
            <span className="pl-[55px]">Name</span><span>Type</span><span>Status</span><span>Chunks</span><span>Uploaded</span>
          </div>
          {filteredDocuments.map((document) => <DocumentRow document={document} key={document.id} />)}
          {filteredDocuments.length === 0 && <p className="py-16 text-center text-muted">No documents match “{query.trim()}”.</p>}
        </div>
      </div>
    </section>
  )
}
