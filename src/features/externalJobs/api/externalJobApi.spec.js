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
              sourceButtonLabel: '사이트에서 확인',
              detailButtonLabel: '상세 보기',
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
      sort: 'LATEST',
      page: 2,
      size: 5,
    })

    expect(httpClient.get).toHaveBeenCalledWith('/external-jobs', {
      params: {
        keyword: 'Vue',
        recommendationType: 'RECOMMENDED',
        sort: 'LATEST',
        page: 2,
        size: 5,
      },
    })
    expect(result.content).toHaveLength(1)
    expect(result.content[0]).toMatchObject({
      externalJobId: 1,
      freelanceTypeLabel: '프리랜서 적합',
      recommendationLabel: '추천',
      sourceButtonLabel: '사이트에서 확인',
      detailButtonLabel: '상세 보기',
    })
  })

  it('loads a single external job detail without prefixing /api', async () => {
    httpClient.get.mockResolvedValueOnce({
      data: {
        data: {
          id: 3,
          title: '디자인 프로젝트',
          summary: '브랜드 디자인 프로젝트',
          content: '브랜드 디자인 산출물을 제작합니다.',
          requirements: '디자인 · 계약직',
          workLocation: '서울',
          salaryText: '월 300만원',
          sourceUrl: 'https://job.seoul.go.kr/hmpg/main/main.do?sso=ok',
          freelanceType: 'PROJECT_LIKE',
          recommendationType: 'HIGHLY_RECOMMENDED',
          recruitmentEndAt: '2026-07-01T00:00:00',
        },
      },
    })

    await expect(getExternalJob(3)).resolves.toMatchObject({
      externalJobId: 3,
      summary: '브랜드 디자인 프로젝트',
      content: '브랜드 디자인 산출물을 제작합니다.',
      requirements: '디자인 · 계약직',
      workLocation: '서울',
      salaryText: '월 300만원',
      sourceUrl: 'https://job.seoul.go.kr/hmpg/main/main.do?sso=ok',
      freelanceTypeLabel: '프로젝트형',
      recommendationLabel: '매우 추천',
      recruitmentEndAt: '2026-07-01T00:00:00',
      sourceButtonLabel: '사이트에서 확인',
      detailButtonLabel: '상세 보기',
      externalNotice: '외부 공고는 원문 사이트에서 상세 내용을 확인하고 지원을 진행해주세요.',
    })
    expect(httpClient.get).toHaveBeenCalledWith('/external-jobs/3')
  })
})
