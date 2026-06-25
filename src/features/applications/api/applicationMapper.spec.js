import { describe, expect, it } from 'vitest'
import { mapApplicationRequest } from './applicationMapper.js'

describe('applicationMapper', () => {
  it('sends intro, selected portfolioIds, and the submitted profile snapshot', () => {
    const result = mapApplicationRequest({
      intro: ' 지원 소개 ',
      portfolioIds: [1, 3, 3],
      portfolioProfile: {
        displayName: ' 지원 홍길동 ',
        jobCategory: 'IT',
        profileFileId: 11,
        profileImageFile: new File(['image'], 'profile.png', { type: 'image/png' }),
        isPortfolioPublic: false,
        intro: ' 한 줄 ',
        description: ' 상세 소개 ',
        techStacks: ['Vue', ' Vue ', 'JavaScript'],
      },
    })

    expect(result).toEqual({
      intro: '지원 소개',
      portfolioIds: [1, 3],
      portfolioProfile: {
        displayName: '지원 홍길동',
        jobCategory: 'IT',
        profileFileId: 11,
        isPortfolioPublic: false,
        intro: '한 줄',
        description: '상세 소개',
        techStacks: ['Vue', 'JavaScript'],
      },
    })
    expect(result.portfolioProfile).not.toHaveProperty('profileImageFile')
  })
})
