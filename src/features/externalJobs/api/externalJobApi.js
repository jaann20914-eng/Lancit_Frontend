import httpClient from '@/shared/api/httpClient.js'

export const EXTERNAL_JOB_SORT_OPTIONS = [
  { value: 'LATEST', label: '최신순' },
  { value: 'DEADLINE', label: '마감 임박순' },
]

export const EXTERNAL_JOB_SOURCE_OPTIONS = [
  { value: 'SEOUL', label: '서울시 일자리플러스센터' },
  { value: 'GYEONGGI', label: '경기도 잡아바' },
]

export const EXTERNAL_JOB_RECOMMENDATION_OPTIONS = [
  { value: 'HIGHLY_RECOMMENDED', label: '매우 추천' },
  { value: 'RECOMMENDED', label: '추천' },
  { value: 'POSSIBLE', label: '검토 가능' },
]

const SOURCE_LABELS = Object.fromEntries(
  EXTERNAL_JOB_SOURCE_OPTIONS.map((option) => [option.value, option.label]),
)

const RECOMMENDATION_LABELS = Object.fromEntries(
  EXTERNAL_JOB_RECOMMENDATION_OPTIONS.map((option) => [option.value, option.label]),
)

const FREELANCE_TYPE_LABELS = {
  TRUE_FREELANCE: '프리랜서 적합',
  PROJECT_LIKE: '프로젝트형',
  CONTRACT_LIKE: '계약형',
  UNKNOWN: '검토 필요',
}

const RECOMMENDATION_CLASS_NAMES = {
  HIGHLY_RECOMMENDED: 'recommendation-high',
  RECOMMENDED: 'recommendation-recommended',
  POSSIBLE: 'recommendation-possible',
}

function unwrapResponse(response) {
  return response.data?.data ?? response.data
}

export async function getExternalJobs({
  keyword,
  source,
  recommendationType,
  sort = 'LATEST',
  includeExpired,
  page = 1,
  size = 10,
} = {}) {
  const response = await httpClient.get('/external-jobs', {
    params: {
      keyword: keyword || undefined,
      source: source || undefined,
      recommendationType: recommendationType || undefined,
      sort,
      includeExpired: typeof includeExpired === 'boolean' ? includeExpired : undefined,
      page,
      size,
    },
  })

  return mapExternalJobPageResponse(unwrapResponse(response))
}

export async function getExternalJob(externalJobId) {
  const response = await httpClient.get(`/external-jobs/${externalJobId}`)
  return mapExternalJobFromApi(unwrapResponse(response))
}

export function mapExternalJobFromApi(dto) {
  if (!dto || typeof dto !== 'object') return null

  const freelanceType = dto.freelanceType ?? null
  const recommendationType = dto.recommendationType ?? null

  return {
    externalJobId: dto.id ?? null,
    source: dto.source ?? null,
    sourceLabel: dto.sourceLabel ?? getExternalJobSourceLabel(dto.source),
    title: dto.title ?? '',
    companyName: dto.companyName ?? '',
    location: dto.location ?? '',
    jobCategoryRaw: dto.jobCategoryRaw ?? '',
    employmentTypeRaw: dto.employmentTypeRaw ?? '',
    salaryText: dto.salaryText ?? '',
    deadlineAt: dto.deadlineAt ?? null,
    sourceUrl: dto.sourceUrl ?? '',
    freelanceType,
    freelanceTypeLabel: getExternalFreelanceTypeLabel(freelanceType),
    recommendationType,
    recommendationLabel:
      dto.recommendationLabel ?? getExternalRecommendationLabel(recommendationType),
    recommendationClassName: getExternalRecommendationClassName(recommendationType),
    collectedAt: dto.collectedAt ?? null,
  }
}

export function mapExternalJobPageResponse(data) {
  const content = Array.isArray(data?.content)
    ? data.content.map(mapExternalJobFromApi).filter(isDisplayableExternalJob)
    : []
  const page = Number(data?.page ?? (data?.number !== undefined ? Number(data.number) + 1 : 1))
  const totalPages = Number(data?.totalPages ?? (content.length ? 1 : 0))

  return {
    content,
    page,
    size: Number(data?.size ?? content.length),
    totalElements: Number(data?.totalElements ?? content.length),
    totalPages,
    hasNext: data?.hasNext === undefined ? page < totalPages : Boolean(data.hasNext),
    hasPrev: data?.hasPrev === undefined ? page > 1 : Boolean(data.hasPrev),
  }
}

function isDisplayableExternalJob(item) {
  return Boolean(item) && item.freelanceType !== 'NOT_FREELANCE'
}

function getExternalJobSourceLabel(value) {
  return SOURCE_LABELS[value] || value || ''
}

function getExternalRecommendationLabel(value) {
  return RECOMMENDATION_LABELS[value] || value || ''
}

function getExternalFreelanceTypeLabel(value) {
  return FREELANCE_TYPE_LABELS[value] || value || ''
}

function getExternalRecommendationClassName(value) {
  return RECOMMENDATION_CLASS_NAMES[value] || 'recommendation-unknown'
}
