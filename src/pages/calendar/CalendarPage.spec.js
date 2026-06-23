// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, beforeEach, vi } from 'vitest'

vi.mock('@fullcalendar/daygrid', () => ({ default: {} }))
vi.mock('@fullcalendar/timegrid', () => ({ default: {} }))
vi.mock('@fullcalendar/interaction', () => ({ default: {} }))
vi.mock('@fullcalendar/core/locales/ko', () => ({ default: {} }))

vi.mock('@fullcalendar/vue3', async () => {
  const { defineComponent, h, onMounted } = await vi.importActual('vue')

  return {
    default: defineComponent({
      name: 'FullCalendar',
      props: {
        options: {
          type: Object,
          required: true,
        },
      },
      setup(props, { expose }) {
        const initialRange = {
          start: new Date('2026-06-01T00:00:00'),
          end: new Date('2026-07-01T00:00:00'),
        }
        const nextRange = {
          start: new Date('2026-07-01T00:00:00'),
          end: new Date('2026-08-01T00:00:00'),
        }

        expose({
          getApi: () => ({
            getDate: () => new Date('2026-06-22T00:00:00'),
          }),
        })

        onMounted(() => {
          props.options.datesSet?.(initialRange)
        })

        return () => h('div', { 'data-test': 'full-calendar' }, [
          h(
            'button',
            {
              type: 'button',
              'data-test': 'calendar-change-range',
              onClick: () => props.options.datesSet?.(nextRange),
            },
            '날짜 변경',
          ),
        ])
      },
    }),
  }
})

vi.mock('@/features/calendar/api/calendarApi.js', () => ({
  createCalendarCategory: vi.fn(),
  createCalendarTask: vi.fn(),
  deleteCalendarCategory: vi.fn(),
  deleteCalendarTask: vi.fn(),
  getCalendarCategories: vi.fn(),
  getCalendarHolidays: vi.fn(),
  getCalendarTasks: vi.fn(),
  parseCalendarTask: vi.fn(),
  updateCalendarCategory: vi.fn(),
  updateCalendarTask: vi.fn(),
}))

vi.mock('@/features/calendar/api/calendarMapper.js', () => ({
  TASK_STATUS_OPTIONS: [
    { value: 'IN_PROGRESS', label: '진행중' },
    { value: 'COMPLETED', label: '완료' },
  ],
  UNKNOWN_CATEGORY_META: {
    key: 'unknown',
    label: '미분류',
    className: 'category-unknown',
    color: '#94a3b8',
  },
  hasUnknownCategory: vi.fn(() => false),
  mapCalendarCategories: vi.fn((categories = []) => categories.map((category) => ({
    key: String(category.categoryId),
    id: category.categoryId,
    categoryId: category.categoryId,
    label: category.categoryName,
    categoryName: category.categoryName,
    className: `category-${category.categoryId}`,
    color: category.color,
  }))),
  mapCalendarEvents: vi.fn((tasks = []) => tasks.map((task) => ({
    id: String(task.taskId),
    title: task.title,
    start: task.startAt,
    end: task.endAt,
    extendedProps: {
      sourceType: 'TASK',
      taskId: task.taskId,
      categoryKey: String(task.categoryId),
      categoryColor: task.color,
    },
  }))),
  mapHolidayEvents: vi.fn(() => []),
}))

vi.mock('@/features/calendar/ui/CalendarEventModal.vue', () => ({
  default: { name: 'CalendarEventModal', template: '<div data-test="event-modal" />' },
}))
vi.mock('@/features/calendar/ui/CalendarCategoryCreateModal.vue', () => ({
  default: { name: 'CalendarCategoryCreateModal', template: '<div data-test="category-create-modal" />' },
}))
vi.mock('@/features/calendar/ui/CalendarCategoryManageModal.vue', () => ({
  default: { name: 'CalendarCategoryManageModal', template: '<div data-test="category-manage-modal" />' },
}))
vi.mock('@/features/calendar/ui/CalendarConfirmModal.vue', () => ({
  default: { name: 'CalendarConfirmModal', template: '<div data-test="confirm-modal" />' },
}))

import CalendarPage from './CalendarPage.vue'
import {
  createCalendarTask,
  getCalendarCategories,
  getCalendarHolidays,
  getCalendarTasks,
  parseCalendarTask,
} from '@/features/calendar/api/calendarApi.js'

const sampleCategories = [
  { categoryId: 1, categoryName: '업무', color: '#4a6fa5' },
]

const sampleTasks = [
  {
    taskId: 10,
    title: '기획 회의',
    categoryId: 1,
    startAt: '2026-06-22T10:00:00',
    endAt: '2026-06-22T11:00:00',
  },
]

function apiError(message, status = 500) {
  return {
    response: {
      status,
      data: { message },
    },
  }
}

async function flushCalendarPage() {
  await flushPromises()
  await flushPromises()
}

function mountCalendarPage() {
  return mount(CalendarPage, {
    global: {
      stubs: {
        Teleport: true,
      },
    },
  })
}

async function openTaskCreateModal(wrapper) {
  await wrapper.get('.primary-action').trigger('click')
  await flushPromises()
}

async function parseAiText(wrapper, response) {
  parseCalendarTask.mockResolvedValueOnce(response)
  await wrapper.get('.ai-source-field textarea').setValue('내일 오후 2시 역삼역에서 점심식사')
  await wrapper.get('.parse-button').trigger('click')
  await flushPromises()
}

function getDateTimeInputs(wrapper) {
  return wrapper.findAll('input[type="datetime-local"]')
}

function getManualTextareas(wrapper) {
  return wrapper.findAll('.form-grid textarea')
}

describe('CalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getCalendarCategories.mockResolvedValue(sampleCategories)
    getCalendarTasks.mockResolvedValue(sampleTasks)
    getCalendarHolidays.mockResolvedValue([])
    createCalendarTask.mockResolvedValue({})
    parseCalendarTask.mockResolvedValue({})
  })

  it('카테고리 API만 실패하면 필터 영역에만 카테고리 오류를 표시한다', async () => {
    getCalendarCategories.mockRejectedValue(apiError('카테고리 서버 오류'))
    getCalendarTasks.mockResolvedValue(sampleTasks)

    const wrapper = mountCalendarPage()
    await flushCalendarPage()

    expect(wrapper.find('.filter-error').exists()).toBe(true)
    expect(wrapper.find('.filter-error').text()).toContain('카테고리를 불러오지 못했습니다.')
    expect(wrapper.find('.filter-error').text()).toContain('카테고리 서버 오류')
    expect(wrapper.find('.calendar-card .error-message').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('일정을 불러오지 못했습니다.')
  })

  it('일정 API만 실패하면 캘린더 영역에만 일정 오류를 표시한다', async () => {
    getCalendarCategories.mockResolvedValue(sampleCategories)
    getCalendarTasks.mockRejectedValue(apiError('일정 서버 오류'))

    const wrapper = mountCalendarPage()
    await flushCalendarPage()

    expect(wrapper.find('.filter-error').exists()).toBe(false)
    expect(wrapper.find('.calendar-card .error-message').exists()).toBe(true)
    expect(wrapper.find('.calendar-card .error-message').text()).toContain('일정을 불러오지 못했습니다.')
    expect(wrapper.find('.calendar-card .error-message').text()).toContain('일정 서버 오류')
    expect(wrapper.text()).not.toContain('카테고리를 불러오지 못했습니다.')
  })

  it('카테고리 실패와 일정 성공이 동시에 발생해도 카테고리 오류만 유지한다', async () => {
    getCalendarCategories.mockRejectedValue(apiError('카테고리 조회 실패'))
    getCalendarTasks.mockResolvedValue(sampleTasks)

    const wrapper = mountCalendarPage()
    await flushCalendarPage()

    expect(wrapper.find('.filter-error').text()).toContain('카테고리 조회 실패')
    expect(wrapper.find('.calendar-card .error-message').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('일정을 불러오지 못했습니다.')
  })

  it('날짜 변경 시 일정 오류만 초기화하고 카테고리 오류는 유지한다', async () => {
    getCalendarCategories.mockRejectedValue(apiError('카테고리 조회 실패'))
    getCalendarTasks
      .mockRejectedValueOnce(apiError('일정 조회 실패'))
      .mockResolvedValueOnce([])

    const wrapper = mountCalendarPage()
    await flushCalendarPage()

    expect(wrapper.find('.filter-error').text()).toContain('카테고리 조회 실패')
    expect(wrapper.find('.calendar-card .error-message').text()).toContain('일정 조회 실패')

    await wrapper.get('[data-test="calendar-change-range"]').trigger('click')
    await flushCalendarPage()

    expect(wrapper.find('.filter-error').exists()).toBe(true)
    expect(wrapper.find('.filter-error').text()).toContain('카테고리 조회 실패')
    expect(wrapper.find('.calendar-card .error-message').exists()).toBe(false)
    expect(getCalendarTasks).toHaveBeenCalledTimes(2)
  })

  it('전체 재시도 시 카테고리 성공과 일정 실패 상태를 독립적으로 반영한다', async () => {
    getCalendarCategories
      .mockRejectedValueOnce(apiError('카테고리 최초 실패'))
      .mockResolvedValueOnce(sampleCategories)
    getCalendarTasks
      .mockRejectedValueOnce(apiError('일정 최초 실패'))
      .mockRejectedValueOnce(apiError('일정 재시도 실패'))

    const wrapper = mountCalendarPage()
    await flushCalendarPage()

    expect(wrapper.find('.filter-error').text()).toContain('카테고리 최초 실패')
    expect(wrapper.find('.calendar-card .error-message').text()).toContain('일정 최초 실패')

    await wrapper.get('.calendar-card .error-message button').trigger('click')
    await flushCalendarPage()

    expect(wrapper.find('.filter-error').exists()).toBe(false)
    expect(wrapper.find('.category-filters').text()).toContain('업무')
    expect(wrapper.find('.calendar-card .error-message').text()).toContain('일정 재시도 실패')
    expect(getCalendarCategories).toHaveBeenCalledTimes(2)
    expect(getCalendarTasks).toHaveBeenCalledTimes(2)
  })

  it('전체 재시도 시 카테고리 실패와 일정 성공 상태를 독립적으로 반영한다', async () => {
    getCalendarCategories
      .mockRejectedValueOnce(apiError('카테고리 최초 실패'))
      .mockRejectedValueOnce(apiError('카테고리 재시도 실패'))
    getCalendarTasks
      .mockRejectedValueOnce(apiError('일정 최초 실패'))
      .mockResolvedValueOnce([])

    const wrapper = mountCalendarPage()
    await flushCalendarPage()

    expect(wrapper.find('.filter-error').text()).toContain('카테고리 최초 실패')
    expect(wrapper.find('.calendar-card .error-message').text()).toContain('일정 최초 실패')

    await wrapper.get('.calendar-card .error-message button').trigger('click')
    await flushCalendarPage()

    expect(wrapper.find('.filter-error').text()).toContain('카테고리 재시도 실패')
    expect(wrapper.find('.calendar-card .error-message').exists()).toBe(false)
    expect(wrapper.text()).toContain('표시할 일정이 없습니다.')
    expect(getCalendarCategories).toHaveBeenCalledTimes(2)
    expect(getCalendarTasks).toHaveBeenCalledTimes(2)
  })

  it('AI 파싱 결과에서 null 필드를 임의 기본값으로 채우지 않고 확인 필요 상태를 표시한다', async () => {
    const wrapper = mountCalendarPage()
    await flushCalendarPage()
    await openTaskCreateModal(wrapper)

    await getManualTextareas(wrapper)[0].setValue('기존 설명')
    await parseAiText(wrapper, {
      title: '점심식사',
      content: null,
      memo: '장소: 역삼역',
      startAt: '2026-06-24T14:00:00',
      endAt: null,
      requiresConfirmation: true,
      confidence: 0.8,
      warnings: ['종료 시간을 인식하지 못했습니다.'],
    })

    const dateTimeInputs = getDateTimeInputs(wrapper)
    const manualTextareas = getManualTextareas(wrapper)
    const parseResult = wrapper.get('.parse-result')

    expect(dateTimeInputs[0].element.value).toBe('2026-06-24T14:00')
    expect(dateTimeInputs[1].element.value).toBe('')
    expect(manualTextareas[0].element.value).toBe('')
    expect(manualTextareas[1].element.value).toBe('장소: 역삼역')
    expect(parseResult.text()).toContain('확인 필요')
    expect(parseResult.text()).toContain('신뢰도 80%')
    expect(parseResult.text()).toContain('확인할 내용')
    expect(parseResult.text()).toContain('종료 시간을 인식하지 못했습니다.')
    expect(parseResult.text()).toContain('시작 및 종료 일시를 확인해주세요.')
    expect(parseResult.text()).not.toContain('분석 완료')

    await wrapper.get('form').trigger('submit')

    expect(createCalendarTask).not.toHaveBeenCalled()
    expect(wrapper.get('.form-error').text()).toContain('시작 일시와 종료 일시를 확인해주세요.')
  })

  it('AI 파싱 결과에 시작과 종료 일시가 모두 있으면 경고가 있어도 저장할 수 있다', async () => {
    const wrapper = mountCalendarPage()
    await flushCalendarPage()
    await openTaskCreateModal(wrapper)

    await parseAiText(wrapper, {
      title: '킥오프 미팅',
      content: '프로젝트 범위 논의',
      memo: '장소: Zoom',
      startAt: '2026-06-24T14:00:00',
      endAt: '2026-06-24T15:00:00',
      requiresConfirmation: false,
      confidence: 0.95,
      warnings: ['참석자를 확인해주세요.'],
    })

    const dateTimeInputs = getDateTimeInputs(wrapper)
    const parseResult = wrapper.get('.parse-result')
    expect(dateTimeInputs[0].element.value).toBe('2026-06-24T14:00')
    expect(dateTimeInputs[1].element.value).toBe('2026-06-24T15:00')
    expect(parseResult.text()).toContain('확인 필요')
    expect(parseResult.text()).toContain('확인할 내용')
    expect(parseResult.text()).toContain('참석자를 확인해주세요.')
    expect(parseResult.text()).toContain('신뢰도 95%')
    expect(parseResult.text()).not.toContain('분석 완료')
    expect(parseResult.text()).not.toContain('시작 및 종료 일시를 확인해주세요.')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(createCalendarTask).toHaveBeenCalledWith(expect.objectContaining({
      categoryId: 1,
      title: '킥오프 미팅',
      status: 'IN_PROGRESS',
      startAt: '2026-06-24T14:00',
      endAt: '2026-06-24T15:00',
      content: '프로젝트 범위 논의',
      memo: '장소: Zoom',
    }))
    expect(wrapper.find('.form-error').exists()).toBe(false)
  })
})
