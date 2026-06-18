import { Link } from 'react-router-dom'
import { formatCurrency, formatPercent } from '../utils/format'

export function CampaignCard({
  campaign,
  showCheckbox = false,
  selected = false,
  onToggleSelect,
  linkToDetail = true,
}) {
  const latest = campaign.latest

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(campaign.id)}
            className="mt-1"
            aria-label={`Select ${campaign.name}`}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {linkToDetail ? (
              <Link
                to={`/campaigns/${campaign.id}`}
                className="text-lg font-semibold text-blue-700 hover:underline"
              >
                {campaign.name}
              </Link>
            ) : (
              <h2 className="text-lg font-semibold text-slate-900">{campaign.name}</h2>
            )}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase text-slate-600">
              {campaign.status}
            </span>
            {latest?.over_budget_threshold && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                Over 90% budget
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {campaign.advertiser} · {campaign.start_date} → {campaign.end_date}
          </p>

          {latest ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:grid-cols-7">
              <Metric label="Budget" value={formatCurrency(latest.budget)} />
              <Metric label="Spend" value={formatCurrency(latest.spend)} />
              <Metric label="Spend %" value={formatPercent(latest.spend_pct)} />
              <Metric label="Impressions" value={latest.impressions.toLocaleString()} />
              <Metric label="Clicks" value={latest.clicks.toLocaleString()} />
              <Metric label="CTR" value={formatPercent(latest.ctr * 100)} />
              <Metric label="CPM" value={formatCurrency(latest.cpm)} />
            </dl>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No metrics synced yet.</p>
          )}
        </div>
      </div>
    </article>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 font-medium text-slate-900">{value}</dd>
    </div>
  )
}
