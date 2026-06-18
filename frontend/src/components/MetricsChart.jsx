import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatChartAxisTime, formatCurrency, formatPercent } from '../utils/format'

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2']

const METRIC_FORMATTERS = {
  spend_pct: (v) => formatPercent(v),
  ctr: (v) => formatPercent(v),
  cpm: (v) => formatCurrency(v),
  impressions: (v) => v.toLocaleString(),
  clicks: (v) => v.toLocaleString(),
}

function getMetricValue(point, metric) {
  switch (metric) {
    case 'spend_pct':
      return point.spend_pct
    case 'impressions':
      return point.impressions
    case 'clicks':
      return point.clicks
    case 'cpm':
      return point.cpm
    case 'ctr':
      return point.ctr * 100
    default:
      return point.spend_pct
  }
}

export function MetricsChart({
  series,
  metric = 'spend_pct',
  height = 320,
  showLegend = series.length > 1,
}) {
  if (!series.length) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        No metrics data yet.
      </div>
    )
  }

  const chartData = buildChartData(series, metric)

  if (chartData.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        No metrics data yet.
      </div>
    )
  }

  const formatValue = METRIC_FORMATTERS[metric] ?? ((v) => String(v))
  const showDots = chartData.length <= 30

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="timeLabel"
            tick={{ fontSize: 11 }}
            stroke="#64748b"
            interval="preserveStartEnd"
            minTickGap={48}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#64748b"
            tickFormatter={(v) => formatValue(v)}
            width={72}
          />
          <Tooltip formatter={(value) => formatValue(value)} labelFormatter={(_, payload) => {
            const row = payload?.[0]?.payload
            return row?.timestamp ? formatChartAxisTime(row.timestamp) : ''
          }}
          />
          {showLegend && <Legend />}
          {series.map((item, index) => (
            <Line
              key={item.id}
              type="monotone"
              dataKey={item.id}
              name={item.name}
              stroke={COLORS[index % COLORS.length]}
              dot={showDots ? { r: 3 } : false}
              activeDot={{ r: 5 }}
              strokeWidth={2}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function buildChartData(series, metric) {
  if (series.length === 1) {
    return series[0].data
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((point) => ({
        timestamp: point.created_at,
        timeLabel: formatChartAxisTime(point.created_at),
        [series[0].id]: getMetricValue(point, metric),
      }))
  }

  const timestamps = new Set()
  series.forEach(({ data }) => {
    data.forEach((point) => timestamps.add(point.created_at))
  })

  return [...timestamps]
    .sort((a, b) => a.localeCompare(b))
    .map((timestamp) => {
      const row = {
        timestamp,
        timeLabel: formatChartAxisTime(timestamp),
      }
      series.forEach(({ id, data }) => {
        const point = data.find((p) => p.created_at === timestamp)
        if (point) {
          row[id] = getMetricValue(point, metric)
        }
      })
      return row
    })
}
