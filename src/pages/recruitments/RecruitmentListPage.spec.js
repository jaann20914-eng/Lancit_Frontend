// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RecruitmentListPage from './RecruitmentListPage.vue'

const mocks = vi.hoisted(() => ({
  getExternalJobs: vi.fn(),
  getRecruitments: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  route: { query: { tab: 'APPLIED' } },
  toggleRecruitmentBookmark: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}))

vi.mock('@/features/externalJobs/api/externalJobApi.js', () => ({
  EXTERNAL_JOB_RECOMMENDATION_OPTIONS: [
    { value: 'HIGHLY_RECOMMENDED', label: '매우 추천' },
    { value: 'RECOMMENDED', label: '추천' },
    { value: 'POSSIBLE', label: '검토 가능' },
  ],
  getExternalJobs: mocks.getExternalJobs,
}))

vi.mock('@/features/recruitments/api/recruitmentApi.js', () => ({
  getRecruitments: mocks.getRecruitments,
  toggleRecruitmentBookmark: mocks.toggleRecruitmentBookmark,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.route.query = { tab: 'APPLIED' }
  mocks.getExternalJobs.mockResolvedValue({
    content: [
      {
        externalJobId: 1,
        title: 'Vue 외주 개발자 모집',
        companyName: '랜싯',
        location: '서울',
        jobCategoryRaw: 'IT/개발',
        salaryText: '월 500만원',
        deadlineAt: '2026-07-01T00:00:00',
        sourceLabel: '서울시 일자리플러스센터',
        sourceUrl: 'https://example.com/job/1',
        sourceButtonLabel: '사이트에서 확인',
        freelanceTypeLabel: '프리랜서 적합',
        recommendationLabel: '추천',
        recommendationClassName: 'recommendation-recommended',
      },
    ],
    page: 1,
    size: 10,
    totalElements: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  })
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

  it('shows the external jobs tab and loads read-only external job cards', async () => {
    const wrapper = mount(RecruitmentListPage)
    await flushPromises()

    const externalTab = wrapper
      .findAll('.scope-tab')
      .find((button) => button.text() === '외부 공고')

    expect(externalTab).toBeTruthy()
    await externalTab.trigger('click')
    await flushPromises()

    expect(mocks.getExternalJobs).toHaveBeenCalledWith({
      keyword: '',
      recommendationType: '',
      sort: 'RECOMMENDED',
      page: 1,
      size: 10,
    })
    expect(wrapper.text()).toContain('Vue 외주 개발자 모집')
    expect(wrapper.text()).toContain('외부 공고는 공공 채용 API를 기반으로 수집된 정보입니다.')
    expect(wrapper.find('.apply-button').exists()).toBe(false)
    expect(wrapper.find('.bookmark-button').exists()).toBe(false)

    const sourceLink = wrapper.get('a.source-link')
    expect(sourceLink.text()).toBe('사이트에서 확인')
    expect(sourceLink.attributes('href')).toBe('https://example.com/job/1')
    expect(sourceLink.attributes('target')).toBe('_blank')
    expect(sourceLink.attributes('rel')).toBe('noopener noreferrer')
  })

  it('uses the external jobs API instead of the internal recruitment API for an EXTERNAL route tab', async () => {
    mocks.route.query = { tab: 'EXTERNAL' }

    const wrapper = mount(RecruitmentListPage)
    await flushPromises()

    expect(mocks.getRecruitments).not.toHaveBeenCalled()
    expect(mocks.getExternalJobs).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Vue 외주 개발자 모집')
  })
})
