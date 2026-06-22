// @vitest-environment jsdom

import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
})
