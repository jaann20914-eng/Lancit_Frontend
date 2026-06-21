import httpClient from '@/shared/api/httpClient.js'


// 이후 아래 주석 풀기
// // 인재 목록 조회 (tab: all | public | bookmark, sort: VIEW | NAME)
// export function getTalentList({ tab, sort, keyword, page, size }) {
//   return httpClient.get('/talents', {
//     params: { tab, sort, keyword, page, size }
//   })
// }

// // 인재 찜 토글
// export function toggleTalentBookmark(freelancerEmail) {
//   return httpClient.post(`/talents/${freelancerEmail}/bookmark`)
// }

// // 인재 프로필 카드 조회 (포트폴리오 프로필)
// export function getTalentProfile(freelancerEmail) {
//   return httpClient.get(`/talents/${freelancerEmail}/profile`)
// }

// // 인재의 공개 포트폴리오 목록 조회
// export function getTalentPublicPortfolios(freelancerEmail, { keyword, category, sort, page, size }) {
//   return httpClient.get(`/portfolio/public/${freelancerEmail}`, {
//     params: { keyword, category, sort, page, size }
//   })
// }


// ============================================================
// talentApi.js - 더미 데이터 버전 (백엔드 연동 전 화면 확인용)
// 실제 연동 시 이 파일 내용을 원래 talentApi.js로 교체하세요
// ============================================================

const MOCK_TALENTS = [
  { email: 'jiwon1@example.com', name: '박지원', jobCategory: 'DESIGN', createdAt: '2026-05-12', viewCount: 11, likeCount: 4, isBookmarked: false, profileImageUrl: null },
  { email: 'jiwon2@example.com', name: '박지원', jobCategory: 'DESIGN', createdAt: '2026-05-12', viewCount: 11, likeCount: 4, isBookmarked: true, profileImageUrl: null },
  { email: 'jiwon3@example.com', name: '박지원', jobCategory: 'DESIGN', createdAt: '2026-05-12', viewCount: 11, likeCount: 4, isBookmarked: false, profileImageUrl: null },
  { email: 'minjun@example.com', name: '이민준', jobCategory: 'IT', createdAt: '2026-05-10', viewCount: 23, likeCount: 8, isBookmarked: false, profileImageUrl: null },
  { email: 'seoyeon@example.com', name: '정서연', jobCategory: 'VIDEO', createdAt: '2026-05-09', viewCount: 7, likeCount: 2, isBookmarked: false, profileImageUrl: null },
]

const MOCK_PORTFOLIOS = [
  { portfolioId: 1, title: '강적성', summary: '강의제', category: '청년성', bannerUrl: null },
  { portfolioId: 2, title: '강적성', summary: '강의제', category: '청년성', bannerUrl: null },
  { portfolioId: 3, title: '웹사이트 리디자인 프로젝트', summary: '클라이언트 웹사이트 리디자인', category: '디자인', bannerUrl: null },
]

function delay(ms = 400) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 인재 목록 조회
export async function getTalentList({ tab, sort, keyword, page = 1, size = 5 }) {
  await delay()

  let list = [...MOCK_TALENTS]

  if (tab === 'public') {
    // 공개 설정한 사람만 (목업에서는 전체와 동일 처리)
    list = list.filter(t => true)
  }
  if (tab === 'bookmark') {
    list = list.filter(t => t.isBookmarked)
  }
  if (keyword) {
    list = list.filter(t => t.name.includes(keyword))
  }
  if (sort === 'NAME') {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name))
  } else {
    list = [...list].sort((a, b) => b.viewCount - a.viewCount)
  }

  const start = (page - 1) * size
  const pageContent = list.slice(start, start + size)

  return {
    data: {
      data: {
        content: pageContent,
        totalPages: Math.max(1, Math.ceil(list.length / size))
      }
    }
  }
}

// 인재 찜 토글
export async function toggleTalentBookmark(freelancerEmail) {
  await delay(200)
  return { data: { data: true } }
}

// 인재 프로필 카드 조회
export async function getTalentProfile(freelancerEmail) {
  await delay()
  const talent = MOCK_TALENTS.find(t => t.email === freelancerEmail) || MOCK_TALENTS[0]

  return {
    data: {
      data: {
        ...talent,
        intro: '프로필 한 줄 소개 작성 예예요 여기서 여기서나 머라먼니 ~~~~~~~~~~~~~'
      }
    }
  }
}

// 인재의 공개 포트폴리오 목록 조회
export async function getTalentPublicPortfolios(freelancerEmail, { keyword, category, sort, page = 1, size = 4 }) {
  await delay()

  let list = [...MOCK_PORTFOLIOS]
  if (keyword) {
    list = list.filter(p => p.title.includes(keyword))
  }

  const start = (page - 1) * size
  const pageContent = list.slice(start, start + size)

  return {
    data: {
      data: {
        content: pageContent,
        totalPages: Math.max(1, Math.ceil(list.length / size))
      }
    }
  }
}