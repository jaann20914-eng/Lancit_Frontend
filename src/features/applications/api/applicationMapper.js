export function mapApplicationRequest(form = {}) {
  return {
    intro: typeof form.intro === 'string' ? form.intro.trim() : '',
    portfolioIds: Array.isArray(form.portfolioIds)
      ? [...new Set(form.portfolioIds.filter((id) => Number.isInteger(id)))]
      : [],
  }
}

export function mapApplicationDetailFromApi(dto) {
  if (!dto || typeof dto !== 'object') return null
  return {
    ...dto,
    portfolioProfile: dto.portfolioProfile ?? null,
    portfolios: Array.isArray(dto.portfolios) ? dto.portfolios : [],
  }
}
