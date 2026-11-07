export default function BrandMark({ size = 24, className = '' }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" focusable="false" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width={size}>
      <path d="M2 4.5A12 12 0 0 1 12 7v14a12 12 0 0 0-10-2.5Z" />
      <path d="M22 4.5A12 12 0 0 0 12 7v14a12 12 0 0 1 10-2.5Z" />
    </svg>
  )
}
