import httpClient from '@/shared/api/httpClient.js'
import {
  mapRecruitmentFormToRequest,
  mapRecruitmentFromApi,
  mapRecruitmentPageResponse,
} from './companyRecruitmentMapper.js'

function unwrapResponse(response) {
  return response.data?.data ?? response.data
}

export async function getMyRecruitments(params = {}) {
  const response = await httpClient.get('/recruitments/my', { params })
  return mapRecruitmentPageResponse(unwrapResponse(response))
}

export async function getAllRecruitments(params = {}) {
  const response = await httpClient.get('/recruitments', { params })
  return mapRecruitmentPageResponse(unwrapResponse(response))
}

export async function getCompanyRecruitment(recruitmentId) {
  const response = await httpClient.get(`/recruitments/${recruitmentId}`)
  return mapRecruitmentFromApi(unwrapResponse(response))
}

export async function createCompanyRecruitment(form) {
  const response = await httpClient.post('/recruitments', mapRecruitmentFormToRequest(form))
  return mapRecruitmentFromApi(unwrapResponse(response))
}

export async function updateCompanyRecruitment(recruitmentId, form) {
  const response = await httpClient.put(
    `/recruitments/${recruitmentId}`,
    mapRecruitmentFormToRequest(form),
  )
  return mapRecruitmentFromApi(unwrapResponse(response))
}

export async function deleteCompanyRecruitment(recruitmentId) {
  const response = await httpClient.delete(`/recruitments/${recruitmentId}`)
  return unwrapResponse(response)
}

export async function updateCompanyRecruitmentStatus(recruitmentId, status) {
  const response = await httpClient.patch(`/recruitments/${recruitmentId}/status`, { status })
  return mapRecruitmentFromApi(unwrapResponse(response))
}

export async function uploadRecruitmentImage(file) {
  const formData = new FormData()
  formData.append('files', file)
  const response = await httpClient.post('/files/upload', formData, {
    params: { parentType: 'TEMP' },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const files = unwrapResponse(response)
  return Array.isArray(files) ? files[0] ?? null : null
}

export async function getFileUrl(fileId) {
  if (fileId === null || fileId === undefined) return null
  const response = await httpClient.get(`/files/${fileId}/url`)
  return unwrapResponse(response)
}
