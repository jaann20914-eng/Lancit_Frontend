import httpClient from '@/shared/api/httpClient.js'
import { mapApplicationDetailFromApi, mapApplicationRequest } from './applicationMapper.js'

function unwrapResponse(response) {
  return response.data?.data ?? response.data
}

export async function applyToRecruitment(recruitmentId, form) {
  const response = await httpClient.post(
    `/recruitments/${recruitmentId}/applications`,
    mapApplicationRequest(form),
  )
  return mapApplicationDetailFromApi(unwrapResponse(response))
}

export async function getMyApplication(recruitmentId) {
  const response = await httpClient.get(`/recruitments/${recruitmentId}/applications/me`)
  return mapApplicationDetailFromApi(unwrapResponse(response))
}

export async function updateMyApplication(recruitmentId, form) {
  const response = await httpClient.put(
    `/recruitments/${recruitmentId}/applications/me`,
    mapApplicationRequest(form),
  )
  return mapApplicationDetailFromApi(unwrapResponse(response))
}

export async function cancelMyApplication(recruitmentId) {
  const response = await httpClient.delete(`/recruitments/${recruitmentId}/applications/me`)
  return unwrapResponse(response)
}

export async function getCompanyApplication(recruitmentId, applicationId) {
  const response = await httpClient.get(
    `/recruitments/${recruitmentId}/applications/${applicationId}`,
  )
  return mapApplicationDetailFromApi(unwrapResponse(response))
}

export async function getCompanyApplicationPortfolio(recruitmentId, applicationId, portfolioId) {
  const response = await httpClient.get(
    `/recruitments/${recruitmentId}/applications/${applicationId}/portfolios/${portfolioId}`,
  )
  return unwrapResponse(response)
}

export async function getCompanyApplicationPortfolioFileUrl(
  recruitmentId,
  applicationId,
  portfolioId,
  fileId,
) {
  const response = await httpClient.get(
    `/recruitments/${recruitmentId}/applications/${applicationId}/portfolios/${portfolioId}/files/${fileId}/url`,
  )
  return unwrapResponse(response) ?? ''
}

export async function getCompanyApplicationPortfolioFileDownloadUrl(
  recruitmentId,
  applicationId,
  portfolioId,
  fileId,
) {
  const response = await httpClient.get(
    `/recruitments/${recruitmentId}/applications/${applicationId}/portfolios/${portfolioId}/files/${fileId}/download`,
  )
  return unwrapResponse(response) ?? ''
}

export async function getCompanyApplicationProfileImageUrl(recruitmentId, applicationId) {
  const response = await httpClient.get(
    `/recruitments/${recruitmentId}/applications/${applicationId}/profile/image-url`,
  )
  return unwrapResponse(response) ?? ''
}
