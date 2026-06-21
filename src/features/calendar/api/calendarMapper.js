const UNKNOWN_CATEGORY_KEY = 'UNKNOWN'
const UNKNOWN_CATEGORY_META = Object.freeze({
  key: UNKNOWN_CATEGORY_KEY,
  id: null,
  label: '미분류',
  color: null,
  className: 'calendar-category-unknown',
})

const TASK_STATUS_META = Object.freeze({
  IN_PROGRESS: { label: '진행 중', className: 'calendar-status-in-progress' },
  COMPLETED: { label: '완료', className: 'calendar-status-completed' },
  CANCELLED: { label: '취소', className: 'calendar-status-cancelled' },
})

const TASK_STATUS_OPTIONS = Object.freeze(
  Object.entries(TASK_STATUS_META).map(([value, meta]) => Object.freeze({
    value,
    label: meta.label,
  })),
)

function isValidHexColor(value) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
}

function normalizeCategoryId(value) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function isValidDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value))
}

function isValidLocalDate(value) {
  if (typeof value !== 'string') return false
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return false

  const [, year, month, day] = match.map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
}

export function mapCalendarCategories(categoryDtos) {
  if (!Array.isArray(categoryDtos)) return []

  const seen = new Set()
  return categoryDtos.flatMap((dto) => {
    const id = normalizeCategoryId(dto?.categoryId)
    if (id == null || seen.has(id)) return []

    seen.add(id)
    return [{
      key: String(id),
      id,
      label: String(dto?.categoryName || '').trim() || `카테고리 ${id}`,
      color: isValidHexColor(dto?.color) ? dto.color : null,
      className: `calendar-category-${id}`,
    }]
  })
}

export function getTaskStatusMeta(status) {
  const value = typeof status === 'string' ? status.trim().toUpperCase() : ''
  return {
    value: value || 'UNKNOWN',
    ...(TASK_STATUS_META[value] || {
      label: value || '상태 미정',
      className: 'calendar-status-unknown',
    }),
  }
}

export function mapCalendarEvents(taskDtos, categories = []) {
  if (!Array.isArray(taskDtos)) return []

  const categoryById = new Map(categories.map((category) => [category.id, category]))

  return taskDtos.flatMap((task, index) => {
    if (!isValidDateTime(task?.startAt) || !isValidDateTime(task?.endAt)) return []

    const categoryId = normalizeCategoryId(task?.categoryId)
    const category = categoryById.get(categoryId) || UNKNOWN_CATEGORY_META
    const taskId = task?.taskId ?? `unidentified-${index}`
    const statusMeta = getTaskStatusMeta(task?.status)
    const title = String(task?.title || '').trim() || '제목 없는 일정'

    return [{
      id: `calendar-task:${category.key}:${taskId}:period:${task.startAt}`,
      title,
      start: task.startAt,
      end: task.endAt,
      classNames: ['calendar-category-event', category.className],
      extendedProps: {
        taskId: task?.taskId ?? null,
        categoryKey: category.key,
        categoryId: category.id,
        categoryLabel: category.label,
        categoryColor: category.color,
        categoryClassName: category.className,
        status: statusMeta.value,
        statusLabel: statusMeta.label,
        statusClassName: statusMeta.className,
        description: task?.content ?? null,
        memo: task?.memo ?? null,
        clientCompany: task?.clientCompany ?? null,
        budget: task?.budget ?? null,
        paidAt: task?.paidAt ?? null,
        autoRegistered: Boolean(task?.autoRegistered),
        autoRegisteredSource: task?.autoRegisteredSource ?? null,
        ownerType: task?.ownerType ?? null,
      },
    }]
  })
}

export function mapHolidayEvents(holidayDtos) {
  if (!Array.isArray(holidayDtos)) return []

  return holidayDtos.flatMap((holiday, index) => {
    if (!isValidLocalDate(holiday?.date)) return []

    const title = String(holiday?.name || '').trim() || '공휴일'
    const holidayId = holiday?.id ?? `unidentified-${index}`
    const isHoliday = holiday?.isHoliday !== false

    return [{
      id: `holiday:${holidayId}:${holiday.date}`,
      title,
      start: holiday.date,
      allDay: true,
      editable: false,
      classNames: [
        'calendar-holiday-event',
        isHoliday ? 'calendar-holiday-official' : 'calendar-holiday-substitute',
      ],
      extendedProps: {
        sourceType: 'HOLIDAY',
        holidayId: holiday?.id ?? null,
        isHoliday,
        holidayTypeLabel: isHoliday ? '공휴일' : '대체공휴일',
      },
    }]
  })
}

export function hasUnknownCategory(events) {
  return events.some((event) => event.extendedProps?.categoryKey === UNKNOWN_CATEGORY_KEY)
}

export { TASK_STATUS_OPTIONS, UNKNOWN_CATEGORY_KEY, UNKNOWN_CATEGORY_META }
