// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CalendarEventModal from './CalendarEventModal.vue'

const baseEvent = {
  taskId: 4,
  title: '회의',
  start: '2026-07-12T14:00:00',
  end: '2026-07-12T16:00:00',
  categoryLabel: '업무',
  categoryClassName: 'calendar-category-1',
  categoryColor: '#4A6FA5',
  statusLabel: '진행 중',
  statusClassName: 'calendar-status-in-progress',
  description: '2026년 7월 12일 14:00~16:00 회의 진행',
  memo: '장소: 회의실 A',
}

function mountModal(event = {}) {
  return mount(CalendarEventModal, {
    props: {
      event: {
        ...baseEvent,
        ...event,
      },
    },
    global: {
      stubs: {
        Teleport: true,
      },
    },
  })
}

describe('CalendarEventModal', () => {
  it('일반 캘린더 일정은 연결 대상 행을 표시하지 않고 설명과 메모는 유지한다', () => {
    const wrapper = mountModal()

    expect(wrapper.text()).not.toContain('연결 대상')
    expect(wrapper.text()).not.toContain('캘린더 일정 #4')
    expect(wrapper.text()).toContain('설명')
    expect(wrapper.text()).toContain('2026년 7월 12일 14:00~16:00 회의 진행')
    expect(wrapper.text()).toContain('메모')
    expect(wrapper.text()).toContain('장소: 회의실 A')
  })

  it('외부 연결 대상 라벨이 있으면 연결 대상 행을 표시한다', () => {
    const wrapper = mountModal({
      relatedTargetLabel: '계약 #12',
    })

    expect(wrapper.text()).toContain('연결 대상')
    expect(wrapper.text()).toContain('계약 #12')
  })

  it.each(['캘린더 일정 #4', '일정 #4', 'TASK #4'])(
    '내부 일정 ID 라벨 %s은 연결 대상으로 표시하지 않는다',
    (connectionTargetLabel) => {
      const wrapper = mountModal({
        connectionTargetLabel,
      })

      expect(wrapper.text()).not.toContain('연결 대상')
      expect(wrapper.text()).not.toContain(connectionTargetLabel)
    },
  )
})
