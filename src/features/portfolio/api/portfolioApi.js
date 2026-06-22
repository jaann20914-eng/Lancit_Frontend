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
  const response = await httpClient.get('/portfolios', { params })
  return mapPortfolioPageResponse(unwrapResponse(response))
}

export async function getAllMyPortfolios(params = {}) {
  const size = 100
  const content = []
  let page = 1

  while (true) {
    const result = await getMyPortfolios({ ...params, page, size })
    content.push(...result.content)
    if (!result.hasNext && page >= result.totalPages) break
    page += 1
  }

  return [...new Map(content.map((portfolio) => [portfolio.portfolioId, portfolio])).values()]
}

export async function getPublicPortfolios(params = {}) {
  const response = await httpClient.get('/portfolios/public', { params })
  return mapPortfolioPageResponse(unwrapResponse(response))
}

export async function getPortfolioDetail(id) {
  const response = await httpClient.get(`/portfolios/${id}`)
  return mapPortfolioDetailResponse(unwrapResponse(response))
}

export async function getPortfolioFileUrl(fileId) {
  if (fileId === null || fileId === undefined) return ''
  const response = await httpClient.get(`/files/${fileId}/url`)
  return unwrapResponse(response) ?? ''
}

export async function getPortfolioFileDownloadUrl(fileId) {
  if (fileId === null || fileId === undefined) return ''
  const response = await httpClient.get(`/files/${fileId}/download`)
  return unwrapResponse(response) ?? ''
}

export async function uploadPortfolioFiles(files, parentType, parentId) {
  const fileList = Array.from(files ?? [])
  if (!fileList.length) return []

  const formData = new FormData()
  fileList.forEach((file) => formData.append('files', file))

  const response = await httpClient.post('/files/upload', formData, {
    params: { parentType, parentId },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const uploadedFiles = unwrapResponse(response)
  return Array.isArray(uploadedFiles) ? uploadedFiles : []
}

export async function deletePortfolioFile(fileId) {
  if (fileId === null || fileId === undefined) return
  await httpClient.delete(`/files/${fileId}`)
}

export async function createPortfolio(form) {
  const response = await httpClient.post('/portfolios', mapPortfolioFormToRequest(form))
  return unwrapResponse(response)
}

export async function updatePortfolio(id, form) {
  const response = await httpClient.put(`/portfolios/${id}`, mapPortfolioFormToRequest(form))
  return unwrapResponse(response)
}

export async function deletePortfolio(id) {
  const response = await httpClient.delete(`/portfolios/${id}`)
  return unwrapResponse(response)
}
