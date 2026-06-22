// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PortfolioEditorPage from './PortfolioEditorPage.vue'

const mocks = vi.hoisted(() => ({
  route: { params: { id: '9' } },
  router: { push: vi.fn() },
  createPortfolio: vi.fn(),
  deletePortfolio: vi.fn(),
  deletePortfolioFile: vi.fn(),
  getMyPortfolios: vi.fn(),
  getPortfolioDetail: vi.fn(),
  getPortfolioFileUrl: vi.fn(),
  uploadPortfolioFiles: vi.fn(),
  updatePortfolio: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => mocks.router,
}))

vi.mock('@/features/portfolio/api/portfolioApi.js', () => ({
  createPortfolio: mocks.createPortfolio,
  deletePortfolio: mocks.deletePortfolio,
  deletePortfolioFile: mocks.deletePortfolioFile,
  getMyPortfolios: mocks.getMyPortfolios,
  getPortfolioDetail: mocks.getPortfolioDetail,
  getPortfolioFileUrl: mocks.getPortfolioFileUrl,
  uploadPortfolioFiles: mocks.uploadPortfolioFiles,
  updatePortfolio: mocks.updatePortfolio,
}))

const PortfolioFormStub = {
  name: 'PortfolioForm',
  template: '<div class="portfolio-form-stub" />',
}

describe('PortfolioEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.route.params = { id: '9' }
    mocks.getPortfolioDetail.mockResolvedValue({
      portfolio: {
        portfolioId: 9,
        title: '기존 프로젝트',
        summary: '기존 요약',
        category: 'WEB_APP',
        bannerFileId: 90,
      },
      files: [{ fileId: 91, oriName: '기존 결과물.pdf' }],
    })
    mocks.getPortfolioFileUrl.mockResolvedValue('https://example.com/banner')
    mocks.uploadPortfolioFiles.mockResolvedValue([{ fileId: 92 }])
    mocks.updatePortfolio.mockResolvedValue(null)
    mocks.deletePortfolioFile.mockResolvedValue(undefined)
  })

  it('배너 교체 시 기존 배너는 백엔드에 맡기고 제거한 결과물 파일만 삭제한다', async () => {
    const wrapper = mount(PortfolioEditorPage, {
      global: { stubs: { PortfolioForm: PortfolioFormStub } },
    })
    await flushPromises()

    const payload = {
      title: '수정 프로젝트',
      summary: '수정 요약',
      content: '',
      category: 'WEB_APP',
      workStartAt: null,
      workEndAt: null,
      isPublic: true,
      bannerFileId: 90,
      bannerFile: new File(['banner'], 'banner.png', { type: 'image/png' }),
      removedBannerFileId: null,
      resultFiles: [],
      removedFileIds: [91],
    }

    wrapper.findComponent(PortfolioFormStub).vm.$emit('submit', payload)
    await flushPromises()

    expect(mocks.uploadPortfolioFiles).toHaveBeenCalledWith(
      [payload.bannerFile],
      'PORTFOLIO_BANNER',
      '9',
    )
    expect(mocks.updatePortfolio).toHaveBeenCalledWith('9', expect.objectContaining({
      bannerFileId: 92,
    }))
    expect(mocks.deletePortfolioFile).toHaveBeenCalledTimes(1)
    expect(mocks.deletePortfolioFile).toHaveBeenCalledWith(91)
    expect(mocks.deletePortfolioFile).not.toHaveBeenCalledWith(90)
  })
})
