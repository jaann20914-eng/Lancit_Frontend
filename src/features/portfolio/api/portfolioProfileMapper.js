export const PORTFOLIO_PROFILE_INTRO_MAX_LENGTH = 30
export const PORTFOLIO_PROFILE_DESCRIPTION_MAX_LENGTH = 200
export const PORTFOLIO_PROFILE_DISPLAY_NAME_MAX_LENGTH = 100
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
    displayName: dto.displayName ?? dto.name ?? '',
    jobCategory: dto.jobCategory ?? null,
    profileFileId: dto.profileFileId ?? null,
    isPortfolioPublic: Boolean(dto.isPortfolioPublic),
    intro: dto.intro ?? '',
    description: dto.description ?? '',
    techStacks: normalizeTechStacks(dto.techStacks),
    createdAt: dto.createdAt ?? null,
    updatedAt: dto.updatedAt ?? null,
  }
}

export function mapPortfolioProfileFormToRequest(form = {}) {
  return {
    displayName: typeof form.displayName === 'string' ? form.displayName.trim() : '',
    jobCategory: form.jobCategory ?? null,
    profileFileId: form.profileFileId ?? null,
    isPortfolioPublic: Boolean(form.isPortfolioPublic),
    intro: typeof form.intro === 'string' ? form.intro.trim() : '',
    description: typeof form.description === 'string' ? form.description.trim() : '',
    techStacks: normalizeTechStacks(form.techStacks),
  }
}
