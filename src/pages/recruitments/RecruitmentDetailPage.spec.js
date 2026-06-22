// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RecruitmentDetailPage from './RecruitmentDetailPage.vue'

const mocks = vi.hoisted(() => ({
  getRecruitment: vi.fn(),
  getRecruitmentFileUrl: vi.fn(),
  push: vi.fn(),
  toggleRecruitmentBookmark: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '7' } }),
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('@/features/recruitments/api/recruitmentApi.js', () => ({
  getRecruitment: mocks.getRecruitment,
  getRecruitmentFileUrl: mocks.getRecruitmentFileUrl,
  toggleRecruitmentBookmark: mocks.toggleRecruitmentBookmark,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getRecruitment.mockResolvedValue({
    recruitmentId: 7,
    title: '프론트엔드 개발자 모집',
    companyName: '랜싯',
    summary: '프로젝트 요약',
    jobCategoryLabel: 'IT/개발',
    recruitmentCategoryLabel: '웹/앱',
    statusMeta: { label: '모집중', className: 'status-open' },
    imageFileId: null,
    techStacks: [],
    applicantCount: 1,
    isApplied: true,
    isBookmarked: false,
    canApply: false,
  })
})

describe('RecruitmentDetailPage', () => {
  it('opens the application detail when the recruitment is already applied', async () => {
    const wrapper = mount(RecruitmentDetailPage)
    await flushPromises()

    await wrapper.get('.apply-button').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith({ name: 'ApplicationDetail', params: { id: 7 } })
  })
})
