// 사업자등록번호 포맷 유틸
// 백엔드/DB에는 숫자만(예: "1234567890") 저장하고,
// 화면 표시에만 "XXX-XX-XXXXX" 형식을 적용한다.

export function formatBusinessNumber(digitsOnly) {
  if (!digitsOnly) return ''
  const clean = String(digitsOnly).replace(/\D/g, '')
  if (clean.length !== 10) return clean // 형식이 안 맞으면 그대로 반환 (방어)
  return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5, 10)}`
}
