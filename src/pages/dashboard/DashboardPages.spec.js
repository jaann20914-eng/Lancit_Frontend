// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CompanyDashboardPage from './CompanyDashboardPage.vue'
import FreelancerDashboardPage from './FreelancerDashboardPage.vue'

const mocks = vi.hoisted(() => ({
  getCompanyDashboard: vi.fn(),
  getFreelancerDashboard: vi.fn(),
}))

vi.mock('@/features/dashboard/api/dashboardApi.js', () => ({
  getCompanyDashboard: mocks.getCompanyDashboard,
  getFreelancerDashboard: mocks.getFreelancerDashboard,
  getDashboardErrorMessage: () => '대시보드 조회 실패',
}))

const global = {
  stubs: {
    RouterLink: {
      props: ['to'],
      template: '<a><slot /></a>',
    },
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getFreelancerDashboard.mockResolvedValue({
    summary: { inProgressContractCount: 7 },
    recentContracts: [
      {
        contractId: 11,
        title: '프리랜서 실제 계약',
        companyName: '랜싯',
        deadline: '2026-07-15',
        status: 'IN_PROGRESS',
      },
    ],
  })
  mocks.getCompanyDashboard.mockResolvedValue({
    summary: { recruitmentCount: 9 },
    recentRecruitments: [
      {
        recruitmentId: 21,
        title: '회사 실제 공고',
        createdAt: '2026-06-20',
        applicantCount: 3,
        status: 'OPEN',
      },
    ],
  })
})

describe('dashboard pages', () => {
  it('renders the freelancer dashboard response', async () => {
    const wrapper = mount(FreelancerDashboardPage, { global })
    await flushPromises()

    expect(mocks.getFreelancerDashboard).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('프리랜서 실제 계약')
    expect(wrapper.findAll('.summary-count')[0].text()).toBe('7')
  })

  it('renders the company dashboard response', async () => {
    const wrapper = mount(CompanyDashboardPage, { global })
    await flushPromises()

    expect(mocks.getCompanyDashboard).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('회사 실제 공고')
    expect(wrapper.findAll('.summary-count')[2].text()).toBe('9')
  })

  it('retries a failed request', async () => {
    mocks.getFreelancerDashboard
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce({ summary: { portfolioCount: 4 } })

    const wrapper = mount(FreelancerDashboardPage, { global })
    await flushPromises()

    expect(wrapper.get('.dashboard-error').text()).toContain('대시보드 조회 실패')
    await wrapper.get('.dashboard-error button').trigger('click')
    await flushPromises()

    expect(mocks.getFreelancerDashboard).toHaveBeenCalledTimes(2)
    expect(wrapper.findAll('.summary-count')[3].text()).toBe('4')
  })
})
