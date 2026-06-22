// @vitest-environment jsdom

import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CompanyRecruitmentDetailPage from './CompanyRecruitmentDetailPage.vue'

const mocks = vi.hoisted(() => ({
  route: { params: { recruitmentId: '10' } },
  router: { push: vi.fn() },
  getCompanyApplications: vi.fn(),
  deleteCompanyRecruitment: vi.fn(),
  getCompanyRecruitment: vi.fn(),
  getFileUrl: vi.fn(),
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
  getCompanyRecruitment: mocks.getCompanyRecruitment,
  getFileUrl: mocks.getFileUrl,
  updateCompanyRecruitmentStatus: mocks.updateCompanyRecruitmentStatus,
}))

const recruitment = {
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
  applicantCount: 1,
  imageFileId: null,
  jobCategoryLabel: 'IT',
  recruitmentCategoryLabel: '프로젝트',
  techStacks: [],
}

describe('CompanyRecruitmentDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCompanyRecruitment.mockResolvedValue(recruitment)
    mocks.getCompanyApplications.mockResolvedValue({
      content: [{
        applicationId: 1,
        applicantName: '지원자',
        applicantEmail: 'user@lancit.com',
        status: 'ACCEPTED',
        statusMeta: { label: '수락', className: 'status-accepted' },
        portfolios: [],
      }],
      page: 1,
      size: 5,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })
  })

  it('공고와 지원자 목록 조회 시 공고 상태 PATCH를 실행하지 않는다', async () => {
    shallowMount(CompanyRecruitmentDetailPage)
    await flushPromises()

    expect(mocks.getCompanyRecruitment).toHaveBeenCalledWith('10')
    expect(mocks.getCompanyApplications).toHaveBeenCalledTimes(1)
    expect(mocks.updateCompanyRecruitmentStatus).not.toHaveBeenCalled()
  })
})
