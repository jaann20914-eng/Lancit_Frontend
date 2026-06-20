export const PORTFOLIO_PROFILE_INTRO_MAX_LENGTH = 30
export const PORTFOLIO_PROFILE_TECH_STACK_MAX_LENGTH = 100

export function normalizeTechStacks(value) {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,\n]/)
      : []

  const normalized = []
  const seen = new Set()

  source.forEach((item) => {
    if (typeof item !== 'string') return

    item.split(/[,\n]/).forEach((part) => {
      const techStack = part.trim()
      if (!techStack || seen.has(techStack)) return

      seen.add(techStack)
      normalized.push(techStack)
    })
  })

  return normalized
}

export function mapPortfolioProfileFromApi(dto) {
  if (!dto || typeof dto !== 'object') return null

  return {
    freelancerEmail: dto.freelancerEmail ?? '',
    name: dto.name ?? '',
    jobCategory: dto.jobCategory ?? null,
    profileFileId: dto.profileFileId ?? null,
    isPortfolioPublic: Boolean(dto.isPortfolioPublic),
    intro: dto.intro ?? '',
    techStacks: normalizeTechStacks(dto.techStacks),
    createdAt: dto.createdAt ?? null,
    updatedAt: dto.updatedAt ?? null,
  }
}

export function mapPortfolioProfileFormToRequest(form = {}) {
  return {
    isPortfolioPublic: Boolean(form.isPortfolioPublic),
    intro: typeof form.intro === 'string' ? form.intro.trim() : '',
    techStacks: normalizeTechStacks(form.techStacks),
  }
}
