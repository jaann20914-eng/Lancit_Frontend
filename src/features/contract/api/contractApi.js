// contractApi.js에 추가할 함수

//이후 아래 주석 해제
// 계약 제안 생성 (회사 -> 프리랜서)
// export function createContract({ recruitmentId, freelancerEmail }) {
//   return httpClient.post('/api/contracts', { recruitmentId, freelancerEmail })
// }

// ============================================================
// contractApi.js - 더미 데이터 버전 (createContract만)
// 기존 contractApi.js에 있는 다른 함수는 그대로 두고
// 이 함수만 더미로 교체하거나 추가하세요
// ============================================================

function delay(ms = 400) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 계약 제안 생성 (회사 -> 프리랜서)
export async function createContract({ recruitmentId, freelancerEmail }) {
  await delay()
  console.log('[MOCK] 제안 생성:', { recruitmentId, freelancerEmail })
  return { data: { data: { contractId: 999 } } }
}