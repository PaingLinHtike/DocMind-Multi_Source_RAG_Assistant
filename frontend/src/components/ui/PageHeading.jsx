export default function PageHeading({ title, subtitle }) {
  return <header><h1 className="text-3xl font-bold tracking-tight text-heading sm:text-[42px]">{title}</h1>{subtitle && <p className="mt-2 text-sm text-muted sm:text-[17px]">{subtitle}</p>}</header>
}
