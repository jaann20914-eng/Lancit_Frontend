import { beforeEach, describe, expect, it, vi } from 'vitest'
import httpClient from '@/shared/api/httpClient.js'
import { getRecruitments } from './recruitmentApi.js'

vi.mock('@/shared/api/httpClient.js', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('recruitmentApi', () => {
  it('removes deleted recruitments from the public recruitment search response', async () => {
    httpClient.get.mockResolvedValueOnce({
      data: {
        data: {
          content: [
            { recruitmentId: 1, title: '노출 공고', status: 'OPEN' },
            { recruitmentId: 2, title: '삭제 플래그 공고', status: 'OPEN', isDeleted: true },
            { recruitmentId: 3, title: '삭제 상태 공고', status: 'DELETED' },
            { recruitmentId: 4, title: '삭제 일시 공고', status: 'OPEN', deletedAt: '2026-01-01' },
          ],
          page: 1,
          size: 10,
          totalElements: 4,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
    })

    const result = await getRecruitments()

    expect(result.content.map((item) => item.recruitmentId)).toEqual([1])
    expect(result.totalElements).toBe(1)
    expect(result.totalPages).toBe(1)
  })
})
