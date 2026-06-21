import { beforeEach, describe, expect, it, vi } from 'vitest'
import httpClient from '@/shared/api/httpClient.js'
import { getFreelancerDashboard, getCompanyDashboard } from './dashboardApi.js'

const mocks = vi.hoisted(() => ({
  getCompanyApplications: vi.fn(),
  getMyRecruitments: vi.fn(),
  getMyPortfolios: vi.fn(),
  getPortfolioFileUrl: vi.fn(),
  getRecruitments: vi.fn(),
}))

vi.mock('@/shared/api/httpClient.js', () => ({ default: { get: vi.fn() } }))
vi.mock('@/features/company/applicants/api/companyApplicationApi.js', () => ({
  getCompanyApplications: mocks.getCompanyApplications,
}))
vi.mock('@/features/company/recruitments/api/companyRecruitmentApi.js', () => ({
  getMyRecruitments: mocks.getMyRecruitments,
}))
vi.mock('@/features/portfolio/api/portfolioApi.js', () => ({
  getMyPortfolios: mocks.getMyPortfolios,
  getPortfolioFileUrl: mocks.getPortfolioFileUrl,
}))
vi.mock('@/features/recruitments/api/recruitmentApi.js', () => ({
  getRecruitments: mocks.getRecruitments,
}))

function apiPage(content, totalElements = content.length) {
  return { data: { data: { content, totalElements } } }
}

describe('dashboardApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('프리랜서 대시보드를 실제 조회 결과로 구성한다', async () => {
    httpClient.get
      .mockResolvedValueOnce(apiPage([{ contract_id: 1, recruitment_title: '진행 계약' }], 1))
      .mockResolvedValueOnce(apiPage([{ contractId: 2, recruitmentTitle: '받은 제안' }], 3))
    mocks.getRecruitments.mockResolvedValue({
      content: [{ recruitmentId: 7, title: '지원 공고', applicantCount: 0 }],
      totalElements: 5,
    })
    mocks.getMyPortfolios.mockResolvedValue({
      content: [{ portfolioId: 9, title: '내 프로젝트', isPublic: true, bannerFileId: 90 }],
      totalElements: 4,
    })
    mocks.getPortfolioFileUrl.mockResolvedValue('https://example.com/banner.png')

    const dashboard = await getFreelancerDashboard()

    expect(mocks.getMyPortfolios).toHaveBeenCalledWith({ page: 1, size: 4, sort: 'latest' })
    expect(dashboard.summaryItems.map((item) => item.count)).toEqual([1, 3, 5, 4])
    expect(dashboard.panels[0].items[0].to).toBe('/freelancer/contracts/1')
    expect(dashboard.panels[3].type).toBe('portfolio')
    expect(dashboard.panels[3].items[0]).toEqual({
      portfolio: expect.objectContaining({ title: '내 프로젝트' }),
      bannerUrl: 'https://example.com/banner.png',
    })
  })

  it('회사 대시보드의 공고와 지원자 현황을 집계한다', async () => {
    httpClient.get
      .mockResolvedValueOnce(apiPage([{ contractId: 1, recruitmentTitle: '진행 계약' }], 1))
      .mockResolvedValueOnce(apiPage([], 2))
    mocks.getMyRecruitments.mockResolvedValue({
      content: [
        { recruitmentId: 10, title: '활성 공고', status: 'OPEN', applicantCount: 3 },
        { recruitmentId: 11, title: '마감 공고', status: 'CLOSED', applicantCount: 1 },
      ],
      totalElements: 2,
    })
    mocks.getCompanyApplications.mockResolvedValue({
      content: [{
        applicationId: 20,
        recruitmentId: 10,
        applicantName: '지원자',
        status: 'PENDING',
        statusMeta: { label: '검토중' },
        appliedAt: '2026-06-22T10:00:00',
      }],
    })

    const dashboard = await getCompanyDashboard()

    expect(dashboard.summaryItems.map((item) => item.count)).toEqual([1, 4, 2, 2])
    expect(dashboard.panels[1].items[0].title).toBe('지원자')
    expect(dashboard.panels[2].items).toHaveLength(1)
  })
})
