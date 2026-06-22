// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PortfolioDetailPage from './PortfolioDetailPage.vue'

const mocks = vi.hoisted(() => ({
  route: {
    name: 'TalentPortfolioDetail',
    params: { id: '9' },
    query: { from: 'applicant', recruitmentId: '2', applicationId: '3' },
  },
  router: { push: vi.fn() },
  authStore: {
    email: 'company@lancit.com',
    isFreelancer: false,
  },
  getCompanyApplicationPortfolio: vi.fn(),
  getCompanyApplicationPortfolioFileDownloadUrl: vi.fn(),
  getCompanyApplicationPortfolioFileUrl: vi.fn(),
  deletePortfolio: vi.fn(),
  getPortfolioDetail: vi.fn(),
  getPortfolioFileDownloadUrl: vi.fn(),
  getPortfolioFileUrl: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => mocks.router,
}))

vi.mock('@/features/auth/model/authStore.js', () => ({
  useAuthStore: () => mocks.authStore,
}))

vi.mock('@/features/applications/api/applicationApi.js', () => ({
  getCompanyApplicationPortfolio: mocks.getCompanyApplicationPortfolio,
  getCompanyApplicationPortfolioFileDownloadUrl:
    mocks.getCompanyApplicationPortfolioFileDownloadUrl,
  getCompanyApplicationPortfolioFileUrl: mocks.getCompanyApplicationPortfolioFileUrl,
}))

vi.mock('@/features/portfolio/api/portfolioApi.js', () => ({
  deletePortfolio: mocks.deletePortfolio,
  getPortfolioDetail: mocks.getPortfolioDetail,
  getPortfolioFileDownloadUrl: mocks.getPortfolioFileDownloadUrl,
  getPortfolioFileUrl: mocks.getPortfolioFileUrl,
}))

describe('PortfolioDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(mocks.route, {
      name: 'TalentPortfolioDetail',
      params: { id: '9' },
      query: { from: 'applicant', recruitmentId: '2', applicationId: '3' },
    })
    Object.assign(mocks.authStore, {
      email: 'company@lancit.com',
      isFreelancer: false,
    })
    mocks.getCompanyApplicationPortfolio.mockResolvedValue({
      portfolio: {
        portfolioId: 9,
        title: '제출 프로젝트',
        summary: '프로젝트 요약',
        category: 'WEB_APP',
        bannerFileId: 90,
      },
      files: [{ fileId: 91, oriName: '결과물.pdf', fileSize: 2048 }],
    })
    mocks.getCompanyApplicationPortfolioFileUrl.mockResolvedValue('https://example.com/banner')
    mocks.getCompanyApplicationPortfolioFileDownloadUrl.mockResolvedValue(
      'https://example.com/download',
    )
  })

  it('지원서 전용 API로 비공개 프로젝트의 배너와 첨부파일을 조회한다', async () => {
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const wrapper = mount(PortfolioDetailPage)
    await flushPromises()

    expect(mocks.getCompanyApplicationPortfolio).toHaveBeenCalledWith('2', '3', '9')
    expect(mocks.getPortfolioDetail).not.toHaveBeenCalled()
    expect(wrapper.get('.detail-banner img').attributes('src')).toBe('https://example.com/banner')
    expect(wrapper.text()).toContain('결과물.pdf')

    await wrapper.get('.download-button').trigger('click')
    await flushPromises()

    expect(mocks.getCompanyApplicationPortfolioFileDownloadUrl).toHaveBeenCalledWith(
      '2',
      '3',
      '9',
      91,
    )
    expect(anchorClick).toHaveBeenCalledOnce()
  })

  it('본인 포트폴리오에만 수정과 삭제 버튼을 표시한다', async () => {
    Object.assign(mocks.route, {
      name: 'PortfolioDetail',
      params: { id: '9' },
      query: {},
    })
    Object.assign(mocks.authStore, {
      email: 'OWNER@LANCIT.COM',
      isFreelancer: true,
    })
    mocks.getPortfolioDetail.mockResolvedValue({
      portfolio: {
        portfolioId: 9,
        email: 'owner@lancit.com',
        title: '내 프로젝트',
        category: 'WEB_APP',
      },
      files: [],
    })

    const wrapper = mount(PortfolioDetailPage)
    await flushPromises()

    expect(wrapper.find('.edit-button').exists()).toBe(true)
    expect(wrapper.find('.delete-button').exists()).toBe(true)
  })

  it('타인의 공개 포트폴리오에는 관리 버튼을 표시하지 않는다', async () => {
    Object.assign(mocks.route, {
      name: 'PortfolioDetail',
      params: { id: '9' },
      query: {},
    })
    Object.assign(mocks.authStore, {
      email: 'viewer@lancit.com',
      isFreelancer: true,
    })
    mocks.getPortfolioDetail.mockResolvedValue({
      portfolio: {
        portfolioId: 9,
        email: 'owner@lancit.com',
        title: '공개 프로젝트',
        category: 'WEB_APP',
        isPublic: true,
      },
      files: [],
    })

    const wrapper = mount(PortfolioDetailPage)
    await flushPromises()

    expect(wrapper.find('.management-actions').exists()).toBe(false)
    expect(mocks.deletePortfolio).not.toHaveBeenCalled()
  })
})
