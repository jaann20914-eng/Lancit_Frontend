import httpClient from '@/shared/api/httpClient.js'

function unwrapResponse(response) {
  return response.data?.data ?? response.data
}

export function getMyActiveRecruitments({ page, size, freelancerEmail }) {
  return httpClient.get('/recruitments/my', {
    params: {
      status: 'OPEN',
      page,
      size,
      freelancerEmail,
    },
  })
}

export function getRecruitmentDetail(recruitmentId) {
  return httpClient.get(`/recruitments/${recruitmentId}`)
}

export async function getRecruitmentFileUrl(fileId) {
  if (fileId === null || fileId === undefined) return ''
  const response = await httpClient.get(`/files/${fileId}/url`)
  return unwrapResponse(response) ?? ''
}
