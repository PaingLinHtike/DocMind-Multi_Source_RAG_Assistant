export default function PageHeading({ title, subtitle }) {
  return (
    <header>
      <h1 className="text-3xl font-bold leading-tight tracking-tight text-heading max-sm:text-2xl">{title}</h1>
      {subtitle && <p className="mt-2 text-base leading-relaxed text-muted">{subtitle}</p>}
    </header>
  )
}
