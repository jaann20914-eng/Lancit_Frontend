// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BasePagination from './BasePagination.vue'

describe('BasePagination', () => {
  it('totalPages가 0이어도 1페이지 버튼을 렌더링한다', () => {
    const wrapper = mount(BasePagination, {
      props: {
        currentPage: 0,
        totalPages: 0,
      },
    })

    const buttons = wrapper.findAll('button')

    expect(wrapper.find('nav.base-pagination').exists()).toBe(true)
    expect(buttons).toHaveLength(5)
    expect(buttons.map((button) => button.text())).toEqual(['«', '‹', '1', '›', '»'])
    expect(buttons[0].attributes()).toHaveProperty('disabled')
    expect(buttons[1].attributes()).toHaveProperty('disabled')
    expect(buttons[2].classes()).toContain('active')
    expect(buttons[3].attributes()).toHaveProperty('disabled')
    expect(buttons[4].attributes()).toHaveProperty('disabled')
  })
})
