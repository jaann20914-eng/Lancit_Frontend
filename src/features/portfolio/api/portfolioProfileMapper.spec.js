import { describe, expect, it } from 'vitest'
import {
  mapPortfolioProfileFormToRequest,
  mapPortfolioProfileFromApi,
} from './portfolioProfileMapper.js'

describe('portfolioProfileMapper', () => {
  it('maps every independently stored support profile field', () => {
    const result = mapPortfolioProfileFromApi({
      freelancerEmail: 'user@test.com',
      displayName: '지원 홍길동',
      jobCategory: 'IT',
      profileFileId: 11,
      isPortfolioPublic: true,
      intro: '한 줄 소개',
      description: '상세 소개',
      techStacks: ['Java', ' Java ', 'Spring'],
    })

    expect(result).toMatchObject({
      displayName: '지원 홍길동',
      jobCategory: 'IT',
      profileFileId: 11,
      description: '상세 소개',
      techStacks: ['Java', 'Spring'],
    })
  })

  it('creates a profile update payload without UI-only image data', () => {
    const result = mapPortfolioProfileFormToRequest({
      displayName: ' 지원 홍길동 ',
      jobCategory: 'IT',
      profileFileId: 11,
      profileImageFile: new File(['image'], 'profile.png', { type: 'image/png' }),
      isPortfolioPublic: false,
      intro: ' 소개 ',
      description: ' 상세 ',
      techStacks: ['Vue', 'Vue'],
    })

    expect(result).toEqual({
      displayName: '지원 홍길동',
      jobCategory: 'IT',
      profileFileId: 11,
      isPortfolioPublic: false,
      intro: '소개',
      description: '상세',
      techStacks: ['Vue'],
    })
    expect(result).not.toHaveProperty('profileImageFile')
  })
})
