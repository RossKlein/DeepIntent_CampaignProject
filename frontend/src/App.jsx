import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CampaignDetailPage } from './pages/CampaignDetailPage'
import { CampaignListPage } from './pages/CampaignListPage'
import { ComparePage } from './pages/ComparePage'
import { AlertsPage } from './pages/AlertsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<CampaignListPage />} />
            <Route path="campaigns/:campaignId" element={<CampaignDetailPage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
