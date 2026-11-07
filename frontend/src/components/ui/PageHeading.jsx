export default function PageHeading({ title, subtitle }) {
  return (
    <header>
      <h1 className="font-display text-[2rem] font-medium leading-[1.1] tracking-[-0.02em] text-text lg:text-[2.5rem]">{title}</h1>
      {subtitle && <p className="mt-2 max-w-[68ch] text-base leading-relaxed text-text-secondary">{subtitle}</p>}
    </header>
  )
}
