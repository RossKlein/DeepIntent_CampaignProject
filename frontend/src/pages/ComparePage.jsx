import { useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { CampaignCard } from '../components/CampaignCard'
import { MetricsChart } from '../components/MetricsChart'
import { ErrorMessage, LoadingMessage } from '../components/StatusMessage'
import { METRIC_CHARTS } from '../constants/metricCharts'
import { useCompareSelection } from '../context/CompareSelectionContext'
import {
  campaignDataQueryOptions,
  DATA_REFRESH_INTERVAL_SECONDS,
  useCampaigns,
} from '../hooks/queries'

function selectionMatches(a, b) {
  if (a.length !== b.length) {
    return false
  }
  const setB = new Set(b)
  return a.every((id) => setB.has(id))
}

export function ComparePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const campaignsQuery = useCampaigns()
  const { selectedIds: storedSelection, setSelection } = useCompareSelection()

  const urlIds = useMemo(() => {
    const raw = searchParams.get('ids')
    return raw ? raw.split(',').filter(Boolean) : []
  }, [searchParams])

  const selectedIds = urlIds.length >= 2 ? urlIds : Array.from(storedSelection)

  useEffect(() => {
    if (urlIds.length >= 2) {
      const storedArray = Array.from(storedSelection)
      if (!selectionMatches(urlIds, storedArray)) {
        setSelection(urlIds)
      }
      return
    }
    if (storedSelection.size >= 2) {
      navigate(`/compare?ids=${Array.from(storedSelection).join(',')}`, {
        replace: true,
      })
    }
  }, [urlIds, storedSelection, setSelection, navigate])

  const dataQueries = useQueries({
    queries: selectedIds.map((id) => campaignDataQueryOptions(id)),
  })

  if (campaignsQuery.isLoading) {
    return <LoadingMessage label="Loading campaigns..." />
  }

  if (campaignsQuery.isError) {
    return <ErrorMessage message={campaignsQuery.error.message} />
  }

  const campaigns = campaignsQuery.data?.campaigns ?? []
  const isLoadingData = dataQueries.some((query) => query.isLoading)
  const hasDataError = dataQueries.find((query) => query.isError)

  const selectedCampaigns = selectedIds
    .map((id) => campaigns.find((item) => item.id === id))
    .filter(Boolean)

  const chartSeries = selectedIds.map((id, index) => {
    const campaign = campaigns.find((item) => item.id === id)
    return {
      id,
      name: campaign?.name ?? id,
      data: dataQueries[index]?.data?.data ?? [],
    }
  })

  const maxDataPoints = Math.max(
    0,
    ...dataQueries.map((query) => query.data?.total ?? 0),
  )

  function handleChangeSelection() {
    navigate('/')
  }

  if (selectedIds.length < 2) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Compare campaigns</h1>
        <p className="text-sm text-slate-500">
          Select two or more campaigns on the home screen, then click Compare.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Choose campaigns
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Compare campaigns</h1>
        <button
          type="button"
          onClick={handleChangeSelection}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Change selection
        </button>
      </div>

      <div className="space-y-3">
        {selectedCampaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      {hasDataError && <ErrorMessage message={hasDataError.error.message} />}

      {isLoadingData && <LoadingMessage label="Loading campaign history..." />}

      {!isLoadingData && !hasDataError && (
        <div className="space-y-8">
          {METRIC_CHARTS.map(({ metric, title }) => (
            <section key={metric}>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
              <MetricsChart series={chartSeries} metric={metric} />
            </section>
          ))}
          <p className="text-xs text-slate-400">
            Up to {maxDataPoints} data points per campaign · refreshes every{' '}
            {DATA_REFRESH_INTERVAL_SECONDS}s
          </p>
        </div>
      )}
    </div>
  )
}
