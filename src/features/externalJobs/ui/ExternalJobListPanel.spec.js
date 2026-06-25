// @vitest-environment jsdom

import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ExternalJobListPanel from './ExternalJobListPanel.vue'

const mocks = vi.hoisted(() => ({
  authStore: null,
  getUserMe: vi.fn(),
  getExternalJobs: vi.fn(),
  refreshExternalJobRecommendations: vi.fn(),
  push: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('@/features/auth/model/authStore.js', async () => {
  const { reactive } = await import('vue')
  mocks.authStore = reactive({
    jobCategory: 'IT',
    isExternalJobRecommendationStale: false,
    isFreelancer: true,
    updateJobCategory(jobCategory) {
      mocks.authStore.jobCategory = jobCategory || null
    },
    clearExternalJobRecommendationStale() {
      mocks.authStore.isExternalJobRecommendationStale = false
    },
  })
  return { useAuthStore: () => mocks.authStore }
})

vi.mock('@/features/account/api/accountApi.js', () => ({
  getUserMe: mocks.getUserMe,
}))

vi.mock('@/features/externalJobs/api/externalJobApi.js', () => ({
  EXTERNAL_JOB_RECOMMENDATION_OPTIONS: [
    { value: 'HIGHLY_RECOMMENDED', label: '매우 추천' },
    { value: 'RECOMMENDED', label: '추천' },
    { value: 'POSSIBLE', label: '검토 가능' },
  ],
  getExternalJobs: mocks.getExternalJobs,
  refreshExternalJobRecommendations: mocks.refreshExternalJobRecommendations,
}))

enableAutoUnmount(afterEach)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.authStore.jobCategory = 'IT'
  mocks.authStore.isExternalJobRecommendationStale = false
  mocks.authStore.isFreelancer = true
  mocks.getUserMe.mockResolvedValue({
    data: { data: { jobCategory: 'IT' } },
  })
  mocks.refreshExternalJobRecommendations.mockResolvedValue({ success: true })
})

describe('ExternalJobListPanel', () => {
  it('renders recommendation, sort, search controls in one row and requests recommended jobs without source params', async () => {
    mocks.getExternalJobs.mockResolvedValueOnce({
      content: [externalJob(1, 'Vue 외주 개발자 모집'), externalJob(2, '디자인 프로젝트')],
      page: 1,
      size: 10,
      totalElements: 2,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })

    const wrapper = mount(ExternalJobListPanel)
    await flushPromises()

    expect(wrapper.find('[aria-label="외부 공고 출처"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="추천 분류"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="정렬 방식"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="외부 공고 검색어"]').exists()).toBe(true)
    expect(wrapper.find('.base-filter-bar__row--secondary').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('전체 출처')
    expect(wrapper.text()).toContain('추천순')
    expect(wrapper.text()).toContain('최신순')
    expect(wrapper.text()).not.toContain('마감 임박순')
    expect(wrapper.get('[aria-label="정렬 방식"]').element.value).toBe('RECOMMENDED')
    expect(wrapper.find('button[type="submit"] svg').exists()).toBe(true)
    expect(mocks.getExternalJobs).toHaveBeenCalledWith({
      jobCategory: 'IT',
      keyword: '',
      recommendationType: '',
      sort: 'RECOMMENDED',
      page: 1,
      size: 10,
    })
    expect(wrapper.find('.detail-button').exists()).toBe(false)
    expect(wrapper.get('a.source-link').text()).toBe('사이트에서 확인')
    expect(textCount(wrapper.text(), 'AI가 추천하는 공고입니다.')).toBe(1)
  })

  it('renders the external source button with the Seoul main URL', async () => {
    mocks.getExternalJobs.mockResolvedValueOnce({
      content: [
        {
          ...externalJob(4, '서울시 공고'),
          sourceButtonLabel: '사이트에서 확인',
          sourceUrl: 'https://job.seoul.go.kr/hmpg/main/main.do?sso=ok',
        },
      ],
      page: 1,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })

    const wrapper = mount(ExternalJobListPanel)
    await flushPromises()

    const sourceLink = wrapper.get('a.source-link')
    expect(sourceLink.text()).toBe('사이트에서 확인')
    expect(sourceLink.attributes('href')).toBe('https://job.seoul.go.kr/hmpg/main/main.do?sso=ok')
    expect(sourceLink.attributes('target')).toBe('_blank')
    expect(sourceLink.attributes('rel')).toBe('noopener noreferrer')
  })

  it('opens the external job detail page from card selection', async () => {
    mocks.getExternalJobs.mockResolvedValueOnce({
      content: [externalJob(5, '상세 이동 공고')],
      page: 1,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })

    const wrapper = mount(ExternalJobListPanel)
    await flushPromises()

    await wrapper.get('.recruitment-card').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith({
      name: 'ExternalJobDetail',
      params: { externalJobId: 5 },
      query: { from: 'external' },
    })

    await wrapper.get('.recruitment-card').trigger('keydown.enter')
    expect(mocks.push).toHaveBeenLastCalledWith({
      name: 'ExternalJobDetail',
      params: { externalJobId: 5 },
      query: { from: 'external' },
    })
  })

  it('does not show the AI recommendation copy when a later page is returned', async () => {
    mocks.getExternalJobs.mockResolvedValueOnce({
      content: [externalJob(3, '다음 페이지 공고')],
      page: 2,
      size: 10,
      totalElements: 11,
      totalPages: 2,
      hasNext: true,
      hasPrev: true,
    })

    const wrapper = mount(ExternalJobListPanel)
    await flushPromises()

    expect(wrapper.text()).not.toContain('AI가 추천하는 공고입니다.')
  })

  it('requests latest jobs and hides the AI recommendation copy when latest sort is selected', async () => {
    mocks.getExternalJobs
      .mockResolvedValueOnce({
        content: [externalJob(1, '추천순 공고')],
        page: 1,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })
      .mockResolvedValueOnce({
        content: [externalJob(2, '최신순 공고')],
        page: 1,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })

    const wrapper = mount(ExternalJobListPanel)
    await flushPromises()

    await wrapper.get('[aria-label="정렬 방식"]').setValue('LATEST')
    await flushPromises()

    expect(mocks.getExternalJobs).toHaveBeenLastCalledWith({
      jobCategory: 'IT',
      keyword: '',
      recommendationType: '',
      sort: 'LATEST',
      page: 1,
      size: 10,
    })
    expect(wrapper.text()).toContain('최신순 공고')
    expect(wrapper.text()).not.toContain('AI가 추천하는 공고입니다.')
  })

  it.each([
    ['HIGHLY_RECOMMENDED', '매우 추천 공고'],
    ['RECOMMENDED', '추천 공고'],
    ['POSSIBLE', '검토 가능 공고'],
  ])(
    'hides the AI recommendation copy when the %s recommendation filter is selected',
    async (recommendationType, filteredTitle) => {
      mocks.getExternalJobs
        .mockResolvedValueOnce({
          content: [externalJob(1, '전체 추천 공고')],
          page: 1,
          size: 10,
          totalElements: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        })
        .mockResolvedValueOnce({
          content: [externalJob(2, filteredTitle)],
          page: 1,
          size: 10,
          totalElements: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        })

      const wrapper = mount(ExternalJobListPanel)
      await flushPromises()

      await wrapper.get('[aria-label="추천 분류"]').setValue(recommendationType)
      await flushPromises()

      expect(mocks.getExternalJobs).toHaveBeenLastCalledWith({
        jobCategory: 'IT',
        keyword: '',
        recommendationType,
        sort: 'RECOMMENDED',
        page: 1,
        size: 10,
      })
      expect(wrapper.text()).toContain(filteredTitle)
      expect(wrapper.text()).not.toContain('AI가 추천하는 공고입니다.')
    },
  )

  it('hides the AI recommendation copy when search keyword results are shown', async () => {
    mocks.getExternalJobs
      .mockResolvedValueOnce({
        content: [externalJob(1, '전체 추천 공고')],
        page: 1,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })
      .mockResolvedValueOnce({
        content: [externalJob(2, '검색 결과 공고')],
        page: 1,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })

    const wrapper = mount(ExternalJobListPanel)
    await flushPromises()

    await wrapper.get('[aria-label="외부 공고 검색어"]').setValue('검색')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(mocks.getExternalJobs).toHaveBeenLastCalledWith({
      jobCategory: 'IT',
      keyword: '검색',
      recommendationType: '',
      sort: 'RECOMMENDED',
      page: 1,
      size: 10,
    })
    expect(wrapper.text()).toContain('검색 결과 공고')
    expect(wrapper.text()).not.toContain('AI가 추천하는 공고입니다.')
  })

  it('loads the current user job category before the first external job request when the store is empty', async () => {
    mocks.authStore.jobCategory = ''
    mocks.getUserMe.mockResolvedValueOnce({
      data: { data: { jobCategory: 'MARKETING' } },
    })
    mocks.getExternalJobs.mockResolvedValueOnce({
      content: [externalJob(6, '마케팅 프로젝트')],
      page: 1,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })

    const wrapper = mount(ExternalJobListPanel)
    await flushPromises()

    expect(mocks.getUserMe).toHaveBeenCalledTimes(1)
    expect(mocks.refreshExternalJobRecommendations).not.toHaveBeenCalled()
    expect(mocks.getExternalJobs).toHaveBeenCalledWith({
      jobCategory: 'MARKETING',
      keyword: '',
      recommendationType: '',
      sort: 'RECOMMENDED',
      page: 1,
      size: 10,
    })
    expect(wrapper.text()).toContain('마케팅 프로젝트')
  })

  it('refreshes stale recommendations before the first external job request', async () => {
    mocks.authStore.isExternalJobRecommendationStale = true
    mocks.getExternalJobs.mockResolvedValueOnce({
      content: [externalJob(14, '갱신 후 추천 공고')],
      page: 1,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })

    const wrapper = mount(ExternalJobListPanel)
    await flushPromises()

    expect(mocks.refreshExternalJobRecommendations).toHaveBeenCalledWith('IT')
    expect(mocks.refreshExternalJobRecommendations.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.getExternalJobs.mock.invocationCallOrder[0],
    )
    expect(mocks.authStore.isExternalJobRecommendationStale).toBe(false)
    expect(wrapper.text()).toContain('갱신 후 추천 공고')
  })

  it('resets to the first page, refreshes recommendations, and reloads jobs when job category changes', async () => {
    mocks.getExternalJobs
      .mockResolvedValueOnce({
        content: [externalJob(7, '두 번째 페이지 공고')],
        page: 2,
        size: 10,
        totalElements: 12,
        totalPages: 2,
        hasNext: false,
        hasPrev: true,
      })
      .mockResolvedValueOnce({
        content: [externalJob(8, '디자인 추천 공고')],
        page: 1,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })

    const wrapper = mount(ExternalJobListPanel)
    await flushPromises()

    mocks.authStore.jobCategory = 'DESIGN'
    await nextTick()
    await flushPromises()

    expect(mocks.refreshExternalJobRecommendations).toHaveBeenCalledWith('DESIGN')
    expect(mocks.getExternalJobs).toHaveBeenLastCalledWith({
      jobCategory: 'DESIGN',
      keyword: '',
      recommendationType: '',
      sort: 'RECOMMENDED',
      page: 1,
      size: 10,
    })
    expect(wrapper.text()).toContain('디자인 추천 공고')
  })

  it('reloads jobs even when recommendation refresh fails', async () => {
    mocks.getExternalJobs
      .mockResolvedValueOnce({
        content: [externalJob(9, '기존 공고')],
        page: 1,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })
      .mockResolvedValueOnce({
        content: [externalJob(10, 'fallback 기준 공고')],
        page: 1,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })
    mocks.refreshExternalJobRecommendations.mockRejectedValueOnce(new Error('Gemini failed'))

    const wrapper = mount(ExternalJobListPanel)
    await flushPromises()

    mocks.authStore.jobCategory = 'EDUCATION'
    await nextTick()
    await flushPromises()

    expect(mocks.refreshExternalJobRecommendations).toHaveBeenCalledWith('EDUCATION')
    expect(mocks.getExternalJobs).toHaveBeenLastCalledWith({
      jobCategory: 'EDUCATION',
      keyword: '',
      recommendationType: '',
      sort: 'RECOMMENDED',
      page: 1,
      size: 10,
    })
    expect(wrapper.text()).toContain('fallback 기준 공고')
  })

  it('skips recommendation refresh when the job category is empty and still reloads the list', async () => {
    mocks.getExternalJobs
      .mockResolvedValueOnce({
        content: [externalJob(11, '직종 있는 공고')],
        page: 1,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })
      .mockResolvedValueOnce({
        content: [externalJob(12, '전체 기준 공고')],
        page: 1,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })

    const wrapper = mount(ExternalJobListPanel)
    await flushPromises()

    mocks.refreshExternalJobRecommendations.mockClear()
    mocks.authStore.jobCategory = ''
    await nextTick()
    await flushPromises()

    expect(mocks.refreshExternalJobRecommendations).not.toHaveBeenCalled()
    expect(mocks.getExternalJobs).toHaveBeenLastCalledWith({
      jobCategory: undefined,
      keyword: '',
      recommendationType: '',
      sort: 'RECOMMENDED',
      page: 1,
      size: 10,
    })
    expect(wrapper.text()).toContain('전체 기준 공고')
  })

  it('does not expose score, career, or education values on external job cards', async () => {
    mocks.getExternalJobs.mockResolvedValueOnce({
      content: [
        {
          ...externalJob(13, '표시 정책 공고'),
          recommendationScore: 87.65,
          careerCondition: '경력 7년 이상',
          educationCondition: '박사 이상',
        },
      ],
      page: 1,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })

    const wrapper = mount(ExternalJobListPanel)
    await flushPromises()

    expect(wrapper.text()).toContain('표시 정책 공고')
    expect(wrapper.text()).not.toContain('87.65')
    expect(wrapper.text()).not.toContain('경력 7년 이상')
    expect(wrapper.text()).not.toContain('박사 이상')
  })
})

function externalJob(externalJobId, title) {
  return {
    externalJobId,
    title,
    companyName: '랜싯',
    location: '서울',
    jobCategoryRaw: 'IT/개발',
    salaryText: '월 500만원',
    deadlineAt: '2026-07-01T00:00:00',
    sourceLabel: '서울시 일자리플러스센터',
    sourceUrl: `https://example.com/job/${externalJobId}`,
    detailButtonLabel: '상세 보기',
    sourceButtonLabel: '사이트에서 확인',
    freelanceTypeLabel: '프리랜서 적합',
    recommendationLabel: '추천',
    recommendationClassName: 'recommendation-recommended',
  }
}

function textCount(text, needle) {
  return text.split(needle).length - 1
}
