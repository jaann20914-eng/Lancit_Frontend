// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RecruitmentApplyPage from './RecruitmentApplyPage.vue'

const mocks = vi.hoisted(() => ({
  applyToRecruitment: vi.fn(),
  deletePortfolioProfileImage: vi.fn(),
  getAllMyPortfolios: vi.fn(),
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
  getAllMyPortfolios: mocks.getAllMyPortfolios,
  getPortfolioFileUrl: mocks.getPortfolioFileUrl,
}))

vi.mock('@/features/portfolio/api/portfolioProfileApi.js', () => ({
  deletePortfolioProfileImage: mocks.deletePortfolioProfileImage,
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
  mocks.getAllMyPortfolios.mockResolvedValue([
    {
      portfolioId: 11,
      title: '프로젝트',
      summary: '프로젝트 요약',
      category: 'WEB_APP',
      isPublic: false,
      isDeleted: false,
      techStacks: ['Vue'],
    },
  ])
  mocks.deletePortfolioProfileImage.mockResolvedValue()
  mocks.updatePortfolioProfile.mockResolvedValue(profile)
  mocks.applyToRecruitment.mockResolvedValue({ applicationId: 1 })
  mocks.push.mockResolvedValue()
})

describe('RecruitmentApplyPage', () => {
  it('submits selected portfolio ids with the local profile snapshot', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).not.toContain('지원 소개글')
    expect(wrapper.get('.visibility-private').text()).toBe('비공개')
    expect(wrapper.findAll('.body-category')).toHaveLength(1)
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.get('.submit-button').trigger('click')
    await flushPromises()

    expect(mocks.updatePortfolioProfile).not.toHaveBeenCalled()
    expect(mocks.uploadPortfolioProfileImage).not.toHaveBeenCalled()
    expect(mocks.applyToRecruitment).toHaveBeenCalledWith('7', {
      intro: '프로젝트 경험 소개',
      portfolioIds: [11],
      portfolioProfile: {
        displayName: '지원자',
        jobCategory: 'IT',
        profileFileId: null,
        isPortfolioPublic: false,
        intro: '한 줄 소개',
        description: '프로젝트 경험 소개',
        techStacks: ['Vue'],
      },
    })
    expect(mocks.push).toHaveBeenCalledWith({
      name: 'RecruitmentDetail',
      params: { id: '7' },
    })
  })

  it('does not save the source profile when the application API fails', async () => {
    mocks.applyToRecruitment.mockRejectedValueOnce(new Error('apply failed'))
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.get('.submit-button').trigger('click')
    await flushPromises()

    expect(mocks.updatePortfolioProfile).not.toHaveBeenCalled()
    expect(mocks.applyToRecruitment).toHaveBeenCalledTimes(1)
    expect(wrapper.get('.submit-error').text()).toContain('지원하지 못했습니다')
  })

  it('uploads a changed profile image for the application payload and deletes it if apply fails', async () => {
    mocks.uploadPortfolioProfileImage.mockResolvedValueOnce({ fileId: 91 })
    mocks.applyToRecruitment.mockRejectedValueOnce(new Error('apply failed'))
    const wrapper = mountPage()
    await flushPromises()

    wrapper.findComponent({ name: 'PortfolioProfileCard' }).vm.$emit('edit')
    await flushPromises()
    wrapper.findComponent({ name: 'PortfolioProfileForm' }).vm.$emit('submit', {
      ...profile,
      profileImageFile: new File(['image'], 'profile.png', { type: 'image/png' }),
    })
    await flushPromises()

    expect(mocks.updatePortfolioProfile).not.toHaveBeenCalled()
    expect(mocks.uploadPortfolioProfileImage).not.toHaveBeenCalled()

    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.get('.submit-button').trigger('click')
    await flushPromises()

    expect(mocks.uploadPortfolioProfileImage).toHaveBeenCalledTimes(1)
    expect(mocks.applyToRecruitment).toHaveBeenCalledWith('7', {
      intro: '프로젝트 경험 소개',
      portfolioIds: [11],
      portfolioProfile: expect.objectContaining({ profileFileId: 91 }),
    })
    expect(mocks.deletePortfolioProfileImage).toHaveBeenCalledWith(91)
  })
})
