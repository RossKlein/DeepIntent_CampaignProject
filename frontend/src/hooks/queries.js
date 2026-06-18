import { useQuery } from '@tanstack/react-query'
import {
  fetchCampaign,
  fetchCampaignData,
  fetchCampaigns,
  fetchGithubIssues,
} from '../api/client'

/** Frontend poll cadence — checks backend API more often than upstream sync. */
export const REFETCH_INTERVAL_MS = 5_000

/** Shown in UI; matches backend POLL_INTERVAL_SECONDS (actual data sync). */
export const DATA_REFRESH_INTERVAL_SECONDS = 10

const pollOptions = {
  refetchInterval: REFETCH_INTERVAL_MS,
}

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: () => fetchCampaigns({ pageSize: 100 }),
    ...pollOptions,
  })
}

export function useCampaign(campaignId) {
  return useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => fetchCampaign(campaignId),
    enabled: Boolean(campaignId),
    ...pollOptions,
  })
}

export function campaignDataQueryOptions(campaignId) {
  return {
    queryKey: ['campaign-data', campaignId],
    queryFn: () => fetchCampaignData(campaignId, { pageSize: 1000 }),
    enabled: Boolean(campaignId),
    ...pollOptions,
  }
}

export function useCampaignData(campaignId) {
  return useQuery(campaignDataQueryOptions(campaignId))
}

export function useAllAlerts(enabled = true) {
  return useQuery({
    queryKey: ['github-issues', 'all', 'manage'],
    queryFn: () => fetchGithubIssues({ page: 1, pageSize: 100 }),
    enabled,
    ...pollOptions,
  })
}

export function useGithubIssues(campaignId, page = 1, pageSize = 10, enabled = true) {
  return useQuery({
    queryKey: ['github-issues', campaignId ?? 'all', page, pageSize],
    queryFn: () =>
      fetchGithubIssues({
        page,
        pageSize,
        campaignId: campaignId ?? undefined,
      }),
    enabled,
    ...pollOptions,
  })
}
