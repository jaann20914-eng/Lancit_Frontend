export function toDateInput(value) {
  return value ? String(value).slice(0, 10) : ''
}

export function toLocalDateTime(value) {
  if (!value) return null
  return `${String(value).slice(0, 10)}T00:00:00`
}

export function mapPortfolioFromApi(dto) {
  if (!dto || typeof dto !== 'object') return null

  return {
    portfolioId: dto.portfolioId ?? null,
    email: dto.email ?? '',
    category: dto.category ?? '',
    title: dto.title ?? '',
    summary: dto.summary ?? '',
    content: dto.content ?? '',
    workStartAt: dto.workStartAt ?? null,
    workEndAt: dto.workEndAt ?? null,
    isPublic: Boolean(dto.isPublic),
    bannerFileId: dto.bannerFileId ?? null,
    createdAt: dto.createdAt ?? null,
    updatedAt: dto.updatedAt ?? null,
    isDeleted: Boolean(dto.isDeleted),
    deletedAt: dto.deletedAt ?? null
  }
}

export function mapPortfolioPageResponse(data) {
  const content = Array.isArray(data?.content)
    ? data.content.map(mapPortfolioFromApi).filter(Boolean)
    : []

  return {
    content,
    page: data?.page ?? 1,
    size: data?.size ?? content.length,
    totalElements: data?.totalElements ?? content.length,
    totalPages: data?.totalPages ?? (content.length ? 1 : 0),
    hasNext: Boolean(data?.hasNext),
    hasPrev: Boolean(data?.hasPrev)
  }
}

export function mapPortfolioDetailResponse(data) {
  return {
    portfolio: mapPortfolioFromApi(data?.portfolio),
    files: Array.isArray(data?.files) ? data.files : []
  }
}

export function mapPortfolioFormToRequest(form) {
  return {
    category: form.category,
    title: form.title.trim(),
    summary: form.summary.trim(),
    content: form.content,
    workStartAt: toLocalDateTime(form.workStartAt),
    workEndAt: toLocalDateTime(form.workEndAt),
    isPublic: Boolean(form.isPublic),
    bannerFileId: form.bannerFileId ?? null
  }
}
