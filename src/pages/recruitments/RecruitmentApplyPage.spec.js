// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RecruitmentApplyPage from './RecruitmentApplyPage.vue'

const mocks = vi.hoisted(() => ({
  applyToRecruitment: vi.fn(),
  getMyPortfolios: vi.fn(),
  getPortfolioFileUrl: vi.fn(),
  getPortfolioProfile: vi.fn(),
  getPortfolioProfileImageUrl: vi.fn(),
  getRecruitment: vi.fn(),
  push: vi.fn(),
  updatePortfolioProfile: vi.fn(),
  uploadPortfolioProfileImage: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { recruitmentId: '7' } }),
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('@/features/applications/api/applicationApi.js', () => ({
  applyToRecruitment: mocks.applyToRecruitment,
}))

vi.mock('@/features/portfolio/api/portfolioApi.js', () => ({
  getMyPortfolios: mocks.getMyPortfolios,
  getPortfolioFileUrl: mocks.getPortfolioFileUrl,
}))

vi.mock('@/features/portfolio/api/portfolioProfileApi.js', () => ({
  getPortfolioProfile: mocks.getPortfolioProfile,
  getPortfolioProfileImageUrl: mocks.getPortfolioProfileImageUrl,
  updatePortfolioProfile: mocks.updatePortfolioProfile,
  uploadPortfolioProfileImage: mocks.uploadPortfolioProfileImage,
}))

vi.mock('@/features/recruitments/api/recruitmentApi.js', () => ({
  getRecruitment: mocks.getRecruitment,
}))

const profile = {
  displayName: '지원자',
  jobCategory: 'IT',
  profileFileId: null,
  isPortfolioPublic: false,
  intro: '한 줄 소개',
  description: '프로젝트 경험 소개',
  techStacks: ['Vue'],
}

function mountPage() {
  return mount(RecruitmentApplyPage, {
    global: {
      stubs: {
        PortfolioProfileCard: true,
        PortfolioProfileForm: true,
      },
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(window, 'alert').mockImplementation(() => {})

  mocks.getRecruitment.mockResolvedValue({
    recruitmentId: 7,
    title: '프론트엔드 개발자 모집',
    companyName: '랜싯',
    statusMeta: { label: '모집중', className: 'status-open' },
    jobCategoryLabel: 'IT/개발',
    recruitmentCategoryLabel: '웹/앱',
    canApply: true,
    isApplied: false,
  })
  mocks.getPortfolioProfile.mockResolvedValue(profile)
  mocks.getPortfolioProfileImageUrl.mockResolvedValue('')
  mocks.getPortfolioFileUrl.mockResolvedValue('')
  mocks.getMyPortfolios.mockResolvedValue({
    content: [
      {
        portfolioId: 11,
        title: '프로젝트',
        summary: '프로젝트 요약',
        category: 'WEB_APP',
        isPublic: false,
        isDeleted: false,
        techStacks: ['Vue'],
      },
    ],
  })
  mocks.updatePortfolioProfile.mockResolvedValue(profile)
  mocks.applyToRecruitment.mockResolvedValue({ applicationId: 1 })
  mocks.push.mockResolvedValue()
})

describe('RecruitmentApplyPage', () => {
  it('saves the profile before submitting selected portfolio ids', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).not.toContain('지원 소개글')
    expect(wrapper.get('.visibility-private').text()).toBe('비공개')
    expect(wrapper.findAll('.body-category')).toHaveLength(1)
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.get('.submit-button').trigger('click')
    await flushPromises()

    expect(mocks.updatePortfolioProfile).toHaveBeenCalledWith(profile)
    expect(mocks.applyToRecruitment).toHaveBeenCalledWith('7', {
      intro: '프로젝트 경험 소개',
      portfolioIds: [11],
    })
    expect(mocks.updatePortfolioProfile.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.applyToRecruitment.mock.invocationCallOrder[0],
    )
    expect(mocks.push).toHaveBeenCalledWith({
      name: 'RecruitmentDetail',
      params: { id: '7' },
    })
  })

  it('does not call the application API when the profile save fails', async () => {
    mocks.updatePortfolioProfile.mockRejectedValueOnce(new Error('save failed'))
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.get('.submit-button').trigger('click')
    await flushPromises()

    expect(mocks.applyToRecruitment).not.toHaveBeenCalled()
    expect(wrapper.get('.submit-error').text()).toContain('지원이 진행되지 않았습니다')
  })
})
