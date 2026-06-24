import httpClient from '@/shared/api/httpClient.js'

// 인재 목록 조회
// talentApi.js
export function getTalentList({ keyword, jobCategory, bookmarked, sort, page, size }) {
  let sortColumn = 'created_at'
  let direction = 'DESC'

  if (sort === 'oldest') {
    sortColumn = 'created_at'
    direction = 'ASC'
  } else if (sort === 'name') {
    sortColumn = 'name'
    direction = 'ASC'
  }

  return httpClient.get('/bookmarks/search', {
    params: {
      keyword: keyword || undefined,
      jobCategory: jobCategory || undefined,
      bookmarked: bookmarked || undefined,
      sort: sortColumn,
      direction,
      page,
      size,
    },
  })
}
// 인재 찜하기
export function addTalentBookmark(freelancerEmail) {
  return httpClient.post('/bookmarks', { freelancerEmail })
}

// 인재 찜 취소
export function removeTalentBookmark(freelancerEmail) {
  return httpClient.delete('/bookmarks', { params: { freelancerEmail } })
}

// 인재 프로필 카드 조회
export function getTalentProfile(freelancerEmail) {
  return httpClient.get('/portfolios/profile/public', {
    params: { email: freelancerEmail },
  })
}

export function getPortfolioFileUrl(fileId) {
  if (!fileId) return Promise.resolve('')
  return httpClient.get(`/files/${fileId}/public-url`).then((res) => res.data.data)
}

// 인재의 공개 포트폴리오 목록 조회
export function getTalentPublicPortfolios(
  freelancerEmail,
  { keyword, category, sort, page, size },
) {
  return httpClient.get('/portfolios/public', {
    params: { email: freelancerEmail, keyword, category, sort, page, size },
  })
}
