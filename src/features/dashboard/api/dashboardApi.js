import httpClient from '@/shared/api/httpClient.js'

function unwrapResponse(response) {
  return response.data?.data ?? response.data
}

export async function getFreelancerDashboard() {
  const response = await httpClient.get('/dashboard/freelancer')
  return unwrapResponse(response)
}

export async function getCompanyDashboard() {
  const response = await httpClient.get('/dashboard/company')
  return unwrapResponse(response)
}

export function getDashboardErrorMessage(error) {
  const status = error?.response?.status
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  if (status === 403) return '대시보드를 조회할 권한이 없습니다.'
  if (status === 404) return '대시보드 API를 찾을 수 없습니다.'

  const message = error?.response?.data?.message
  return typeof message === 'string' && message.trim()
    ? message
    : '대시보드를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
}
