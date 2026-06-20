import httpClient from '@/shared/api/httpClient.js'
import { mapApplicationFromApi, mapApplicationPageResponse } from './companyApplicationMapper.js'

function unwrapResponse(response) {
  return response.data?.data ?? response.data
}

export async function getCompanyApplications(recruitmentId, params = {}) {
  const response = await httpClient.get(`/api/recruitments/${recruitmentId}/applications`, { params })
  return mapApplicationPageResponse(unwrapResponse(response))
}

export async function getCompanyApplication(recruitmentId, applicationId) {
  const response = await httpClient.get(
    `/api/recruitments/${recruitmentId}/applications/${applicationId}`,
  )
  return mapApplicationFromApi(unwrapResponse(response))
}

export async function updateCompanyApplicationStatus(recruitmentId, applicationId, status) {
  const response = await httpClient.patch(
    `/api/recruitments/${recruitmentId}/applications/${applicationId}/status`,
    { status },
  )
  return mapApplicationFromApi(unwrapResponse(response))
}
