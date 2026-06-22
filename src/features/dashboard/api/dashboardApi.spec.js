import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCompanyDashboard,
  getDashboardErrorMessage,
  getFreelancerDashboard,
} from './dashboardApi.js'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/shared/api/httpClient.js', () => ({
  default: { get: mocks.get },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('dashboardApi', () => {
  it('loads and unwraps the freelancer dashboard', async () => {
    const payload = { summary: { portfolioCount: 2 } }
    mocks.get.mockResolvedValueOnce({ data: { data: payload } })

    await expect(getFreelancerDashboard()).resolves.toEqual(payload)
    expect(mocks.get).toHaveBeenCalledWith('/dashboard/freelancer')
  })

  it('loads and unwraps the company dashboard', async () => {
    const payload = { summary: { recruitmentCount: 3 } }
    mocks.get.mockResolvedValueOnce({ data: payload })

    await expect(getCompanyDashboard()).resolves.toEqual(payload)
    expect(mocks.get).toHaveBeenCalledWith('/dashboard/company')
  })

  it('uses a backend message before the fallback message', () => {
    expect(
      getDashboardErrorMessage({ response: { status: 500, data: { message: '집계 실패' } } }),
    ).toBe('집계 실패')
    expect(getDashboardErrorMessage(new Error('network'))).toContain(
      '대시보드를 불러오지 못했습니다',
    )
  })
})
