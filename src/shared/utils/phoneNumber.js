// 전화번호 포맷 유틸
// 백엔드/DB에는 숫자만(예: "01012345678") 저장하고,
// 화면 표시에만 "XXX-XXXX-XXXX" 형식을 적용한다.

export function formatPhoneNumber(digitsOnly) {
  if (!digitsOnly) return ''
  const clean = String(digitsOnly).replace(/\D/g, '')
  if (clean.length !== 11) return clean // 형식이 안 맞으면 그대로 반환 (방어)
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`
}
