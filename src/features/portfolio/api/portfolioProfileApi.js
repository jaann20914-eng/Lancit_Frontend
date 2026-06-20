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

export async function uploadPortfolioProfileImage(file) {
  const formData = new FormData()
  formData.append('files', file)

  const response = await httpClient.post('/api/files/upload', formData, {
    params: { parentType: 'TEMP' },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const files = unwrapResponse(response)
  return Array.isArray(files) ? files[0] ?? null : null
}

export async function getPortfolioProfileImageUrl(fileId) {
  if (fileId === null || fileId === undefined) return ''
  const response = await httpClient.get(`/api/files/${fileId}/url`)
  return unwrapResponse(response) ?? ''
}
