import { mapPortfolioProfileFormToRequest } from '@/features/portfolio/api/portfolioProfileMapper.js'

export function mapApplicationRequest(form = {}) {
  const request = {
    intro: typeof form.intro === 'string' ? form.intro.trim() : '',
    portfolioIds: Array.isArray(form.portfolioIds)
      ? [...new Set(form.portfolioIds.filter((id) => Number.isInteger(id)))]
      : [],
  }

  if (form.portfolioProfile && typeof form.portfolioProfile === 'object') {
    request.portfolioProfile = mapPortfolioProfileFormToRequest(form.portfolioProfile)
  }

  return request
}

export function mapApplicationDetailFromApi(dto) {
  if (!dto || typeof dto !== 'object') return null
  return {
    ...dto,
    portfolioProfile: dto.portfolioProfile ?? null,
    portfolios: Array.isArray(dto.portfolios) ? dto.portfolios : [],
  }
}
