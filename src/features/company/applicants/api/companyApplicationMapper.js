import { getJobCategoryLabel, normalizeTechStacks } from '../../recruitments/api/companyRecruitmentMapper.js'

export const APPLICATION_STATUS_META = {
  PENDING: { label: '검토중', className: 'status-pending' },
  ACCEPTED: { label: '수락', className: 'status-accepted' },
  REJECTED: { label: '거절', className: 'status-rejected' },
  CANCELLED: { label: '취소', className: 'status-cancelled' },
}

export function getApplicationStatusMeta(value) {
  return APPLICATION_STATUS_META[value] || { label: value || '상태 미정', className: 'status-unknown' }
}

export function mapApplicationFromApi(dto) {
  if (!dto || typeof dto !== 'object') return null

  const profile = dto.portfolioProfile
      ? {
        freelancerEmail: dto.portfolioProfile.freelancerEmail ?? '',
        displayName: dto.portfolioProfile.displayName ?? dto.portfolioProfile.name ?? '',
        jobCategory: dto.portfolioProfile.jobCategory ?? null,
        jobCategoryLabel: getJobCategoryLabel(dto.portfolioProfile.jobCategory),
        profileFileId: dto.portfolioProfile.profileFileId ?? null,
        isPortfolioPublic: Boolean(dto.portfolioProfile.isPortfolioPublic),
        intro: dto.portfolioProfile.intro ?? '',
        description: dto.portfolioProfile.description ?? '',
        techStacks: normalizeTechStacks(dto.portfolioProfile.techStacks),
      }
    : null

  return {
    applicationId: dto.applicationId ?? null,
    recruitmentId: dto.recruitmentId ?? null,
    contractId: dto.contractId ?? null,
    recruitmentTitle: dto.recruitmentTitle ?? '',
    applicantEmail: dto.applicantEmail ?? '',
    applicantName: dto.applicantName ?? '',
    intro: dto.intro ?? '',
    status: dto.status ?? null,
    statusMeta: getApplicationStatusMeta(dto.status),
    appliedAt: dto.appliedAt ?? null,
    canceledAt: dto.canceledAt ?? null,
    viewedAt: dto.viewedAt ?? null,
    portfolioProfile: profile,
    portfolios: Array.isArray(dto.portfolios)
      ? dto.portfolios.map((portfolio) => ({
          portfolioId: portfolio.portfolioId ?? null,
          title: portfolio.title ?? '',
          summary: portfolio.summary ?? '',
          content: portfolio.content ?? '',
          category: portfolio.category ?? '',
          bannerFileId: portfolio.bannerFileId ?? null,
          isPublic: Boolean(portfolio.isPublic),
          workStartAt: portfolio.workStartAt ?? null,
          workEndAt: portfolio.workEndAt ?? null,
          createdAt: portfolio.createdAt ?? null,
          updatedAt: portfolio.updatedAt ?? null,
        }))
      : [],
  }
}

export function mapApplicationPageResponse(data) {
  const content = Array.isArray(data?.content)
    ? data.content.map(mapApplicationFromApi).filter(Boolean)
    : []
  return {
    content,
    page: Number(data?.page ?? 1),
    size: Number(data?.size ?? content.length),
    totalElements: Number(data?.totalElements ?? content.length),
    totalPages: Number(data?.totalPages ?? (content.length ? 1 : 0)),
    hasNext: Boolean(data?.hasNext),
    hasPrev: Boolean(data?.hasPrev),
  }
}
