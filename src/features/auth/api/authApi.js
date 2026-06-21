import httpClient from '@/shared/api/httpClient.js'

// 로그인
export function login(email, password, role) {
  return httpClient.post('/auth/login', { email, password, role })
}

// 로그아웃
export function logout() {
  return httpClient.post('/auth/logout')
}

// 프리랜서 회원가입
export function signupUser(data) {
  return httpClient.post('/auth/signup/user', data)
}

// 회사 회원가입
export function signupCompany(data) {
  return httpClient.post('/auth/signup/company', data)
}