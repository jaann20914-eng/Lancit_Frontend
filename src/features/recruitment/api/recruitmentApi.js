// recruitmentApi.js에 추가할 함수

// 이후 아래 주석 제거
// 제안하기용: 내 활성화(OPEN) 공고만 조회
// export function getMyActiveRecruitments({ page, size }) {
//   return httpClient.get('/api/recruitments/my', {
//     params: { status: 'OPEN', page, size }
//   })
// }


// ============================================================
// recruitmentApi.js - 더미 데이터 버전 (getMyActiveRecruitments만)
// 기존 recruitmentApi.js에 있는 다른 함수는 그대로 두고
// 이 함수만 더미로 교체하거나 추가하세요
// ============================================================

const MOCK_RECRUITMENTS = [
  { recruitmentId: 1, title: '모바일 앱 UI/UX 디자인', jobCategory: 'DESIGN', workType: '자유 시작일', budget: 2000000, createdAt: '2026-05-12' },
  { recruitmentId: 2, title: '웹사이트 개발 프로젝트', jobCategory: 'IT', workType: '자유 시작일', budget: 5000000, createdAt: '2026-05-10' },
  { recruitmentId: 3, title: '브랜드 로고 디자인', jobCategory: 'DESIGN', workType: '단기', budget: 800000, createdAt: '2026-05-08' },
]

function delay(ms = 400) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 제안하기용: 내 활성화(OPEN) 공고만 조회
export async function getMyActiveRecruitments({ page = 1, size = 5 }) {
  await delay()

  const start = (page - 1) * size
  const pageContent = MOCK_RECRUITMENTS.slice(start, start + size)

  return {
    data: {
      data: {
        content: pageContent,
        totalPages: Math.max(1, Math.ceil(MOCK_RECRUITMENTS.length / size))
      }
    }
  }
}