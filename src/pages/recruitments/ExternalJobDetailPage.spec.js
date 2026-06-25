// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExternalJobDetailPage from './ExternalJobDetailPage.vue'

const mocks = vi.hoisted(() => ({
  getExternalJob: vi.fn(),
  push: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { externalJobId: '9' } }),
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('@/features/externalJobs/api/externalJobApi.js', () => ({
  getExternalJob: mocks.getExternalJob,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getExternalJob.mockResolvedValue({
    externalJobId: 9,
    title: 'IT 프로젝트 PM',
    companyName: '서울시',
    summary: '공공기관 IT 프로젝트 PM 업무',
    content: '공공기관 IT 프로젝트 PM 업무를 수행합니다.',
    requirements: '컴퓨터시스템 설계 및 분석가 · 계약직',
    jobCategoryRaw: '컴퓨터시스템 설계 및 분석가',
    employmentTypeRaw: '계약직',
    workLocation: '서울',
    salaryText: '월 500만원',
    sourceLabel: '서울시 일자리플러스센터',
    sourceUrl: 'https://job.seoul.go.kr/hmpg/main/main.do?sso=ok',
    sourceButtonLabel: '사이트에서 확인',
    recruitmentStartAt: '2026-06-01T00:00:00',
    recruitmentEndAt: '2026-07-01T00:00:00',
    collectedAt: '2026-06-02T10:00:00',
    updatedAt: '2026-06-03T10:00:00',
    recommendationLabel: '추천',
    recommendationClassName: 'recommendation-recommended',
    externalNotice: '외부 공고는 원문 사이트에서 상세 내용을 확인하고 지원을 진행해주세요.',
  })
})

describe('ExternalJobDetailPage', () => {
  it('renders external job detail with the same detail-card layout and source action', async () => {
    const wrapper = mount(ExternalJobDetailPage)
    await flushPromises()

    expect(mocks.getExternalJob).toHaveBeenCalledWith('9')
    expect(wrapper.find('.detail-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('IT 프로젝트 PM')
    expect(wrapper.text()).toContain('공공기관 IT 프로젝트 PM 업무를 수행합니다.')
    expect(wrapper.text()).toContain('급여/보수')
    expect(wrapper.text()).toContain('모집 기간')
    expect(wrapper.text()).toContain('원문 확인')

    const sourceLink = wrapper.get('a.source-button')
    expect(sourceLink.text()).toBe('사이트에서 확인')
    expect(sourceLink.attributes('href')).toBe('https://job.seoul.go.kr/hmpg/main/main.do?sso=ok')
    expect(sourceLink.attributes('target')).toBe('_blank')
    expect(sourceLink.attributes('rel')).toBe('noopener noreferrer')
  })

  it('returns to the external jobs tab', async () => {
    const wrapper = mount(ExternalJobDetailPage)
    await flushPromises()

    await wrapper.get('.back-button').trigger('click')

    expect(mocks.push).toHaveBeenCalledWith({
      name: 'RecruitmentList',
      query: { tab: 'EXTERNAL' },
    })
  })
})
