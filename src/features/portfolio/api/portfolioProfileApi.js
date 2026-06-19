import httpClient from '@/shared/api/httpClient.js'
import {
  mapPortfolioProfileFormToRequest,
  mapPortfolioProfileFromApi,
} from './portfolioProfileMapper.js'

function unwrapResponse(response) {
  return response.data?.data ?? response.data
}

export async function getPortfolioProfile() {
  const response = await httpClient.get('/api/portfolios/profile')
  return mapPortfolioProfileFromApi(unwrapResponse(response))
}

export async function updatePortfolioProfile(form) {
  const response = await httpClient.put(
    '/api/portfolios/profile',
    mapPortfolioProfileFormToRequest(form),
  )
  return mapPortfolioProfileFromApi(unwrapResponse(response))
}
