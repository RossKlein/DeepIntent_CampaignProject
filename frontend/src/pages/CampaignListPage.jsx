import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CampaignCard } from '../components/CampaignCard'
import {
  CampaignFiltersDropdown,
  createEmptyNumericFilters,
} from '../components/CampaignFiltersDropdown'
import { useCompareSelection } from '../context/CompareSelectionContext'
import { DATA_REFRESH_INTERVAL_SECONDS, useCampaigns } from '../hooks/queries'
import { ErrorMessage, LoadingMessage } from '../components/StatusMessage'
import {
  countActiveNumericFilters,
  passesNumericFilters,
} from '../utils/campaignFilters'

const SORT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'advertiser', label: 'Advertiser' },
  { key: 'status', label: 'Status' },
  { key: 'start_date', label: 'Start' },
  { key: 'end_date', label: 'End' },
  { key: 'budget', label: 'Budget' },
  { key: 'spend', label: 'Spend' },
  { key: 'spend_pct', label: 'Spend %' },
  { key: 'cpm', label: 'CPM' },
  { key: 'ctr', label: 'CTR' },
  { key: 'impressions', label: 'Impressions' },
  { key: 'clicks', label: 'Clicks' },
]

function getSortValue(campaign, key) {
  const latest = campaign.latest
  switch (key) {
    case 'name':
      return campaign.name.toLowerCase()
    case 'advertiser':
      return campaign.advertiser.toLowerCase()
    case 'status':
      return campaign.status.toLowerCase()
    case 'start_date':
      return campaign.start_date ?? ''
    case 'end_date':
      return campaign.end_date ?? ''
    case 'budget':
      return latest?.budget ?? -1
    case 'spend':
      return latest?.spend ?? -1
    case 'spend_pct':
      return latest?.spend_pct ?? -1
    case 'cpm':
      return latest?.cpm ?? -1
    case 'ctr':
      return latest?.ctr ?? -1
    case 'impressions':
      return latest?.impressions ?? -1
    case 'clicks':
      return latest?.clicks ?? -1
    default:
      return ''
  }
}

export function CampaignListPage() {
  const { data, isLoading, isError, error } = useCampaigns()
  const { selectedIds, toggleSelected, clearSelection } = useCompareSelection()
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [statusFilters, setStatusFilters] = useState(new Set())
  const [overBudgetOnly, setOverBudgetOnly] = useState(false)
  const [numericFilters, setNumericFilters] = useState(createEmptyNumericFilters)
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const navigate = useNavigate()

  const campaigns = data?.campaigns ?? []

  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase()

    let result = campaigns.filter((campaign) => {
      if (query) {
        const haystack = `${campaign.name} ${campaign.advertiser}`.toLowerCase()
        if (!haystack.includes(query)) {
          return false
        }
      }

      if (statusFilters.size > 0 && !statusFilters.has(campaign.status)) {
        return false
      }

      if (overBudgetOnly && !campaign.latest?.over_budget_threshold) {
        return false
      }

      if (!passesNumericFilters(campaign, numericFilters)) {
        return false
      }

      return true
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
  }, [campaigns, search, statusFilters, overBudgetOnly, numericFilters, sortKey, sortDir])

  function toggleStatusFilter(status) {
    setStatusFilters((current) => {
      const next = new Set(current)
      if (next.has(status)) {
        next.delete(status)
      } else {
        next.add(status)
      }
      return next
    })
  }

  function handleNumericFilterChange(key, patch) {
    setNumericFilters((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }))
  }

  function clearAllFilters() {
    setStatusFilters(new Set())
    setOverBudgetOnly(false)
    setNumericFilters(createEmptyNumericFilters())
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function goToCompare() {
    navigate(`/compare?ids=${Array.from(selectedIds).join(',')}`)
  }

  const activeFilterCount =
    statusFilters.size +
    (overBudgetOnly ? 1 : 0) +
    countActiveNumericFilters(numericFilters)

  if (isLoading) {
    return <LoadingMessage label="Loading campaigns..." />
  }

  if (isError) {
    return <ErrorMessage message={error.message} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Campaigns</h1>
          <p className="text-sm text-slate-500">
            {filteredCampaigns.length} of {data.total} shown · refreshes every{' '}
            {DATA_REFRESH_INTERVAL_SECONDS}s
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Clear selection
            </button>
          )}
          <button
            type="button"
            disabled={selectedIds.size < 2}
            onClick={goToCompare}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Compare selected ({selectedIds.size})
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search campaigns or advertisers..."
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="relative">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                {activeFilterCount}
              </span>
            )}
          </button>
          {filtersOpen && (
            <CampaignFiltersDropdown
              statusFilters={statusFilters}
              overBudgetOnly={overBudgetOnly}
              numericFilters={numericFilters}
              onToggleStatus={toggleStatusFilter}
              onToggleOverBudget={() => setOverBudgetOnly((v) => !v)}
              onNumericFilterChange={handleNumericFilterChange}
              onClearFilters={clearAllFilters}
              onClose={() => setFiltersOpen(false)}
            />
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <div className="flex min-w-max gap-1 border-b border-slate-200 px-2 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          <span className="w-8 shrink-0" aria-hidden />
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
        {filteredCampaigns.length === 0 && (
          <p className="text-sm text-slate-500">
            {campaigns.length === 0
              ? 'No campaigns yet. Waiting for data to load...'
              : 'No campaigns match your filters.'}
          </p>
        )}
        {filteredCampaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            showCheckbox
            selected={selectedIds.has(campaign.id)}
            onToggleSelect={toggleSelected}
          />
        ))}
      </div>
    </div>
  )
}
