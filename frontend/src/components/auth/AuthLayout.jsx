import { Link } from 'react-router-dom'
import docMindIcon from '../../assets/figma/docmind-icon.svg'
import Icon from '../ui/Icon.jsx'

const variants = {
  signin: {
    label: 'Sign in workspace',
    features: [
      { icon: 'messageCircle', title: 'Chat with documents', description: 'Ask questions and get answers from your files.' },
      { icon: 'layers', title: 'Cited answers', description: 'Get reliable, source-backed responses with clear citations.' },
      { icon: 'lock', title: 'Private knowledge base', description: 'Keep your company or personal documents secure and organized.' },
    ],
  },
  signup: {
    label: 'Create account workspace',
    features: [
      { icon: 'fileText', title: 'Upload documents', description: 'Bring your knowledge into DocMind.' },
      { icon: 'messageCircle', title: 'Ask questions', description: 'Get reliable, grounded answers.' },
      { icon: 'layers', title: 'Trace every answer', description: 'See and verify the source instantly.' },
    ],
  },
}

function Feature({ feature }) {
  return (
    <div className="flex items-start gap-5">
      <span className="grid size-16 shrink-0 place-items-center rounded-2xl border border-[#5f54aa] bg-[#302d67] text-[#b084ff]">
        <Icon name={feature.icon} size={32} />
      </span>
      <div className="pt-1">
        <h2 className="text-xl font-semibold text-heading">{feature.title}</h2>
        <p className="mt-1 max-w-64 text-base leading-snug text-muted">{feature.description}</p>
      </div>
    </div>
  )
}

export default function AuthLayout({ children, variant }) {
  const config = variants[variant]

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas text-heading">
      <div aria-hidden="true" className="pointer-events-none absolute -right-44 -top-60 size-[560px] rounded-full border-2 border-cyan-300/80" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-96 -left-80 size-[660px] rounded-full border-2 border-[#a46cff] bg-[#432093]/50" />

      <header className="relative z-10 mx-auto flex h-24 w-full max-w-[1320px] items-center px-5 sm:px-8">
        <Link className="flex min-h-11 items-center gap-2.5 text-2xl font-bold text-heading no-underline" to="/signin">
          <img alt="" className="size-11" src={docMindIcon} />
          <span>DocMind</span>
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[1050px] items-center px-5 pb-12 pt-6 sm:px-8 lg:min-h-[650px] lg:pt-0">
        <section aria-label={config.label} className="grid w-full grid-cols-1 overflow-hidden rounded-3xl border border-[#53678f] bg-[#142341] shadow-2xl shadow-black/20 lg:grid-cols-[1.4fr_1fr]" role="region">
          <div className="bg-[#1a2342]/90 px-6 py-8 sm:px-10 lg:px-16 lg:py-10">
            {children}
          </div>

          <aside className="border-t border-[#425476] px-6 py-8 sm:px-10 lg:border-l lg:border-t-0 lg:px-8 lg:py-12">
            {variant === 'signup' && (
              <div className="mb-10 flex justify-center lg:justify-start lg:pl-20">
                <span className="grid size-28 place-items-center rounded-3xl border border-[#8c5aff] bg-[#3b1c75] text-[#b064ff]">
                  <img alt="" className="size-16" src={docMindIcon} />
                </span>
              </div>
            )}
            <div className={`space-y-8 ${variant === 'signin' ? 'lg:pt-14' : ''}`}>
              {config.features.map((feature) => <Feature feature={feature} key={feature.title} />)}
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}
