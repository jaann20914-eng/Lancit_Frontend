import httpClient from '@/shared/api/httpClient.js'

// ============================================================
// 로그인 / 회원가입
// ============================================================

// 로그인
// body: { email, password, role } role: 'USER' | 'COMPANY' (대문자)
export function login(email, password, role) {
  return httpClient.post('/auth/login', { email, password, role: role.toUpperCase() })
}

// 회원가입 (이메일 인증 완료 후에만 성공)
export function signup(data) {
  return httpClient.post('/auth/signup', {
    ...data,
    role: data.role.toUpperCase(),
  })
}

// ============================================================
// 비밀번호 재설정
// ============================================================

// 비밀번호 재설정 (이메일 인증 완료 후에만 성공)
// body: { email, password, role }
export function resetPassword(email, password, role) {
  return httpClient.post('/auth/password-reset', { email, password, role: role.toUpperCase() })
}

// ============================================================
// 이메일 인증
// ============================================================

// 인증코드 발송
// purpose: 'signup' | 'pwreset'
export function sendVerificationCode(email, purpose) {
  return httpClient.post('/auth/email/send', { email, purpose })
}

// 인증코드 검증 (성공 시 서버에 30분간 "인증완료" 상태 저장됨)
// purpose: 'signup' | 'pwreset'
export function verifyEmailCode(email, code, purpose) {
  return httpClient.post('/auth/email/verify', { email, code, purpose })
}

// ============================================================
// 사업자번호 인증
// ============================================================

export function verifyBusinessNumber(businessNumber) {
  return httpClient.post('/auth/business/verify', { businessNumber })
}
