// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ApplicationDetailPage from './ApplicationDetailPage.vue'

const mocks = vi.hoisted(() => ({
  cancelMyApplication: vi.fn(),
  getMyApplication: vi.fn(),
  getAllMyPortfolios: vi.fn(),
  getPortfolioFileUrl: vi.fn(),
  push: vi.fn(),
  updateMyApplication: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '7' } }),
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('@/features/applications/api/applicationApi.js', () => ({
  cancelMyApplication: mocks.cancelMyApplication,
  getMyApplication: mocks.getMyApplication,
  updateMyApplication: mocks.updateMyApplication,
}))

vi.mock('@/features/portfolio/api/portfolioApi.js', () => ({
  getAllMyPortfolios: mocks.getAllMyPortfolios,
  getPortfolioFileUrl: mocks.getPortfolioFileUrl,
}))

const application = {
  applicationId: 31,
  recruitmentId: 7,
  recruitmentTitle: '프론트엔드 개발자 모집',
  intro: '기존 지원 소개',
  status: 'PENDING',
  appliedAt: '2026-06-20T09:00:00',
  portfolioProfile: {
    displayName: '지원자',
    jobCategory: 'IT',
    description: '프로젝트 경험 소개',
    techStacks: ['Vue'],
  },
  portfolios: [{ portfolioId: 11, title: '기존 프로젝트', summary: '요약', category: 'WEB_APP' }],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  mocks.getMyApplication.mockResolvedValue(application)
  mocks.getAllMyPortfolios.mockResolvedValue([
    ...application.portfolios,
    { portfolioId: 12, title: '추가 프로젝트', summary: '추가 요약', category: 'DESIGN' },
  ])
  mocks.getPortfolioFileUrl.mockResolvedValue('')
  mocks.updateMyApplication.mockImplementation(async (_id, form) => ({
    ...application,
    intro: form.intro,
    portfolios: form.portfolioIds.map((portfolioId) => ({
      portfolioId,
      title: `프로젝트 ${portfolioId}`,
    })),
  }))
  mocks.cancelMyApplication.mockResolvedValue()
  mocks.push.mockResolvedValue()
})

describe('ApplicationDetailPage', () => {
  it('loads and updates the pending application with selected portfolios', async () => {
    const wrapper = mount(ApplicationDetailPage)
    await flushPromises()

    expect(wrapper.text()).toContain('프론트엔드 개발자 모집')
    await wrapper.get('.section-heading .secondary-button').trigger('click')
    await flushPromises()

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes).toHaveLength(2)
    expect(checkboxes[0].element.checked).toBe(true)
    await wrapper.get('.intro-input').setValue('수정한 지원 소개')
    await checkboxes[1].setValue(true)
    await wrapper.get('.action-panel .primary-button').trigger('click')
    await flushPromises()

    expect(mocks.updateMyApplication).toHaveBeenCalledWith('7', {
      intro: '수정한 지원 소개',
      portfolioIds: [11, 12],
    })
    expect(wrapper.text()).toContain('지원서가 수정되었습니다.')
  })

  it('cancels a pending application and returns to the applied tab', async () => {
    const wrapper = mount(ApplicationDetailPage)
    await flushPromises()

    await wrapper.get('.danger-button').trigger('click')
    await flushPromises()

    expect(mocks.cancelMyApplication).toHaveBeenCalledWith('7')
    expect(mocks.push).toHaveBeenCalledWith({
      name: 'RecruitmentList',
      query: { tab: 'APPLIED' },
    })
  })

  it('shows viewed application actions but keeps them disabled', async () => {
    mocks.getMyApplication.mockResolvedValueOnce({
      ...application,
      viewedAt: '2026-06-21T10:00:00',
    })
    const wrapper = mount(ApplicationDetailPage)
    await flushPromises()

    const editButton = wrapper.get('.section-heading .secondary-button')
    const cancelButton = wrapper.get('.danger-button')
    expect(editButton.attributes('disabled')).toBeDefined()
    expect(cancelButton.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('회사가 열람한 지원서는 수정하거나 취소할 수 없습니다.')

    await editButton.trigger('click')
    await cancelButton.trigger('click')
    expect(mocks.getAllMyPortfolios).not.toHaveBeenCalled()
    expect(mocks.cancelMyApplication).not.toHaveBeenCalled()
  })

  it('removes unavailable portfolio ids before updating', async () => {
    mocks.getMyApplication.mockResolvedValueOnce({
      ...application,
      portfolios: [
        ...application.portfolios,
        { portfolioId: 99, title: '삭제된 프로젝트', summary: '삭제됨', category: 'WEB_APP' },
      ],
    })
    const wrapper = mount(ApplicationDetailPage)
    await flushPromises()

    await wrapper.get('.section-heading .secondary-button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('선택에서 제외했습니다')
    await wrapper.get('.action-panel .primary-button').trigger('click')
    await flushPromises()

    expect(mocks.updateMyApplication).toHaveBeenCalledWith('7', {
      intro: '기존 지원 소개',
      portfolioIds: [11],
    })
  })

  it('links an accepted application to its contract', async () => {
    mocks.getMyApplication.mockResolvedValueOnce({
      ...application,
      status: 'ACCEPTED',
      contractId: 55,
    })
    const wrapper = mount(ApplicationDetailPage)
    await flushPromises()

    await wrapper.get('.contract-button').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith({ name: 'ContractDetail', params: { id: 55 } })
  })
})
