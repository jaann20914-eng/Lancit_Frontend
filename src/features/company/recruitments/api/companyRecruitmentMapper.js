export const JOB_CATEGORY_OPTIONS = [
  { value: 'DESIGN', label: '디자인' },
  { value: 'IT', label: 'IT/개발' },
  { value: 'MUSIC', label: '음악' },
  { value: 'EDUCATION', label: '교육' },
  { value: 'VIDEO', label: '영상' },
  { value: 'MARKETING', label: '마케팅' },
  { value: 'WRITING', label: '글쓰기' },
  { value: 'ETC', label: '기타' },
]

export const RECRUITMENT_CATEGORY_OPTIONS = [
  { value: 'WEB_APP', label: '웹/앱' },
  { value: 'DESIGN', label: '디자인' },
  { value: 'BRANDING', label: '브랜딩' },
  { value: 'MARKETING', label: '마케팅' },
  { value: 'PLANNING', label: '기획' },
]

export const RECRUITMENT_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'OPEN', label: '모집중' },
  { value: 'CLOSED', label: '마감' },
  { value: 'EXPIRED', label: '기간 만료' },
  { value: 'CANCELLED', label: '취소' },
]

const JOB_CATEGORY_LABELS = Object.fromEntries(
  JOB_CATEGORY_OPTIONS.map((item) => [item.value, item.label]),
)
const RECRUITMENT_CATEGORY_LABELS = Object.fromEntries(
  RECRUITMENT_CATEGORY_OPTIONS.map((item) => [item.value, item.label]),
)

export const RECRUITMENT_STATUS_META = {
  OPEN: { label: '모집중', className: 'status-open' },
  CLOSED: { label: '마감', className: 'status-closed' },
  EXPIRED: { label: '기간 만료', className: 'status-expired' },
  CANCELLED: { label: '취소', className: 'status-cancelled' },
}

export function getJobCategoryLabel(value) {
  return JOB_CATEGORY_LABELS[value] || value || '미분류'
}

export function getRecruitmentCategoryLabel(value) {
  return RECRUITMENT_CATEGORY_LABELS[value] || value || '미분류'
}

export function getRecruitmentStatusMeta(value) {
  return (
    RECRUITMENT_STATUS_META[value] || { label: value || '상태 미정', className: 'status-unknown' }
  )
}

export function normalizeTechStacks(value) {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,\n]/)
      : []
  return [...new Set(source.map((item) => String(item).trim()).filter(Boolean))]
}

export function toDateInput(value) {
  return value ? String(value).slice(0, 10) : ''
}

function toLocalDateTime(value) {
  return value ? `${String(value).slice(0, 10)}T00:00:00` : null
}

export function formatDate(value) {
  if (!value) return '미정'
  return String(value).slice(0, 10).replaceAll('-', '.')
}

export function formatDateTime(value) {
  if (!value) return '미정'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatBudget(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? `${amount.toLocaleString('ko-KR')}원` : '협의'
}

export function mapRecruitmentFromApi(dto) {
  if (!dto || typeof dto !== 'object') return null

  const viewStatus = dto.viewStatus ?? dto.status ?? null
  return {
    recruitmentId: dto.recruitmentId ?? dto.id ?? null,
    title: dto.title ?? '',
    summary: dto.summary ?? '',
    content: dto.content ?? '',
    requirements: dto.requirements ?? '',
    companyEmail: dto.companyEmail ?? dto.company?.email ?? dto.ownerEmail ?? dto.writerEmail ?? '',
    companyName: dto.companyName ?? '',
    imageFileId: dto.imageFileId ?? null,
    jobCategory: dto.jobCategory ?? null,
    jobCategoryLabel: getJobCategoryLabel(dto.jobCategory),
    recruitmentCategory: dto.recruitmentCategory ?? null,
    recruitmentCategoryLabel: getRecruitmentCategoryLabel(dto.recruitmentCategory),
    techStacks: normalizeTechStacks(dto.techStacks),
    workLocation: dto.workLocation ?? '',
    budget: Number(dto.budget ?? 0),
    status: dto.status ?? null,
    viewStatus,
    statusMeta: getRecruitmentStatusMeta(viewStatus),
    recruitmentStartAt: dto.recruitmentStartAt ?? null,
    recruitmentEndAt: dto.recruitmentEndAt ?? null,
    contractStartAt: dto.contractStartAt ?? null,
    contractEndAt: dto.contractEndAt ?? null,
    createdAt: dto.createdAt ?? null,
    updatedAt: dto.updatedAt ?? null,
    applicantCount: Number(dto.applicantCount ?? 0),
    canApply: Boolean(dto.canApply),
    isApplied: Boolean(dto.isApplied),
    isBookmarked: Boolean(dto.isBookmarked),
    isMine: Boolean(dto.isMine ?? dto.permission?.isMine),
    canEdit: Boolean(dto.canEdit ?? dto.permission?.canEdit),
    canDelete: Boolean(dto.canDelete ?? dto.permission?.canDelete),
    canChangeStatus: Boolean(dto.canChangeStatus ?? dto.permission?.canChangeStatus),
    businessNumberVerified: dto.businessNumberVerified ?? null,
  }
}

export function mapRecruitmentPageResponse(data) {
  const content = Array.isArray(data?.content)
    ? data.content.map(mapRecruitmentFromApi).filter(Boolean)
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

export function mapRecruitmentFormToRequest(form) {
  return {
    title: form.title.trim(),
    summary: form.summary.trim(),
    content: form.content.trim(),
    requirements: form.requirements?.trim() || null,
    jobCategory: form.jobCategory,
    recruitmentCategory: form.recruitmentCategory,
    workLocation: form.workLocation?.trim() || null,
    budget: Number(form.budget || 0),
    imageFileId: form.imageFileId ?? null,
    contractStartAt: toLocalDateTime(form.contractStartAt),
    contractEndAt: toLocalDateTime(form.contractEndAt),
    recruitmentStartAt: toLocalDateTime(form.recruitmentStartAt),
    recruitmentEndAt: toLocalDateTime(form.recruitmentEndAt),
    techStacks: normalizeTechStacks(form.techStacks),
  }
}
