import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAllMyPortfolios } from './portfolioApi.js'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/shared/api/httpClient.js', () => ({
  default: { get: mocks.get },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getAllMyPortfolios', () => {
  it('loads every page and removes duplicate portfolio ids', async () => {
    mocks.get
      .mockResolvedValueOnce({
        data: {
          data: {
            content: [{ portfolioId: 1, title: '첫 프로젝트' }],
            page: 1,
            totalPages: 2,
            hasNext: true,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            content: [
              { portfolioId: 1, title: '첫 프로젝트' },
              { portfolioId: 2, title: '두 번째 프로젝트' },
            ],
            page: 2,
            totalPages: 2,
            hasNext: false,
          },
        },
      })

    const portfolios = await getAllMyPortfolios({ sort: 'latest' })

    expect(mocks.get).toHaveBeenNthCalledWith(1, '/portfolios', {
      params: { sort: 'latest', page: 1, size: 100 },
    })
    expect(mocks.get).toHaveBeenNthCalledWith(2, '/portfolios', {
      params: { sort: 'latest', page: 2, size: 100 },
    })
    expect(portfolios.map((portfolio) => portfolio.portfolioId)).toEqual([1, 2])
  })
})
