// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CompanyRecruitmentEditorPage from './CompanyRecruitmentEditorPage.vue'

const mocks = vi.hoisted(() => ({
  createCompanyRecruitment: vi.fn(),
  deleteRecruitmentImage: vi.fn(),
  getCompanyRecruitment: vi.fn(),
  getCompanyRecruitmentCopySource: vi.fn(),
  getFileUrl: vi.fn(),
  push: vi.fn(),
  updateCompanyRecruitment: vi.fn(),
  uploadRecruitmentImage: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: { copyFrom: '9' } }),
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('@/features/company/recruitments/api/companyRecruitmentApi.js', () => ({
  createCompanyRecruitment: mocks.createCompanyRecruitment,
  deleteRecruitmentImage: mocks.deleteRecruitmentImage,
  getCompanyRecruitment: mocks.getCompanyRecruitment,
  getCompanyRecruitmentCopySource: mocks.getCompanyRecruitmentCopySource,
  getFileUrl: mocks.getFileUrl,
  updateCompanyRecruitment: mocks.updateCompanyRecruitment,
  uploadRecruitmentImage: mocks.uploadRecruitmentImage,
}))

const copySource = {
  title: '기존 공고',
  summary: '기존 요약',
  content: '기존 내용',
  requirements: '요구사항',
  jobCategory: 'IT',
  recruitmentCategory: 'WEB_APP',
  techStacks: ['Vue'],
  workLocation: '원격',
  budget: 1000000,
  imageFileId: 44,
  recruitmentStartAt: null,
  recruitmentEndAt: null,
  contractStartAt: null,
  contractEndAt: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:preview'),
    revokeObjectURL: vi.fn(),
  })
  mocks.getCompanyRecruitmentCopySource.mockResolvedValue(copySource)
  mocks.createCompanyRecruitment.mockResolvedValue({ recruitmentId: 10 })
  mocks.uploadRecruitmentImage.mockResolvedValue({ fileId: 55 })
  mocks.deleteRecruitmentImage.mockResolvedValue()
  mocks.push.mockResolvedValue()
})

describe('CompanyRecruitmentEditorPage copy flow', () => {
  it('prefills content but clears recruitment dates and the original image', async () => {
    const wrapper = mount(CompanyRecruitmentEditorPage)
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('공고 재등록')
    expect(wrapper.get('#recruitment-title').element.value).toBe('기존 공고')
    expect(wrapper.get('#recruitment-end').element.value).toBe('')
    expect(wrapper.find('.image-preview').exists()).toBe(false)

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(mocks.createCompanyRecruitment).toHaveBeenCalledWith(
      expect.objectContaining({ title: '기존 공고', imageFileId: null }),
    )
  })

  it('deletes a newly uploaded temp image when recruitment creation fails', async () => {
    mocks.createCompanyRecruitment.mockRejectedValueOnce(new Error('save failed'))
    const wrapper = mount(CompanyRecruitmentEditorPage)
    await flushPromises()

    const file = new File(['image'], 'notice.png', { type: 'image/png' })
    const input = wrapper.get('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(mocks.uploadRecruitmentImage).toHaveBeenCalledWith(file)
    expect(mocks.deleteRecruitmentImage).toHaveBeenCalledWith(55)
    expect(wrapper.get('.submit-error').text()).toContain('공고를 저장하지 못했습니다')
  })
})
