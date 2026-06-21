import httpClient from '@/shared/api/httpClient.js'
import {
  mapPortfolioProfileFormToRequest,
  mapPortfolioProfileFromApi,
} from './portfolioProfileMapper.js'

function unwrapResponse(response) {
  return response.data?.data ?? response.data
}

export async function getPortfolioProfile() {
  const response = await httpClient.get('/portfolios/profile')
  return mapPortfolioProfileFromApi(unwrapResponse(response))
}

export async function updatePortfolioProfile(form) {
  const response = await httpClient.put(
    '/portfolios/profile',
    mapPortfolioProfileFormToRequest(form),
  )
  return mapPortfolioProfileFromApi(unwrapResponse(response))
}

export async function uploadPortfolioProfileImage(file) {
  const formData = new FormData()
  formData.append('files', file)

  const response = await httpClient.post('/files/upload', formData, {
    params: { parentType: 'TEMP' },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const files = unwrapResponse(response)
  return Array.isArray(files) ? files[0] ?? null : null
}

export async function deletePortfolioProfileImage(fileId) {
  if (fileId === null || fileId === undefined) return
  await httpClient.delete(`/files/${fileId}`)
}

export async function getPortfolioProfileImageUrl(fileId) {
  if (fileId === null || fileId === undefined) return ''
  const response = await httpClient.get(`/files/${fileId}/url`)
  return unwrapResponse(response) ?? ''
}
