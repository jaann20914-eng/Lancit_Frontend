// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PortfolioForm from './PortfolioForm.vue'

describe('PortfolioForm file fields', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:banner-preview'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('선택한 배너와 결과물 파일을 제출 데이터에 포함한다', async () => {
    const wrapper = mount(PortfolioForm)
    const banner = new File(['banner'], 'banner.png', { type: 'image/png' })
    const result = new File(['result'], 'result.pdf', { type: 'application/pdf' })

    await wrapper.get('#portfolio-title').setValue('프로젝트 제목')
    await wrapper.get('#portfolio-summary').setValue('한 줄 요약')
    await wrapper.get('#portfolio-category').setValue('WEB_APP')

    Object.defineProperty(wrapper.get('#portfolio-banner').element, 'files', {
      configurable: true,
      value: [banner],
    })
    await wrapper.get('#portfolio-banner').trigger('change')

    Object.defineProperty(wrapper.get('#portfolio-files').element, 'files', {
      configurable: true,
      value: [result],
    })
    await wrapper.get('#portfolio-files').trigger('change')
    await wrapper.get('form').trigger('submit')

    const payload = wrapper.emitted('submit')[0][0]
    expect(payload.bannerFile).toBe(banner)
    expect(payload.resultFiles).toEqual([result])
    expect(wrapper.text()).toContain('result.pdf')
  })

  it('수정 시 기존 결과물 파일을 목록에 표시하고 삭제 대상으로 전달한다', async () => {
    const wrapper = mount(PortfolioForm, {
      props: {
        initialValue: {
          title: '프로젝트 제목',
          summary: '한 줄 요약',
          category: 'WEB_APP',
        },
        initialFiles: [{ fileId: 17, oriName: '기존 결과물.zip', fileSize: 2048 }],
      },
    })

    expect(wrapper.text()).toContain('기존 결과물.zip')
    expect(wrapper.text()).toContain('등록됨')

    await wrapper.get('.remove-file-button').trigger('click')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')[0][0].removedFileIds).toEqual([17])
  })

  it('수정 시 기존 배너를 삭제 대상으로 전달한다', async () => {
    const wrapper = mount(PortfolioForm, {
      props: {
        initialValue: {
          title: '프로젝트 제목',
          summary: '한 줄 요약',
          category: 'WEB_APP',
          bannerFileId: 21,
        },
        initialBannerUrl: 'https://example.com/banner.png',
      },
    })

    await wrapper.get('.selected-banner-row button').trigger('click')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')[0][0]).toMatchObject({
      bannerFileId: null,
      removedBannerFileId: 21,
    })
  })

  it('검증 실패 시 첫 오류 입력란에 포커스하고 오류를 접근성 속성으로 연결한다', async () => {
    const wrapper = mount(PortfolioForm, { attachTo: document.body })

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const titleInput = wrapper.get('#portfolio-title')
    const titleError = wrapper.get('#portfolio-title-error')
    expect(document.activeElement).toBe(titleInput.element)
    expect(titleInput.attributes('aria-invalid')).toBe('true')
    expect(titleInput.attributes('aria-describedby')).toBe('portfolio-title-error')
    expect(titleError.attributes('role')).toBe('alert')

    wrapper.unmount()
  })
})
