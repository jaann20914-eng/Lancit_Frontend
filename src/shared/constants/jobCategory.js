// ============================================================
// JobCategory 공통 상수
// 백엔드 com.ssafy.lancit.global.enums.JobCategory 와 동일하게 유지
// ============================================================

// 라벨 매핑 (코드 → 한글)
export const JOB_CATEGORY_LABELS = {
  IT: 'IT',
  DESIGN: '디자인',
  MUSIC: '음악',
  EDUCATION: '교육',
  VIDEO: '영상',
  MARKETING: '마케팅',
  WRITING: '작문',
  ETC: '기타',
}

// 코드 → 라벨 변환 함수
export function jobCategoryLabel(code) {
  return JOB_CATEGORY_LABELS[code] || code || ''
}

// select 옵션용 배열 [{ value, label }]
export const JOB_CATEGORY_OPTIONS = Object.entries(JOB_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
)

// 인재 찾기 탭 전용 (전체 + 직군별 + 찜)
export const TALENT_TAB_OPTIONS = [
  { value: 'ALL', label: '전체' },
  ...JOB_CATEGORY_OPTIONS,
  { value: 'BOOKMARK', label: '찜' },
]