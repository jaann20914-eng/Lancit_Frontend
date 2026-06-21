import httpClient from '@/shared/api/httpClient.js'
import {
  mapRecruitmentFromApi,
  mapRecruitmentPageResponse,
} from '@/features/company/recruitments/api/companyRecruitmentMapper.js'

function unwrapResponse(response) {
  return response.data?.data ?? response.data
}

export async function getRecruitments({
  tab = 'ALL',
  keyword,
  jobCategory,
  recruitmentCategory,
  sort = 'LATEST',
  page = 1,
  size = 10,
} = {}) {
  const response = await httpClient.get('/api/recruitments', {
    params: {
      tab,
      keyword: keyword || undefined,
      jobCategory: jobCategory || undefined,
      recruitmentCategory: recruitmentCategory || undefined,
      sort,
      page,
      size,
    },
  })

  return mapRecruitmentPageResponse(unwrapResponse(response))
}

export async function getRecruitment(recruitmentId) {
  const response = await httpClient.get(`/api/recruitments/${recruitmentId}`)
  return mapRecruitmentFromApi(unwrapResponse(response))
}

export async function getRecruitmentFileUrl(fileId) {
  if (fileId === null || fileId === undefined) return ''
  const response = await httpClient.get(`/api/files/${fileId}/url`)
  return unwrapResponse(response) ?? ''
}

export async function toggleRecruitmentBookmark(recruitmentId) {
  const response = await httpClient.post(`/api/recruitments/${recruitmentId}/bookmark`)
  return unwrapResponse(response)
}
