const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function request(path, params = {}, options = {}) {
  const url = new URL(`${API_URL}${path}`)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  })

  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

export function fetchCampaigns({ page = 1, pageSize = 50, status } = {}) {
  return request('/campaigns', { page, page_size: pageSize, status })
}

export function fetchCampaign(campaignId) {
  return request(`/campaigns/${campaignId}`)
}

export function fetchCampaignData(campaignId, { page = 1, pageSize = 1000 } = {}) {
  return request(`/campaigns/${campaignId}/data`, {
    page,
    page_size: pageSize,
  })
}

export function fetchGithubIssues({ page = 1, pageSize = 50, campaignId } = {}) {
  return request('/github-issues', {
    page,
    page_size: pageSize,
    campaign_id: campaignId,
  })
}

export function postNextDay() {
  return request('/next-day', {}, { method: 'POST' })
}
