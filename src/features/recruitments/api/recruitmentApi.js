import httpClient from '@/shared/api/httpClient.js'
import {
  isDeletedRecruitment,
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
  const response = await httpClient.get('/recruitments', {
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

  return excludeDeletedRecruitments(mapRecruitmentPageResponse(unwrapResponse(response)))
}

export async function getRecruitment(recruitmentId) {
  const response = await httpClient.get(`/recruitments/${recruitmentId}`)
  return mapRecruitmentFromApi(unwrapResponse(response))
}

export async function getRecruitmentFileUrl(fileId) {
  if (fileId === null || fileId === undefined) return ''
  const response = await httpClient.get(`/files/${fileId}/url`)
  return unwrapResponse(response) ?? ''
}

export async function toggleRecruitmentBookmark(recruitmentId) {
  const response = await httpClient.post(`/recruitments/${recruitmentId}/bookmark`)
  return unwrapResponse(response)
}

function excludeDeletedRecruitments(pageData) {
  const content = pageData.content.filter((item) => !isDeletedRecruitment(item))
  const removedCount = pageData.content.length - content.length
  if (!removedCount) return pageData

  const totalElements = Math.max(0, pageData.totalElements - removedCount)
  const totalPages = totalElements > 0 ? Math.ceil(totalElements / pageData.size) : 0

  return {
    ...pageData,
    content,
    totalElements,
    totalPages,
    hasNext: pageData.page < totalPages,
    hasPrev: pageData.page > 1,
  }
}
