import { describe, expect, it } from 'vitest'
import { mapTaskParseResponse } from './calendarParseMapper.js'

describe('calendarParseMapper', () => {
  it('백엔드가 확정한 DATE_TIME과 일정 필드를 직접 입력 폼 값으로 변환한다', () => {
    const result = mapTaskParseResponse({
      title: '팀 회의',
      content: '스프린트 리뷰',
      memo: '장소: 회의실 A',
      status: 'IN_PROGRESS',
      startAt: '2026-06-22T15:00:00',
      startPrecision: 'DATE_TIME',
      endAt: '2026-06-22T16:00:00',
      endPrecision: 'DATE_TIME',
      clientCompany: '랜싯',
      budget: 500000,
      confidence: 0.91,
      warnings: [],
    })

    expect(result.patch).toMatchObject({
      title: '팀 회의',
      startAt: '2026-06-22T15:00',
      endAt: '2026-06-22T16:00',
      budget: 500000,
    })
    expect(result.confidence).toBe(91)
  })

  it('날짜만 또는 시간만 인식된 값으로 임의 LocalDateTime을 만들지 않는다', () => {
    const result = mapTaskParseResponse({
      title: '계약 미팅',
      startDate: '2026-07-01',
      startText: '7월 1일',
      startPrecision: 'DATE_ONLY',
      endTime: '17:00:00',
      endText: '오후 5시',
      endPrecision: 'TIME_ONLY',
    })

    expect(result.patch.startAt).toBe('')
    expect(result.patch.endAt).toBe('')
    expect(result.details.start).toEqual({ precision: 'DATE_ONLY', value: '7월 1일' })
  })

  it('raw 파싱 응답의 null 값을 임의 기본값으로 대체하지 않는다', () => {
    const result = mapTaskParseResponse({
      title: '점심식사',
      content: null,
      memo: '장소: 역삼역',
      startAt: '2026-06-24T14:00:00',
      endAt: null,
      requiresConfirmation: true,
      confidence: 0.8,
      warnings: ['종료 시간을 인식하지 못했습니다.'],
    })

    expect(result.patch).toMatchObject({
      title: '점심식사',
      content: '',
      memo: '장소: 역삼역',
      startAt: '2026-06-24T14:00',
      endAt: '',
    })
    expect(result.confidence).toBe(80)
    expect(result.requiresConfirmation).toBe(true)
    expect(result.warnings).toEqual(['종료 시간을 인식하지 못했습니다.'])

    const missingStart = mapTaskParseResponse({
      title: '종료만 인식된 일정',
      startAt: null,
      endAt: '2026-06-24T15:00:00',
    })

    expect(missingStart.patch.startAt).toBe('')
    expect(missingStart.patch.endAt).toBe('2026-06-24T15:00')
  })

  it('precision 필드가 없어도 startAt과 endAt이 있으면 폼 값으로 변환한다', () => {
    const result = mapTaskParseResponse({
      title: '킥오프',
      startAt: '2026-06-24T14:00:00',
      endAt: '2026-06-24T15:00:00',
    })

    expect(result.patch.startAt).toBe('2026-06-24T14:00')
    expect(result.patch.endAt).toBe('2026-06-24T15:00')
  })

  it('백엔드 categoryId는 직접 입력 폼에 자동 적용하지 않는다', () => {
    const result = mapTaskParseResponse({
      categoryId: 99,
      title: '일정',
      startPrecision: 'NONE',
      endPrecision: 'NONE',
    })

    expect(result.patch).not.toHaveProperty('categoryId')
  })
})
