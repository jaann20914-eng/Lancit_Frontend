// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PortfolioListPage from './PortfolioListPage.vue'

const mocks = vi.hoisted(() => ({
  router: { push: vi.fn() },
  deletePortfolio: vi.fn(),
  getMyPortfolios: vi.fn(),
  getPortfolioFileUrl: vi.fn(),
  deletePortfolioProfileImage: vi.fn(),
  getPortfolioProfile: vi.fn(),
  getPortfolioProfileImageUrl: vi.fn(),
  uploadPortfolioProfileImage: vi.fn(),
  updatePortfolioProfile: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => mocks.router,
}))

vi.mock('@/features/portfolio/api/portfolioApi.js', () => ({
  deletePortfolio: mocks.deletePortfolio,
  getMyPortfolios: mocks.getMyPortfolios,
  getPortfolioFileUrl: mocks.getPortfolioFileUrl,
}))

vi.mock('@/features/portfolio/api/portfolioProfileApi.js', () => ({
  deletePortfolioProfileImage: mocks.deletePortfolioProfileImage,
  getPortfolioProfile: mocks.getPortfolioProfile,
  getPortfolioProfileImageUrl: mocks.getPortfolioProfileImageUrl,
  uploadPortfolioProfileImage: mocks.uploadPortfolioProfileImage,
  updatePortfolioProfile: mocks.updatePortfolioProfile,
}))

const profile = {
  freelancerEmail: 'user@lancit.com',
  shortIntro: '한 줄 소개',
  description: '프로필 소개',
  techStacks: ['Vue'],
  isPortfolioPublic: true,
  profileFileId: 10,
}

const stubs = {
  PortfolioCard: { template: '<article />' },
  PortfolioEmptyState: { template: '<div data-testid="empty-state" />' },
  PortfolioProfileCard: {
    name: 'PortfolioProfileCard',
    template: '<button type="button" data-testid="edit-profile" @click="$emit(\'edit\')">수정</button>',
  },
  PortfolioProfileForm: {
    name: 'PortfolioProfileForm',
    template: '<div data-testid="profile-form" />',
  },
}

function createProfileImageFile() {
  return new File(['profile image'], 'profile.png', { type: 'image/png' })
}

async function mountPage() {
  const wrapper = mount(PortfolioListPage, {
    global: {
      stubs,
    },
  })

  await flushPromises()
  return wrapper
}

async function openProfileForm(wrapper) {
  await wrapper.get('[data-testid="edit-profile"]').trigger('click')
  await wrapper.vm.$nextTick()
}

describe('PortfolioListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPortfolioProfile.mockResolvedValue({ ...profile })
    mocks.getPortfolioProfileImageUrl.mockResolvedValue('https://example.com/profile.png')
    mocks.getMyPortfolios.mockResolvedValue({ content: [], totalPages: 0 })
    mocks.getPortfolioFileUrl.mockResolvedValue('https://example.com/banner.png')
    mocks.deletePortfolioProfileImage.mockResolvedValue()
  })

  it('프로필 저장 실패 시 새로 업로드한 TEMP 이미지를 삭제한다', async () => {
    const wrapper = await mountPage()
    const uploadedFile = createProfileImageFile()
    mocks.uploadPortfolioProfileImage.mockResolvedValue({ fileId: 123 })
    mocks.updatePortfolioProfile.mockRejectedValue(new Error('save failed'))

    await openProfileForm(wrapper)
    wrapper.findComponent({ name: 'PortfolioProfileForm' }).vm.$emit('submit', {
      ...profile,
      profileImageFile: uploadedFile,
    })
    await flushPromises()

    expect(mocks.uploadPortfolioProfileImage).toHaveBeenCalledWith(uploadedFile)
    expect(mocks.updatePortfolioProfile).toHaveBeenCalledWith(
      expect.objectContaining({ profileFileId: 123 }),
    )
    expect(mocks.deletePortfolioProfileImage).toHaveBeenCalledWith(123)
    expect(mocks.deletePortfolioProfileImage).not.toHaveBeenCalledWith(10)
  })

  it('프로필 저장 성공 시 새로 업로드한 이미지를 삭제하지 않는다', async () => {
    const wrapper = await mountPage()
    const uploadedFile = createProfileImageFile()
    mocks.uploadPortfolioProfileImage.mockResolvedValue({ fileId: 123 })
    mocks.updatePortfolioProfile.mockResolvedValue({ ...profile, profileFileId: 123 })

    await openProfileForm(wrapper)
    wrapper.findComponent({ name: 'PortfolioProfileForm' }).vm.$emit('submit', {
      ...profile,
      profileImageFile: uploadedFile,
    })
    await flushPromises()

    expect(mocks.updatePortfolioProfile).toHaveBeenCalledWith(
      expect.objectContaining({ profileFileId: 123 }),
    )
    expect(mocks.deletePortfolioProfileImage).not.toHaveBeenCalled()
  })

  it('이미지를 변경하지 않은 경우 저장 실패해도 이미지 삭제 API를 호출하지 않는다', async () => {
    const wrapper = await mountPage()
    mocks.updatePortfolioProfile.mockRejectedValue(new Error('save failed'))

    await openProfileForm(wrapper)
    wrapper.findComponent({ name: 'PortfolioProfileForm' }).vm.$emit('submit', {
      ...profile,
      profileImageFile: null,
    })
    await flushPromises()

    expect(mocks.uploadPortfolioProfileImage).not.toHaveBeenCalled()
    expect(mocks.updatePortfolioProfile).toHaveBeenCalledWith(
      expect.objectContaining({ profileFileId: 10 }),
    )
    expect(mocks.deletePortfolioProfileImage).not.toHaveBeenCalled()
  })

  it('프로젝트 검색 버튼 클릭 시 검색어로 1페이지부터 다시 조회한다', async () => {
    const wrapper = await mountPage()
    mocks.getMyPortfolios.mockClear()

    await wrapper.get('input[aria-label="프로젝트 검색어"]').setValue('랜딩 페이지')
    const searchButton = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === '검색')

    expect(searchButton).toBeTruthy()
    await searchButton.trigger('click')
    await flushPromises()

    expect(mocks.getMyPortfolios).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: '랜딩 페이지',
        page: 1,
      }),
    )
  })
})
