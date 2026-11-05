import PageHeading from '../components/ui/PageHeading.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import dashboardChat from '../assets/figma/dashboard-chat.svg'
import { dashboardMetrics, recentChats } from '../data/mockData.js'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const levels = ['30', '20', '10', '0']

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-[1290px] px-6 pb-10 pt-[41px] lg:px-0">
      <PageHeading title="Good morning, Aung 👋" subtitle="Your AI document assistant for asking questions and finding answers from your knowledge." />

      <div className="mt-[63px] grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <article className="flex h-[124px] flex-col justify-between rounded-[17px] border border-border bg-surface px-7 py-5" key={metric.label}>
            <p className="text-lg font-medium text-muted">{metric.label}</p>
            <div className="flex items-end justify-between">
              <strong className="text-4xl leading-none text-heading">{metric.value}</strong>
              {metric.change && <StatusBadge tone="success">{metric.change}</StatusBadge>}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-[31px] grid gap-[30px] xl:grid-cols-[minmax(0,850px)_409px]">
        <article className="h-[308px] rounded-[17px] border border-border bg-surface px-5 pb-5 pt-4 sm:px-7">
          <h2 className="text-[23px] font-semibold text-heading">Chat Activity</h2>
          <div className="mt-8 grid h-[205px] grid-cols-[28px_1fr] gap-4 text-xs text-muted">
            <div className="flex flex-col justify-between pb-7">{levels.map((level) => <span key={level}>{level}</span>)}</div>
            <div className="grid grid-rows-[repeat(4,1fr)_28px]">
              {levels.map((level) => <div aria-hidden="true" className="border-t border-border" key={level} />)}
              <div className="grid grid-cols-7 items-end text-center">{days.map((day) => <span key={day}>{day}</span>)}</div>
            </div>
          </div>
        </article>

        <article className="min-h-[308px] rounded-[17px] border border-border bg-surface px-6 py-4">
          <h2 className="text-[23px] font-semibold text-heading">Recent Chats</h2>
          <div className="mt-8 divide-y divide-border">
            {recentChats.map((chat) => (
              <div className="flex gap-4 py-3 first:pt-0" key={chat.id}>
                <img alt="" className="mt-1" src={dashboardChat} />
                <div><p className="text-base text-heading">{chat.title}</p><p className="mt-1 text-xs text-muted">{chat.time}</p></div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
