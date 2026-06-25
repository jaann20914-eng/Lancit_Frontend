import httpClient from '@/shared/api/httpClient.js'

export const EXTERNAL_JOB_RECOMMENDATION_OPTIONS = [
  { value: 'HIGHLY_RECOMMENDED', label: '매우 추천' },
  { value: 'RECOMMENDED', label: '추천' },
  { value: 'POSSIBLE', label: '검토 가능' },
]

const SOURCE_LABELS = {
  SEOUL: '서울시 일자리플러스센터',
}

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
  recommendationType,
  sort = 'RECOMMENDED',
  page = 1,
  size = 10,
} = {}) {
  const response = await httpClient.get('/external-jobs', {
    params: {
      keyword: keyword || undefined,
      recommendationType: recommendationType || undefined,
      sort: sort || 'RECOMMENDED',
      page,
      size,
    },
  })

  return mapExternalJobPageResponse(unwrapResponse(response))
}

export async function getExternalJob(externalJobId) {
  const response = await httpClient.get(`/external-jobs/${externalJobId}`)
  return mapExternalJobDetailFromApi(unwrapResponse(response))
}

export function mapExternalJobFromApi(dto) {
  if (!dto || typeof dto !== 'object') return null

  const freelanceType = dto.freelanceType ?? null
  const recommendationType = dto.recommendationType ?? null

  return {
    externalJobId: dto.externalJobId ?? dto.id ?? null,
    source: dto.source ?? null,
    sourceLabel: dto.sourceLabel ?? getExternalJobSourceLabel(dto.source),
    title: dto.title ?? '',
    companyName: dto.companyName ?? '',
    location: dto.location ?? '',
    jobCategoryRaw: dto.jobCategoryRaw ?? '',
    employmentTypeRaw: dto.employmentTypeRaw ?? '',
    salaryText: dto.salaryText ?? '',
    deadlineAt: dto.deadlineAt ?? null,
    detailButtonLabel: dto.detailButtonLabel ?? '상세 보기',
    sourceUrl: dto.sourceUrl ?? '',
    sourceButtonLabel: dto.sourceButtonLabel ?? '사이트에서 확인',
    freelanceType,
    freelanceTypeLabel: getExternalFreelanceTypeLabel(freelanceType),
    recommendationType,
    recommendationLabel:
      dto.recommendationLabel ?? getExternalRecommendationLabel(recommendationType),
    recommendationClassName: getExternalRecommendationClassName(recommendationType),
    collectedAt: dto.collectedAt ?? null,
  }
}

export function mapExternalJobDetailFromApi(dto) {
  const base = mapExternalJobFromApi(dto)
  if (!base) return null

  const content = dto.content ?? dto.description ?? ''
  const workLocation = dto.workLocation ?? dto.location ?? ''

  return {
    ...base,
    sourceJobId: dto.sourceJobId ?? '',
    summary: dto.summary ?? summarize(content),
    content,
    description: dto.description ?? content,
    requirements: dto.requirements ?? '',
    workLocation,
    salaryText: dto.salaryText ?? base.salaryText,
    postedAt: dto.postedAt ?? null,
    deadlineAt: dto.deadlineAt ?? base.deadlineAt,
    recruitmentStartAt: dto.recruitmentStartAt ?? dto.postedAt ?? null,
    recruitmentEndAt: dto.recruitmentEndAt ?? dto.deadlineAt ?? null,
    createdAt: dto.createdAt ?? dto.postedAt ?? dto.collectedAt ?? null,
    updatedAt: dto.updatedAt ?? dto.collectedAt ?? null,
    applicantCount: Number(dto.applicantCount ?? 0),
    canApply: Boolean(dto.canApply),
    isApplied: Boolean(dto.isApplied),
    isBookmarked: Boolean(dto.isBookmarked),
    externalNotice:
      dto.externalNotice ?? '외부 공고는 원문 사이트에서 상세 내용을 확인하고 지원을 진행해주세요.',
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

function summarize(value) {
  const normalized = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
  return normalized.length > 120 ? `${normalized.slice(0, 117).trim()}...` : normalized
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
