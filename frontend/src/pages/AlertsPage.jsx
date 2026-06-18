import { useMemo, useState } from 'react'
import { SpendAlertCard } from '../components/SpendAlertItem'
import { useAllAlerts, DATA_REFRESH_INTERVAL_SECONDS } from '../hooks/queries'
import { ErrorMessage, LoadingMessage } from '../components/StatusMessage'

const SORT_COLUMNS = [
  { key: 'title', label: 'Title' },
  { key: 'campaign_name', label: 'Campaign' },
  { key: 'created_at', label: 'Date' },
]

function getSortValue(alert, key) {
  switch (key) {
    case 'title':
      return alert.title.toLowerCase()
    case 'campaign_name':
      return alert.campaign_name.toLowerCase()
    case 'created_at':
      return alert.created_at
    default:
      return ''
  }
}

export function AlertsPage() {
  const { data, isLoading, isError, error } = useAllAlerts()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  const alerts = data?.issues ?? []

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase()

    let result = alerts.filter((alert) => {
      if (!query) {
        return true
      }
      const haystack = `${alert.title} ${alert.campaign_name}`.toLowerCase()
      return haystack.includes(query)
    })

    result = [...result].sort((a, b) => {
      const aVal = getSortValue(a, sortKey)
      const bVal = getSortValue(b, sortKey)
      if (aVal < bVal) {
        return sortDir === 'asc' ? -1 : 1
      }
      if (aVal > bVal) {
        return sortDir === 'asc' ? 1 : -1
      }
      return 0
    })

    return result
  }, [alerts, search, sortKey, sortDir])

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'created_at' ? 'desc' : 'asc')
    }
  }

  if (isLoading) {
    return <LoadingMessage label="Loading alerts..." />
  }

  if (isError) {
    return <ErrorMessage message={error.message} />
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Manage Alerts</h1>
        <p className="text-sm text-slate-500">
          {filteredAlerts.length} of {data.total} shown · refreshes every {DATA_REFRESH_INTERVAL_SECONDS}s
        </p>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search alerts or campaigns..."
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <div className="flex min-w-max gap-1 border-b border-slate-200 px-2 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          {SORT_COLUMNS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSort(key)}
              className={`shrink-0 rounded px-2 py-1 hover:bg-slate-100 ${
                sortKey === key ? 'bg-slate-100 text-slate-900' : ''
              }`}
            >
              {label}
              {sortKey === key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredAlerts.length === 0 && (
          <p className="text-sm text-slate-500">
            {alerts.length === 0
              ? 'No spend alerts yet.'
              : 'No alerts match your search.'}
          </p>
        )}
        {filteredAlerts.map((alert) => (
          <article
            key={alert.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <SpendAlertCard issue={alert} />
          </article>
        ))}
      </div>
    </div>
  )
}
