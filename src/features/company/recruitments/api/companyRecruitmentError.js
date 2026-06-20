export function getCompanyApiError(error, fallback) {
  const status = error?.response?.status
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  if (status === 403) return '회사 계정만 공고를 관리할 수 있습니다.'
  if (status === 404) return '요청한 공고 또는 지원 정보를 찾을 수 없습니다.'

  const message = error?.response?.data?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}
