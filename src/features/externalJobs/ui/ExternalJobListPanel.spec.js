// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExternalJobListPanel from './ExternalJobListPanel.vue'

const mocks = vi.hoisted(() => ({
  getExternalJobs: vi.fn(),
  push: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('@/features/externalJobs/api/externalJobApi.js', () => ({
  EXTERNAL_JOB_RECOMMENDATION_OPTIONS: [
    { value: 'HIGHLY_RECOMMENDED', label: '매우 추천' },
    { value: 'RECOMMENDED', label: '추천' },
    { value: 'POSSIBLE', label: '검토 가능' },
  ],
  getExternalJobs: mocks.getExternalJobs,
}))

beforeEach(() => {
  vi.clearAllMocks()
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
      keyword: '',
      recommendationType: '',
      sort: 'RECOMMENDED',
      page: 1,
      size: 10,
    })
    expect(wrapper.get('.detail-button').text()).toBe('상세 보기')
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

  it('opens the external job detail page from title and detail button', async () => {
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

    await wrapper.get('.title-button').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith({
      name: 'ExternalJobDetail',
      params: { externalJobId: 5 },
      query: { from: 'external' },
    })

    await wrapper.get('.detail-button').trigger('click')
    expect(mocks.push).toHaveBeenLastCalledWith({
      name: 'ExternalJobDetail',
      params: { externalJobId: 5 },
      query: { from: 'external' },
    })
  })

  it('does not show the AI recommendation copy when a later page is returned', async () => {
    mocks.getExternalJobs.mockResolvedValueOnce({
      content: [externalJob(3, '다음 페이지 공고')],
      page: 1,
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
      keyword: '',
      recommendationType: '',
      sort: 'LATEST',
      page: 1,
      size: 10,
    })
    expect(wrapper.text()).toContain('최신순 공고')
    expect(wrapper.text()).not.toContain('AI가 추천하는 공고입니다.')
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
