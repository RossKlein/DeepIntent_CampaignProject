import { Link, useParams } from 'react-router-dom'
import { CampaignCard } from '../components/CampaignCard'
import { MetricsChart } from '../components/MetricsChart'
import { ErrorMessage, LoadingMessage } from '../components/StatusMessage'
import { METRIC_CHARTS } from '../constants/metricCharts'
import { useCampaign, useCampaignData, DATA_REFRESH_INTERVAL_SECONDS } from '../hooks/queries'

export function CampaignDetailPage() {
  const { campaignId } = useParams()
  const campaignQuery = useCampaign(campaignId)
  const dataQuery = useCampaignData(campaignId)

  if (campaignQuery.isLoading || dataQuery.isLoading) {
    return <LoadingMessage label="Loading campaign..." />
  }

  if (campaignQuery.isError) {
    return <ErrorMessage message={campaignQuery.error.message} />
  }

  if (dataQuery.isError) {
    return <ErrorMessage message={dataQuery.error.message} />
  }

  const campaign = campaignQuery.data
  const chartSeries = [
    {
      id: campaign.id,
      name: campaign.name,
      data: dataQuery.data?.data ?? [],
    },
  ]

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-blue-600 hover:underline">
        ← Back to campaigns
      </Link>

      <CampaignCard campaign={campaign} linkToDetail={false} />

      <div className="space-y-8">
        {METRIC_CHARTS.map(({ metric, title }) => (
          <section key={metric}>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
            <MetricsChart series={chartSeries} metric={metric} showLegend={false} />
          </section>
        ))}
        <p className="text-xs text-slate-400">
          {dataQuery.data?.total ?? 0} data points · refreshes every {DATA_REFRESH_INTERVAL_SECONDS}s
        </p>
      </div>
    </div>
  )
}
