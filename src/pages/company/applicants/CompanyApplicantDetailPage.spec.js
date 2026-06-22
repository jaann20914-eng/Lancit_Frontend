// @vitest-environment jsdom

import { flushPromises, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CompanyApplicantDetailPage from './CompanyApplicantDetailPage.vue'

const mocks = vi.hoisted(() => ({
  route: { params: { recruitmentId: '10', applicationId: '1' } },
  router: { push: vi.fn() },
  getCompanyApplication: vi.fn(),
  updateCompanyApplicationStatus: vi.fn(),
  getCompanyRecruitment: vi.fn(),
  updateCompanyRecruitmentStatus: vi.fn(),
  getCompanyApplicationPortfolioFileUrl: vi.fn(),
  getCompanyApplicationProfileImageUrl: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => mocks.router,
}))

vi.mock('@/features/company/applicants/api/companyApplicationApi.js', () => ({
  getCompanyApplication: mocks.getCompanyApplication,
  updateCompanyApplicationStatus: mocks.updateCompanyApplicationStatus,
}))

vi.mock('@/features/company/recruitments/api/companyRecruitmentApi.js', () => ({
  getCompanyRecruitment: mocks.getCompanyRecruitment,
  updateCompanyRecruitmentStatus: mocks.updateCompanyRecruitmentStatus,
}))

vi.mock('@/features/applications/api/applicationApi.js', () => ({
  getCompanyApplicationPortfolioFileUrl: mocks.getCompanyApplicationPortfolioFileUrl,
  getCompanyApplicationProfileImageUrl: mocks.getCompanyApplicationProfileImageUrl,
}))

function application(status) {
  return {
    applicationId: 1,
    recruitmentTitle: '프론트엔드 개발',
    applicantName: '지원자',
    applicantEmail: 'user@lancit.com',
    status,
    statusMeta: {
      label: status === 'ACCEPTED' ? '수락' : '대기',
      className: status === 'ACCEPTED' ? 'status-accepted' : 'status-pending',
    },
    contractId: status === 'ACCEPTED' ? 7 : null,
    portfolioProfile: { profileFileId: null, techStacks: [] },
    portfolios: [],
  }
}

describe('CompanyApplicantDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('confirm', vi.fn(() => true))
    vi.stubGlobal('alert', vi.fn())
    mocks.getCompanyRecruitment.mockResolvedValue({ recruitmentId: 10, status: 'CLOSED' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('수락된 지원자 상세 조회 시 공고 GET이나 상태 PATCH를 실행하지 않는다', async () => {
    mocks.getCompanyApplication.mockResolvedValue(application('ACCEPTED'))

    shallowMount(CompanyApplicantDetailPage)
    await flushPromises()

    expect(mocks.getCompanyApplication).toHaveBeenCalledTimes(1)
    expect(mocks.getCompanyRecruitment).not.toHaveBeenCalled()
    expect(mocks.updateCompanyRecruitmentStatus).not.toHaveBeenCalled()
  })

  it('지원 수락 시 백엔드 처리 후 갱신된 공고 상태만 GET으로 조회한다', async () => {
    mocks.getCompanyApplication.mockResolvedValue(application('PENDING'))
    mocks.updateCompanyApplicationStatus.mockResolvedValue(application('ACCEPTED'))
    const wrapper = shallowMount(CompanyApplicantDetailPage)
    await flushPromises()

    await wrapper.get('.accept-button').trigger('click')
    await flushPromises()

    expect(mocks.updateCompanyApplicationStatus).toHaveBeenCalledWith('10', '1', 'ACCEPTED')
    expect(mocks.getCompanyRecruitment).toHaveBeenCalledWith('10')
    expect(mocks.updateCompanyRecruitmentStatus).not.toHaveBeenCalled()
  })
})
