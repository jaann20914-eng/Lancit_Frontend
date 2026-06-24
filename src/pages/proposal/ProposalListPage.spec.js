// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProposalListPage from './ProposalListPage.vue'

const mocks = vi.hoisted(() => ({
  acceptProposal: vi.fn(),
  getProposals: vi.fn(),
  rejectContract: vi.fn(),
  router: { push: vi.fn(), replace: vi.fn() },
}))

vi.mock('vue-router', () => ({
  useRouter: () => mocks.router,
}))

vi.mock('@/features/contract/api/contractApi.js', () => ({
  acceptProposal: mocks.acceptProposal,
  getProposals: mocks.getProposals,
  rejectContract: mocks.rejectContract,
}))

describe('ProposalListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getProposals.mockResolvedValue({
      data: {
        data: {
          content: [],
          totalElements: 0,
          totalPages: 1,
        },
      },
    })
  })

  it('totalPages가 1이어도 페이지네이션을 렌더링한다', async () => {
    const wrapper = mount(ProposalListPage)
    await flushPromises()

    expect(mocks.getProposals).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        size: 5,
        sort: 'latest',
      }),
    )

    const pagination = wrapper.get('nav.base-pagination')
    const buttons = pagination.findAll('button')

    expect(buttons).toHaveLength(5)
    expect(buttons.map((button) => button.text())).toEqual(['«', '‹', '1', '›', '»'])
    expect(buttons[0].attributes()).toHaveProperty('disabled')
    expect(buttons[1].attributes()).toHaveProperty('disabled')
    expect(buttons[2].classes()).toContain('active')
    expect(buttons[3].attributes()).toHaveProperty('disabled')
    expect(buttons[4].attributes()).toHaveProperty('disabled')
  })
})
