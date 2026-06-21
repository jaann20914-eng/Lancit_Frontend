import httpClient from '@/shared/api/httpClient.js'
import {
  mapPortfolioDetailResponse,
  mapPortfolioFormToRequest,
  mapPortfolioPageResponse,
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

export async function uploadPortfolioFiles(files, parentType, parentId) {
  const fileList = Array.from(files ?? [])
  if (!fileList.length) return []

  const formData = new FormData()
  fileList.forEach((file) => formData.append('files', file))

  const response = await httpClient.post('/api/files/upload', formData, {
    params: { parentType, parentId },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const uploadedFiles = unwrapResponse(response)
  return Array.isArray(uploadedFiles) ? uploadedFiles : []
}

export async function deletePortfolioFile(fileId) {
  if (fileId === null || fileId === undefined) return
  await httpClient.delete(`/api/files/${fileId}`)
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
