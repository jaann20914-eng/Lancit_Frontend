// @vitest-environment jsdom

import { enableAutoUnmount, flushPromises, mount, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CompanyRecruitmentListPage from './CompanyRecruitmentListPage.vue'

const mocks = vi.hoisted(() => ({
  route: { query: {} },
  router: { push: vi.fn(), replace: vi.fn() },
  getCompanyApplications: vi.fn(),
  deleteCompanyRecruitment: vi.fn(),
  getAllRecruitments: vi.fn(),
  getMyRecruitments: vi.fn(),
  updateCompanyRecruitmentStatus: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => mocks.router,
}))

vi.mock('@/features/auth/model/authStore.js', () => ({
  useAuthStore: () => ({ email: 'company@lancit.com' }),
}))

vi.mock('@/features/company/applicants/api/companyApplicationApi.js', () => ({
  getCompanyApplications: mocks.getCompanyApplications,
}))

vi.mock('@/features/company/recruitments/api/companyRecruitmentApi.js', () => ({
  deleteCompanyRecruitment: mocks.deleteCompanyRecruitment,
  getAllRecruitments: mocks.getAllRecruitments,
  getMyRecruitments: mocks.getMyRecruitments,
  updateCompanyRecruitmentStatus: mocks.updateCompanyRecruitmentStatus,
}))

const openRecruitment = {
  recruitmentId: 10,
  companyEmail: 'company@lancit.com',
  companyName: '랜싯',
  title: '프론트엔드 개발',
  summary: '서비스 개발',
  status: 'OPEN',
  statusMeta: { label: '모집중', className: 'status-open' },
  canChangeStatus: true,
  canEdit: false,
  canDelete: false,
  applicantCount: 150,
  jobCategoryLabel: 'IT',
  techStacks: [],
}

const page = {
  content: [openRecruitment],
  page: 1,
  size: 10,
  totalElements: 1,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
}

enableAutoUnmount(afterEach)

describe('CompanyRecruitmentListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.route.query = {}
    mocks.getMyRecruitments.mockResolvedValue(page)
    mocks.getAllRecruitments.mockResolvedValue(page)
    mocks.getCompanyApplications.mockResolvedValue({
      ...page,
      content: [{ status: 'ACCEPTED' }],
    })
  })

  it('공고 목록 조회 시 지원자 추가 조회나 공고 상태 PATCH를 실행하지 않는다', async () => {
    shallowMount(CompanyRecruitmentListPage)
    await flushPromises()

    expect(mocks.getMyRecruitments).toHaveBeenCalledTimes(1)
    expect(mocks.getCompanyApplications).not.toHaveBeenCalled()
    expect(mocks.updateCompanyRecruitmentStatus).not.toHaveBeenCalled()
  })

  it('상태 탭을 유지하고 검색/필터/정렬 값을 공고 목록 조회 파라미터에 반영한다', async () => {
    const wrapper = mount(CompanyRecruitmentListPage)
    await flushPromises()

    expect(wrapper.findAll('.status-tab').map((button) => button.text())).toEqual([
      '전체',
      '모집중',
      '마감',
      '기간 만료',
      '취소',
    ])
    expect(wrapper.text()).toContain('전체 직종')
    expect(wrapper.text()).toContain('전체 공고 유형')

    await wrapper.get('[aria-label="공고 검색어"]').setValue('Vue')
    await wrapper.findAll('select')[0].setValue('IT')
    await wrapper.findAll('select')[1].setValue('WEB_APP')
    await wrapper.findAll('select')[2].setValue('BUDGET')

    const openStatusTab = wrapper
      .findAll('.status-tab')
      .find((button) => button.text() === '모집중')
    await openStatusTab.trigger('click')
    await wrapper.get('form.recruitment-search-row').trigger('submit')
    await flushPromises()

    expect(mocks.getMyRecruitments).toHaveBeenLastCalledWith({
      page: 1,
      size: 10,
      status: 'OPEN',
      keyword: 'Vue',
      jobCategory: 'IT',
      recruitmentCategory: 'WEB_APP',
      sort: 'BUDGET',
    })
  })
})
