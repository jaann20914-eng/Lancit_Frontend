import { describe, expect, it } from 'vitest'
import { mapApplicationRequest } from './applicationMapper.js'

describe('applicationMapper', () => {
  it('sends only intro and selected portfolioIds', () => {
    const result = mapApplicationRequest({
      intro: ' 지원 소개 ',
      portfolioIds: [1, 3, 3],
      portfolioProfile: { displayName: '조작된 이름' },
    })

    expect(result).toEqual({ intro: '지원 소개', portfolioIds: [1, 3] })
    expect(result).not.toHaveProperty('portfolioProfile')
  })
})
