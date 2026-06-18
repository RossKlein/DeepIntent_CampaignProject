const NUMERIC_FIELDS = [
  { key: 'budget', label: 'Budget' },
  { key: 'spend', label: 'Spend' },
  { key: 'spend_pct', label: 'Spend %' },
  { key: 'cpm', label: 'CPM' },
  { key: 'ctr', label: 'CTR' },
  { key: 'impressions', label: 'Impressions' },
  { key: 'clicks', label: 'Clicks' },
]

export function createEmptyNumericFilters() {
  return Object.fromEntries(
    NUMERIC_FIELDS.map(({ key }) => [
      key,
      { mode: 'between', value: '', valueMax: '' },
    ]),
  )
}

export function countActiveNumericFilters(numericFilters) {
  return NUMERIC_FIELDS.filter(({ key }) => isNumericFilterActive(numericFilters[key]))
    .length
}

export function isNumericFilterActive(filter) {
  if (!filter) {
    return false
  }
  if (filter.mode === 'equals') {
    return filter.value.trim() !== ''
  }
  return filter.value.trim() !== '' && filter.valueMax.trim() !== ''
}

export function getCampaignMetricValue(campaign, key) {
  const latest = campaign.latest
  if (!latest) {
    return null
  }
  if (key === 'ctr') {
    return latest.ctr * 100
  }
  return latest[key]
}

export function passesNumericFilters(campaign, numericFilters) {
  for (const { key } of NUMERIC_FIELDS) {
    const filter = numericFilters[key]
    if (!isNumericFilterActive(filter)) {
      continue
    }

    const metricValue = getCampaignMetricValue(campaign, key)
    if (metricValue == null) {
      return false
    }

    const min = parseFloat(filter.value)
    if (Number.isNaN(min)) {
      continue
    }

    if (filter.mode === 'equals') {
      if (metricValue !== min) {
        return false
      }
    } else {
      const max = parseFloat(filter.valueMax)
      if (Number.isNaN(max) || metricValue < min || metricValue > max) {
        return false
      }
    }
  }

  return true
}

export { NUMERIC_FIELDS }
