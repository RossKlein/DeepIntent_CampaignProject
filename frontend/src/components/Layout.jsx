import { Link, NavLink, Outlet, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import { CompareSelectionProvider } from '../context/CompareSelectionContext'
import { IssuesSidebar } from './IssuesSidebar'
import { NextDayButton } from './NextDayButton'

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 hover:bg-slate-100 ${
    isActive ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-600'
  }`

function LayoutContent() {
  const { campaignId } = useParams()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const showSidebar = !location.pathname.startsWith('/alerts')
  const sidebarCampaignId = location.pathname.startsWith('/campaigns/')
    ? campaignId
    : undefined

  const compareFilterIds = useMemo(() => {
    if (!location.pathname.startsWith('/compare')) {
      return null
    }
    const raw = searchParams.get('ids')
    const ids = raw ? raw.split(',').filter(Boolean) : []
    return ids.length >= 2 ? ids : null
  }, [location.pathname, searchParams])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <Link to="/" className="text-lg font-semibold text-slate-900">
              Campaign Dashboard
            </Link>
            <p className="text-sm text-slate-500">
              Live campaign metrics and budget alerts
            </p>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <NavLink to="/" end className={navLinkClass}>
              Campaigns
            </NavLink>
            <NavLink to="/alerts" className={navLinkClass}>
              Manage Alerts
            </NavLink>
            <NavLink to="/compare" className={navLinkClass}>
              Compare
            </NavLink>
            <NextDayButton />
          </nav>
        </div>
      </header>

      <div
        className={
          showSidebar
            ? 'mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]'
            : 'mx-auto w-full max-w-7xl flex-1'
        }
      >
        <main className="min-w-0 p-6">
          <Outlet />
        </main>
        {showSidebar && (
          <div className="sticky top-0 hidden min-h-0 lg:block">
            <IssuesSidebar
              campaignId={sidebarCampaignId}
              filterCampaignIds={compareFilterIds}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function Layout() {
  return (
    <CompareSelectionProvider>
      <LayoutContent />
    </CompareSelectionProvider>
  )
}
