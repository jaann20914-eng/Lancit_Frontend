import httpClient from '@/shared/api/httpClient.js'
import {
  mapPortfolioDetailResponse,
  mapPortfolioFormToRequest,
  mapPortfolioPageResponse
} from './portfolioMapper.js'

function unwrapResponse(response) {
  return response.data?.data ?? response.data
}

export async function getMyPortfolios(params = {}) {
  const response = await httpClient.get('/api/portfolios', { params })
  return mapPortfolioPageResponse(unwrapResponse(response))
}

export async function getPublicPortfolios(params = {}) {
  const response = await httpClient.get('/api/portfolios/public', { params })
  return mapPortfolioPageResponse(unwrapResponse(response))
}

export async function getPortfolioDetail(id) {
  const response = await httpClient.get(`/api/portfolios/${id}`)
  return mapPortfolioDetailResponse(unwrapResponse(response))
}

export async function getPortfolioFileUrl(fileId) {
  if (fileId === null || fileId === undefined) return ''
  const response = await httpClient.get(`/api/files/${fileId}/url`)
  return unwrapResponse(response) ?? ''
}

export async function createPortfolio(form) {
  const response = await httpClient.post('/api/portfolios', mapPortfolioFormToRequest(form))
  return unwrapResponse(response)
}

export async function updatePortfolio(id, form) {
  const response = await httpClient.put(`/api/portfolios/${id}`, mapPortfolioFormToRequest(form))
  return unwrapResponse(response)
}

export async function deletePortfolio(id) {
  const response = await httpClient.delete(`/api/portfolios/${id}`)
  return unwrapResponse(response)
}
