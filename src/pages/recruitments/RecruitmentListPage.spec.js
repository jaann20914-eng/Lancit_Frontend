// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RecruitmentListPage from './RecruitmentListPage.vue'

const mocks = vi.hoisted(() => ({
  getRecruitments: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  toggleRecruitmentBookmark: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { tab: 'APPLIED' } }),
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}))

vi.mock('@/features/recruitments/api/recruitmentApi.js', () => ({
  getRecruitments: mocks.getRecruitments,
  toggleRecruitmentBookmark: mocks.toggleRecruitmentBookmark,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getRecruitments.mockResolvedValue({
    content: [
      {
        recruitmentId: 7,
        title: '프론트엔드 개발자 모집',
        companyName: '랜싯',
        workLocation: '원격',
        jobCategoryLabel: 'IT/개발',
        summary: '프로젝트 요약',
        budget: 1000000,
        contractStartAt: null,
        contractEndAt: null,
        recruitmentEndAt: '2026-07-01',
        applicantCount: 1,
        techStacks: ['Vue'],
        statusMeta: { label: '모집중', className: 'status-open' },
        isApplied: true,
        isBookmarked: false,
        canApply: false,
      },
    ],
    page: 1,
    size: 10,
    totalElements: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  })
})

describe('RecruitmentListPage', () => {
  it('opens the application detail for an applied recruitment', async () => {
    const wrapper = mount(RecruitmentListPage)
    await flushPromises()

    expect(wrapper.text()).toContain('지원서 보기')
    await wrapper.get('.apply-button').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith({ name: 'ApplicationDetail', params: { id: 7 } })
  })
})
