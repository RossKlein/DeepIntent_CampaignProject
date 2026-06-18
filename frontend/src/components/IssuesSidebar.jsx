import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SpendAlertItem } from './SpendAlertItem'
import { useAllAlerts, useGithubIssues } from '../hooks/queries'
import { ErrorMessage, LoadingMessage } from './StatusMessage'

const PAGE_SIZE = 10

export function IssuesSidebar({ campaignId, filterCampaignIds = null }) {
  const [page, setPage] = useState(1)
  const useClientFilter = filterCampaignIds != null && filterCampaignIds.length > 0
  const linkToCampaign = !campaignId && !useClientFilter

  const filterSet = useMemo(
    () => new Set(filterCampaignIds ?? []),
    [filterCampaignIds],
  )

  useEffect(() => {
    setPage(1)
  }, [campaignId, filterCampaignIds])

  const serverQuery = useGithubIssues(
    campaignId,
    page,
    PAGE_SIZE,
    !useClientFilter,
  )
  const allAlertsQuery = useAllAlerts(useClientFilter)

  const filteredIssues = useMemo(() => {
    if (!useClientFilter) {
      return null
    }
    return (allAlertsQuery.data?.issues ?? [])
      .filter((issue) => filterSet.has(issue.campaign_id))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [useClientFilter, allAlertsQuery.data, filterSet])

  const isLoading = useClientFilter ? allAlertsQuery.isLoading : serverQuery.isLoading
  const isError = useClientFilter ? allAlertsQuery.isError : serverQuery.isError
  const error = useClientFilter ? allAlertsQuery.error : serverQuery.error

  const total = useClientFilter
    ? (filteredIssues?.length ?? 0)
    : (serverQuery.data?.total ?? 0)

  const issues = useClientFilter
    ? (filteredIssues?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [])
    : (serverQuery.data?.issues ?? [])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const issueCount = issues.length
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = total === 0 ? 0 : rangeStart + issueCount - 1

  return (
    <aside className="flex w-full flex-col border-l border-slate-200 bg-white lg:sticky lg:top-0 lg:max-h-[calc(100vh-5rem)]">
      <div className="shrink-0 border-b border-slate-200 px-4 py-4">
        <Link
          to="/alerts"
          className="text-sm font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800"
        >
          Spend Alerts
        </Link>
      </div>

      {total > 0 && (
        <div className="shrink-0 space-y-2 border-b border-slate-200 px-4 py-3">
          <p className="text-center text-xs text-slate-500">
            Showing {rangeStart}–{rangeEnd} of {total} alerts
          </p>
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-600">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded px-2 py-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              <span>
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded px-2 py-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {isLoading && <LoadingMessage label="Loading alerts..." />}
        {isError && <ErrorMessage message={error.message} />}
        {!isLoading && !isError && total === 0 && (
          <p className="px-2 text-sm text-slate-500">
            {useClientFilter ? 'No alerts for selected campaigns.' : 'No alerts yet.'}
          </p>
        )}
        {!isLoading && !isError && issueCount > 0 && (
          <ul className="space-y-2">
            {issues.map((issue) => (
              <li
                key={issue.id}
                className="rounded-lg border border-slate-200 p-3"
              >
                <SpendAlertItem
                  issue={issue}
                  linkToCampaign={linkToCampaign}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
