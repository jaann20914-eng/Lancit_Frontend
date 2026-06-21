import { describe, expect, it } from 'vitest'
import {
  mapCalendarCategories,
  mapCalendarEvents,
  mapHolidayEvents,
  UNKNOWN_CATEGORY_KEY,
} from './calendarMapper.js'

describe('calendarMapper', () => {
  const categories = mapCalendarCategories([
    { categoryId: 7, categoryName: '고객 일정', color: '#3366AA' },
  ])

  it('백엔드 카테고리를 일정 메타데이터와 FullCalendar 필드로 조인한다', () => {
    const [event] = mapCalendarEvents([
      {
        taskId: 11,
        categoryId: 7,
        title: '검토 회의',
        status: 'IN_PROGRESS',
        startAt: '2026-06-21T10:00:00',
        endAt: '2026-06-21T11:00:00',
      },
    ], categories)

    expect(event.title).toBe('검토 회의')
    expect(event.extendedProps.categoryLabel).toBe('고객 일정')
    expect(event.extendedProps.categoryColor).toBe('#3366AA')
    expect(event.extendedProps.statusLabel).toBe('진행 중')
  })

  it('시작일 또는 종료일이 유효하지 않은 일정은 만들지 않는다', () => {
    expect(mapCalendarEvents([{ taskId: 1, startAt: null, endAt: '2026-06-21T11:00:00' }], categories)).toEqual([])
    expect(mapCalendarEvents([{ taskId: 2, startAt: '2026-06-21T10:00:00', endAt: null }], categories)).toEqual([])
  })

  it('카테고리 목록에 없는 categoryId는 안전한 미분류로 처리한다', () => {
    const [event] = mapCalendarEvents([
      {
        taskId: 12,
        categoryId: 999,
        title: '',
        status: 'NEW_STATUS',
        startAt: '2026-06-22T10:00:00',
        endAt: '2026-06-22T11:00:00',
      },
    ], categories)

    expect(event.title).toBe('제목 없는 일정')
    expect(event.extendedProps.categoryKey).toBe(UNKNOWN_CATEGORY_KEY)
    expect(event.extendedProps.statusLabel).toBe('NEW_STATUS')
  })

  it('백엔드 공휴일 응답을 수정할 수 없는 종일 이벤트로 변환한다', () => {
    const events = mapHolidayEvents([
      { id: 21, date: '2026-01-01', name: '신정', year: 2026, isHoliday: true },
      { id: 22, date: '2026-03-02', name: '삼일절 대체공휴일', year: 2026, isHoliday: false },
    ])

    expect(events).toHaveLength(2)
    expect(events[0]).toMatchObject({
      id: 'holiday:21:2026-01-01',
      title: '신정',
      start: '2026-01-01',
      allDay: true,
      editable: false,
    })
    expect(events[0].extendedProps).toMatchObject({
      sourceType: 'HOLIDAY',
      isHoliday: true,
      holidayTypeLabel: '공휴일',
    })
    expect(events[1].extendedProps.holidayTypeLabel).toBe('대체공휴일')
  })

  it('날짜가 없거나 유효하지 않은 공휴일은 이벤트로 만들지 않는다', () => {
    expect(mapHolidayEvents([
      { id: 1, date: null, name: '날짜 없음' },
      { id: 2, date: '2026-02-31', name: '잘못된 날짜' },
    ])).toEqual([])
  })
})
