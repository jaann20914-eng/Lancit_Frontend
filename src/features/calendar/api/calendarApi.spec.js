import { beforeEach, describe, expect, it, vi } from 'vitest'
import httpClient from '@/shared/api/httpClient.js'
import {
  createCalendarCategory,
  createCalendarTask,
  deleteCalendarCategory,
  deleteCalendarTask,
  getCalendarHolidays,
  parseCalendarTask,
  updateCalendarCategory,
  updateCalendarTask,
} from './calendarApi.js'

vi.mock('@/shared/api/httpClient.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('calendarApi create requests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    httpClient.post.mockResolvedValue({ data: { success: true, message: 'OK', data: null } })
    httpClient.put.mockResolvedValue({ data: { success: true, message: 'OK', data: null } })
    httpClient.delete.mockResolvedValue({ data: { success: true, message: 'OK', data: null } })
  })

  it('연도를 백엔드 공휴일 API의 조회 파라미터로 전달한다', async () => {
    httpClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: [{ id: 1, date: '2026-01-01', name: '신정' }] },
    })

    const result = await getCalendarHolidays(2026)

    expect(httpClient.get).toHaveBeenCalledWith('/api/holidays', { params: { year: 2026 } })
    expect(result).toEqual([{ id: 1, date: '2026-01-01', name: '신정' }])
  })

  it('카테고리 등록 DTO만 백엔드에 전달한다', async () => {
    await createCalendarCategory({ categoryName: '고객 미팅', color: '#4A6FA5' })

    expect(httpClient.post).toHaveBeenCalledWith('/api/calendar/categories', {
      categoryName: '고객 미팅',
      color: '#4A6FA5',
    })
  })

  it('일정 등록 DTO를 백엔드 일정 API에 전달한다', async () => {
    const task = {
      categoryId: 1,
      title: '일정 등록 테스트',
      status: 'IN_PROGRESS',
      startAt: '2026-06-21T10:00',
      endAt: '2026-06-21T11:00',
    }

    await createCalendarTask(task)

    expect(httpClient.post).toHaveBeenCalledWith('/api/calendar/tasks', task)
  })

  it('자연어 원문을 백엔드 일정 파싱 API에 전달한다', async () => {
    httpClient.post.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: { title: '팀 회의' } },
    })

    const result = await parseCalendarTask('내일 오후 3시 팀 회의')

    expect(httpClient.post).toHaveBeenCalledWith(
      '/api/calendar/tasks/parse',
      { sourceText: '내일 오후 3시 팀 회의' },
      { timeout: 30000 },
    )
    expect(result).toEqual({ title: '팀 회의' })
  })

  it('카테고리 수정과 일정 이동을 포함한 삭제 API를 호출한다', async () => {
    await updateCalendarCategory(3, { categoryName: '수정됨', color: '#123456' })
    await deleteCalendarCategory(3, 5)

    expect(httpClient.put).toHaveBeenCalledWith('/api/calendar/categories/3', {
      categoryName: '수정됨',
      color: '#123456',
    })
    expect(httpClient.delete).toHaveBeenCalledWith('/api/calendar/categories/3', {
      params: { moveToCategoryId: 5 },
    })
  })

  it('일정 수정과 삭제 API를 호출한다', async () => {
    const task = { title: '수정 일정', startAt: '2026-06-22T10:00', endAt: '2026-06-22T11:00' }

    await updateCalendarTask(8, task)
    await deleteCalendarTask(8)

    expect(httpClient.put).toHaveBeenCalledWith('/api/calendar/tasks/8', task)
    expect(httpClient.delete).toHaveBeenCalledWith('/api/calendar/tasks/8')
  })
})
