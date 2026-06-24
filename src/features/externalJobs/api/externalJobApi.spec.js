import { beforeEach, describe, expect, it, vi } from 'vitest'
import httpClient from '@/shared/api/httpClient.js'
import { getExternalJob, getExternalJobs } from './externalJobApi.js'

vi.mock('@/shared/api/httpClient.js', () => ({
  default: { get: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('externalJobApi', () => {
  it('loads external jobs from the /external-jobs endpoint and filters non-freelance rows', async () => {
    httpClient.get.mockResolvedValueOnce({
      data: {
        data: {
          content: [
            {
              id: 1,
              source: 'SEOUL',
              sourceLabel: '서울시 일자리플러스센터',
              title: 'Vue 외주 개발자 모집',
              companyName: '랜싯',
              freelanceType: 'TRUE_FREELANCE',
              recommendationType: 'RECOMMENDED',
              recommendationLabel: '추천',
              sourceUrl: 'https://example.com/job/1',
            },
            {
              id: 2,
              title: '상근 정규직 모집',
              freelanceType: 'NOT_FREELANCE',
            },
          ],
          page: 2,
          size: 5,
          totalElements: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: true,
        },
      },
    })

    const result = await getExternalJobs({
      keyword: 'Vue',
      source: 'SEOUL',
      recommendationType: 'RECOMMENDED',
      sort: 'DEADLINE',
      page: 2,
      size: 5,
    })

    expect(httpClient.get).toHaveBeenCalledWith('/external-jobs', {
      params: {
        keyword: 'Vue',
        source: 'SEOUL',
        recommendationType: 'RECOMMENDED',
        sort: 'DEADLINE',
        includeExpired: undefined,
        page: 2,
        size: 5,
      },
    })
    expect(result.content).toHaveLength(1)
    expect(result.content[0]).toMatchObject({
      externalJobId: 1,
      freelanceTypeLabel: '프리랜서 적합',
      recommendationLabel: '추천',
    })
  })

  it('loads a single external job without prefixing /api', async () => {
    httpClient.get.mockResolvedValueOnce({
      data: {
        data: {
          id: 3,
          title: '디자인 프로젝트',
          freelanceType: 'PROJECT_LIKE',
          recommendationType: 'HIGHLY_RECOMMENDED',
        },
      },
    })

    await expect(getExternalJob(3)).resolves.toMatchObject({
      externalJobId: 3,
      freelanceTypeLabel: '프로젝트형',
      recommendationLabel: '매우 추천',
    })
    expect(httpClient.get).toHaveBeenCalledWith('/external-jobs/3')
  })
})
