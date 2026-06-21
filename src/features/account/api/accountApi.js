import httpClient from '@/shared/api/httpClient.js'

// ============================================================
// 프리랜서 (User) 마이페이지
// ============================================================

export function getUserMe() {
  return httpClient.get('/user/me')
}

export function updateUserMe(dto) {
  return httpClient.put('/user/me', dto)
}

export function deleteUserMe() {
  return httpClient.delete('/user/me')
}

// ============================================================
// 회사 (Company) 마이페이지
// ============================================================

export function getCompanyMe() {
  return httpClient.get('/company/me')
}

export function updateCompanyMe(dto) {
  return httpClient.put('/company/me', dto)
}

export function deleteCompanyMe() {
  return httpClient.delete('/company/me')
}
