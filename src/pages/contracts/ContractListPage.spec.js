// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContractListPage from './ContractListPage.vue'

const mocks = vi.hoisted(() => ({
  getContracts: vi.fn(),
  hasUnreadByContract: vi.fn(),
  route: { query: {} },
  router: { push: vi.fn(), replace: vi.fn() },
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => mocks.router,
}))

vi.mock('@/features/contract/api/contractApi.js', () => ({
  getContracts: mocks.getContracts,
}))

vi.mock('@/features/auth/model/authStore.js', () => ({
  useAuthStore: () => ({ role: 'COMPANY' }),
}))

vi.mock('@/features/notification/model/useNotificationStore.js', () => ({
  useNotificationStore: () => ({
    hasUnreadByContract: mocks.hasUnreadByContract,
  }),
}))

describe('ContractListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.route.query = {}
    mocks.hasUnreadByContract.mockReturnValue(false)
    mocks.getContracts.mockResolvedValue({
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
    const wrapper = mount(ContractListPage)
    await flushPromises()

    expect(mocks.getContracts).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        size: 5,
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
