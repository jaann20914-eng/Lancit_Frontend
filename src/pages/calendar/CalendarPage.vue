<template>
  <main class="calendar-page">
    <header class="page-header">
      <div>
        <!-- <p class="page-eyebrow">SCHEDULE</p> -->
        <h1>일정 관리</h1>
        <p class="page-description">월간·주간·일간 보기를 전환하며 등록된 일정을 확인하세요.</p>
      </div>
      <div class="page-actions">
        <button
          class="page-action secondary-action"
          type="button"
          :disabled="isLoading"
          @click="openCategoryCreateModal"
        >
          <span aria-hidden="true">＋</span>
          카테고리 등록
        </button>
        <button
          class="page-action secondary-action"
          type="button"
          :disabled="isLoading || categories.length === 0"
          @click="openCategoryManageModal"
        >
          <span aria-hidden="true">⚙</span>
          카테고리 관리
        </button>
        <button
          class="page-action primary-action"
          type="button"
          :disabled="isLoading || categories.length === 0"
          :title="
            categories.length === 0 ? '일정을 등록하려면 카테고리를 먼저 등록해주세요.' : undefined
          "
          @click="openTaskCreateModal"
        >
          <span aria-hidden="true">＋</span>
          일정 등록
        </button>
      </div>
    </header>

    <div v-if="successMessage" class="success-message" role="status">
      <span>{{ successMessage }}</span>
      <button type="button" aria-label="성공 메시지 닫기" @click="successMessage = ''">×</button>
    </div>

    <section class="filter-card" aria-labelledby="calendar-filter-title">
      <div class="filter-heading">
        <div>
          <h2 id="calendar-filter-title">카테고리</h2>
        </div>
        <span class="event-count">{{ filteredEvents.length }}개 일정</span>
      </div>

      <div v-if="categoryLoadError" class="filter-error error-message" role="alert">
        <div>
          <strong>카테고리를 불러오지 못했습니다.</strong>
          <p>{{ categoryLoadError }}</p>
        </div>
        <button type="button" @click="loadCategories">다시 시도</button>
      </div>

      <div v-else-if="categoryOptions.length" class="category-filters">
        <button
          type="button"
          :class="['filter-chip', { active: selectedCategoryKeys.length === 0 }]"
          :aria-pressed="selectedCategoryKeys.length === 0"
          @click="clearCategorySelection"
        >
          전체
        </button>
        <button
          v-for="category in categoryOptions"
          :key="category.key"
          type="button"
          :class="['filter-chip', category.className, { active: isCategorySelected(category.key) }]"
          :style="category.color ? { '--calendar-category-color': category.color } : undefined"
          :aria-pressed="isCategorySelected(category.key)"
          @click="toggleCategory(category.key)"
        >
          <span class="category-dot" aria-hidden="true"></span>
          {{ category.label }}
        </button>
      </div>
      <p v-else-if="!categoriesLoading" class="no-categories">등록된 카테고리가 없습니다.</p>
    </section>

    <section class="calendar-card" aria-label="일정 캘린더">
      <div v-if="holidayError" class="holiday-warning" role="status">
        공휴일 정보를 불러오지 못해 등록된 일정만 표시합니다.
      </div>

      <div v-if="taskLoadError" class="calendar-message error-message" role="alert">
        <div>
          <strong>일정을 불러오지 못했습니다.</strong>
          <p>{{ taskLoadError }}</p>
        </div>
        <button type="button" @click="reloadCalendar">다시 시도</button>
      </div>

      <div v-else-if="tasksLoading" class="calendar-message loading-message" role="status">
        <span class="loading-spinner" aria-hidden="true"></span>
        캘린더 일정을 불러오는 중입니다.
      </div>

      <div v-else-if="filteredEvents.length === 0" class="calendar-message empty-message">
        <span class="empty-icon" aria-hidden="true">□</span>
        <div>
          <strong>표시할 일정이 없습니다.</strong>
          <p>
            {{
              selectedCategoryKeys.length === 0
                ? '현재 기간에 등록된 일정이 없습니다.'
                : '선택한 카테고리의 일정이 없습니다.'
            }}
          </p>
        </div>
      </div>

      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </section>

    <CalendarEventModal
      v-if="selectedEvent"
      :event="selectedEvent"
      @close="selectedEvent = null"
      @edit="openTaskEditModal"
      @delete="requestTaskDelete"
    />

    <CalendarCategoryCreateModal
      v-if="isCategoryCreateOpen"
      :submitting="categorySubmitting"
      :error="categoryCreateError"
      @close="closeCategoryCreateModal"
      @submit="handleCategoryCreate"
    />

    <CalendarTaskCreateModal
      v-if="isTaskCreateOpen"
      :categories="categories"
      :initial-date="taskInitialDate"
      :task="editingTask"
      :submitting="taskSubmitting"
      :error="taskCreateError"
      @close="closeTaskCreateModal"
      @submit="handleTaskCreate"
    />

    <CalendarCategoryManageModal
      v-if="isCategoryManageOpen"
      :categories="categories"
      :submitting="categoryManageSubmitting"
      :error="categoryManageError"
      @close="closeCategoryManageModal"
      @update="handleCategoryUpdate"
      @delete="handleCategoryDelete"
    />

    <CalendarConfirmModal
      v-if="taskPendingDelete"
      title="일정 삭제"
      :message="`'${taskPendingDelete.title}' 일정을 삭제합니다. 삭제한 일정은 복구할 수 없습니다.`"
      confirm-label="일정 삭제"
      :submitting="taskDeleteSubmitting"
      :error="taskDeleteError"
      @close="closeTaskDeleteModal"
      @confirm="handleTaskDelete"
    />
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import koLocale from '@fullcalendar/core/locales/ko'
import {
  createCalendarCategory,
  createCalendarTask,
  deleteCalendarCategory,
  deleteCalendarTask,
  getCalendarCategories,
  getCalendarHolidays,
  getCalendarTasks,
  updateCalendarCategory,
  updateCalendarTask,
} from '@/features/calendar/api/calendarApi.js'
import {
  hasUnknownCategory,
  mapCalendarCategories,
  mapCalendarEvents,
  mapHolidayEvents,
  UNKNOWN_CATEGORY_META,
} from '@/features/calendar/api/calendarMapper.js'
import CalendarEventModal from '@/features/calendar/ui/CalendarEventModal.vue'
import CalendarCategoryCreateModal from '@/features/calendar/ui/CalendarCategoryCreateModal.vue'
import CalendarTaskCreateModal from '@/features/calendar/ui/CalendarTaskCreateModal.vue'
import CalendarCategoryManageModal from '@/features/calendar/ui/CalendarCategoryManageModal.vue'
import CalendarConfirmModal from '@/features/calendar/ui/CalendarConfirmModal.vue'

const calendarRef = ref(null)
const rawCategories = ref([])
const rawTasks = ref([])
const rawHolidays = ref([])
const selectedCategoryKeys = ref([])
const selectedEvent = ref(null)
const isCategoryCreateOpen = ref(false)
const isCategoryManageOpen = ref(false)
const isTaskCreateOpen = ref(false)
const editingTask = ref(null)
const taskPendingDelete = ref(null)
const categorySubmitting = ref(false)
const categoryManageSubmitting = ref(false)
const taskSubmitting = ref(false)
const taskDeleteSubmitting = ref(false)
const categoryCreateError = ref('')
const categoryManageError = ref('')
const taskCreateError = ref('')
const taskDeleteError = ref('')
const successMessage = ref('')
const taskInitialDate = ref(new Date())
const categoriesLoading = ref(false)
const tasksLoading = ref(false)
const categoryLoadError = ref('')
const taskLoadError = ref('')
const holidayError = ref('')
const visibleRange = ref(null)
let taskRequestSequence = 0
let holidayRequestSequence = 0
const holidayCache = new Map()

const categories = computed(() => mapCalendarCategories(rawCategories.value))
const mappedEvents = computed(() => mapCalendarEvents(rawTasks.value, categories.value))
const holidayEvents = computed(() => mapHolidayEvents(rawHolidays.value))
const categoryOptions = computed(() =>
  hasUnknownCategory(mappedEvents.value)
    ? [...categories.value, UNKNOWN_CATEGORY_META]
    : categories.value,
)
const filteredEvents = computed(() => {
  if (selectedCategoryKeys.value.length === 0) return mappedEvents.value
  const selectedKeys = new Set(selectedCategoryKeys.value)
  return mappedEvents.value.filter((event) => selectedKeys.has(event.extendedProps.categoryKey))
})
const calendarEvents = computed(() => [...holidayEvents.value, ...filteredEvents.value])
const isLoading = computed(() => categoriesLoading.value || tasksLoading.value)

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  locale: koLocale,
  buttonText: {
    today: '오늘',
    month: '월',
    week: '주',
    day: '일',
  },
  events: calendarEvents.value,
  eventClick: handleEventClick,
  eventClassNames: ({ event }) =>
    event.extendedProps.sourceType === 'HOLIDAY'
      ? [
          'calendar-holiday-event',
          event.extendedProps.isHoliday
            ? 'calendar-holiday-official'
            : 'calendar-holiday-substitute',
        ]
      : [
          'calendar-category-event',
          event.extendedProps.categoryClassName || 'calendar-category-unknown',
        ],
  eventDidMount: ({ el, event }) => {
    const color = event.extendedProps.categoryColor
    if (color) el.style.setProperty('--calendar-category-color', color)
  },
  datesSet: handleDatesSet,
  dayMaxEvents: true,
  nowIndicator: true,
  navLinks: true,
  height: 'auto',
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
}))

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toInclusiveRange({ start, end }) {
  const inclusiveEnd = new Date(end)
  inclusiveEnd.setDate(inclusiveEnd.getDate() - 1)
  return {
    startDate: formatLocalDate(start),
    endDate: formatLocalDate(inclusiveEnd),
  }
}

function getErrorMessage(error) {
  const status = error?.response?.status
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  if (status === 403) return '캘린더를 조회할 권한이 없습니다.'
  if (status === 404) return '캘린더 API를 찾을 수 없습니다.'
  return error?.response?.data?.message || '잠시 후 다시 시도해주세요.'
}

function getMutationErrorMessage(error, fallbackMessage) {
  const status = error?.response?.status
  if (status === 400) return error?.response?.data?.message || '입력값을 확인해주세요.'
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  if (status === 403) return '요청을 처리할 권한이 없습니다.'
  if (status === 404) return '요청한 일정 또는 카테고리를 찾을 수 없습니다.'
  return error?.response?.data?.message || fallbackMessage
}

async function loadCategories() {
  categoriesLoading.value = true
  categoryLoadError.value = ''

  try {
    rawCategories.value = await getCalendarCategories()
  } catch (error) {
    categoryLoadError.value = getErrorMessage(error)
  } finally {
    categoriesLoading.value = false
  }
}

async function loadTasks(range) {
  if (!range) return
  const sequence = ++taskRequestSequence
  tasksLoading.value = true
  taskLoadError.value = ''

  try {
    const tasks = await getCalendarTasks(toInclusiveRange(range))
    if (sequence === taskRequestSequence) rawTasks.value = tasks
  } catch (error) {
    if (sequence === taskRequestSequence) taskLoadError.value = getErrorMessage(error)
  } finally {
    if (sequence === taskRequestSequence) tasksLoading.value = false
  }
}

function getYearsInRange({ start, end }) {
  const inclusiveEnd = new Date(end)
  inclusiveEnd.setDate(inclusiveEnd.getDate() - 1)
  const years = []

  for (let year = start.getFullYear(); year <= inclusiveEnd.getFullYear(); year += 1) {
    years.push(year)
  }
  return years
}

async function loadHolidays(range, force = false) {
  if (!range) return
  const sequence = ++holidayRequestSequence
  const years = getYearsInRange(range)
  holidayError.value = ''

  try {
    const holidayGroups = await Promise.all(
      years.map(async (year) => {
        if (!force && holidayCache.has(year)) return holidayCache.get(year)

        const holidays = await getCalendarHolidays(year)
        holidayCache.set(year, holidays)
        return holidays
      }),
    )
    if (sequence === holidayRequestSequence) rawHolidays.value = holidayGroups.flat()
  } catch {
    if (sequence === holidayRequestSequence) {
      rawHolidays.value = []
      holidayError.value = '공휴일 API 조회 실패'
    }
  }
}

function handleDatesSet(info) {
  visibleRange.value = { start: info.start, end: info.end }
  taskLoadError.value = ''
  loadTasks(visibleRange.value)
  loadHolidays(visibleRange.value)
}

function handleEventClick({ event }) {
  if (event.extendedProps.sourceType === 'HOLIDAY') return

  selectedEvent.value = {
    title: event.title,
    start: event.start,
    end: event.end,
    ...event.extendedProps,
  }
}

function isCategorySelected(categoryKey) {
  return selectedCategoryKeys.value.includes(categoryKey)
}

function toggleCategory(categoryKey) {
  selectedCategoryKeys.value = isCategorySelected(categoryKey)
    ? selectedCategoryKeys.value.filter((key) => key !== categoryKey)
    : [...selectedCategoryKeys.value, categoryKey]
}

function clearCategorySelection() {
  selectedCategoryKeys.value = []
}

function openCategoryCreateModal() {
  categoryCreateError.value = ''
  isCategoryCreateOpen.value = true
}

function closeCategoryCreateModal() {
  if (categorySubmitting.value) return
  categoryCreateError.value = ''
  isCategoryCreateOpen.value = false
}

function openTaskCreateModal() {
  if (!categories.value.length) return
  taskCreateError.value = ''
  editingTask.value = null
  taskInitialDate.value = calendarRef.value?.getApi()?.getDate() || new Date()
  isTaskCreateOpen.value = true
}

function openTaskEditModal(event) {
  selectedEvent.value = null
  taskCreateError.value = ''
  editingTask.value = event
  taskInitialDate.value = event.start || new Date()
  isTaskCreateOpen.value = true
}

function closeTaskCreateModal() {
  if (taskSubmitting.value) return
  taskCreateError.value = ''
  isTaskCreateOpen.value = false
  editingTask.value = null
}

async function handleCategoryCreate(payload) {
  categorySubmitting.value = true
  categoryCreateError.value = ''

  try {
    await createCalendarCategory(payload)
    await loadCategories()
    isCategoryCreateOpen.value = false
    successMessage.value = `'${payload.categoryName}' 카테고리가 등록되었습니다.`
  } catch (error) {
    categoryCreateError.value = getMutationErrorMessage(
      error,
      '카테고리 등록에 실패했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    categorySubmitting.value = false
  }
}

async function handleTaskCreate(payload) {
  taskSubmitting.value = true
  taskCreateError.value = ''

  try {
    const isEditing = editingTask.value?.taskId != null
    if (isEditing) {
      await updateCalendarTask(editingTask.value.taskId, payload)
    } else {
      await createCalendarTask(payload)
    }
    clearCategorySelection()
    await loadTasks(visibleRange.value)
    isTaskCreateOpen.value = false
    editingTask.value = null
    successMessage.value = `'${payload.title}' 일정이 ${isEditing ? '수정' : '등록'}되었습니다.`
  } catch (error) {
    taskCreateError.value = getMutationErrorMessage(
      error,
      '일정 저장에 실패했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    taskSubmitting.value = false
  }
}

function openCategoryManageModal() {
  if (!categories.value.length) return
  categoryManageError.value = ''
  isCategoryManageOpen.value = true
}

function closeCategoryManageModal() {
  if (categoryManageSubmitting.value) return
  categoryManageError.value = ''
  isCategoryManageOpen.value = false
}

async function handleCategoryUpdate({ categoryId, categoryName, color }) {
  categoryManageSubmitting.value = true
  categoryManageError.value = ''

  try {
    await updateCalendarCategory(categoryId, { categoryName, color })
    await loadCategories()
    isCategoryManageOpen.value = false
    successMessage.value = `'${categoryName}' 카테고리가 수정되었습니다.`
  } catch (error) {
    categoryManageError.value = getMutationErrorMessage(
      error,
      '카테고리 수정에 실패했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    categoryManageSubmitting.value = false
  }
}

async function handleCategoryDelete({ categoryId, categoryName, moveToCategoryId }) {
  categoryManageSubmitting.value = true
  categoryManageError.value = ''

  try {
    await deleteCalendarCategory(categoryId, moveToCategoryId)
    selectedCategoryKeys.value = selectedCategoryKeys.value.filter(
      (key) => key !== String(categoryId),
    )
    await Promise.all([loadCategories(), loadTasks(visibleRange.value)])
    isCategoryManageOpen.value = false
    successMessage.value = `'${categoryName}' 카테고리가 삭제되었습니다.`
  } catch (error) {
    const backendMessage = getMutationErrorMessage(
      error,
      '카테고리 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.',
    )
    categoryManageError.value =
      !moveToCategoryId && error?.response?.status === 400
        ? '연결된 일정이 있어 삭제할 수 없습니다. 이동 대상 카테고리를 먼저 등록해주세요.'
        : backendMessage
  } finally {
    categoryManageSubmitting.value = false
  }
}

function requestTaskDelete(event) {
  selectedEvent.value = null
  taskDeleteError.value = ''
  taskPendingDelete.value = event
}

function closeTaskDeleteModal() {
  if (taskDeleteSubmitting.value) return
  taskDeleteError.value = ''
  taskPendingDelete.value = null
}

async function handleTaskDelete() {
  if (taskPendingDelete.value?.taskId == null) return
  taskDeleteSubmitting.value = true
  taskDeleteError.value = ''

  try {
    const deletedTitle = taskPendingDelete.value.title
    await deleteCalendarTask(taskPendingDelete.value.taskId)
    await loadTasks(visibleRange.value)
    taskPendingDelete.value = null
    successMessage.value = `'${deletedTitle}' 일정이 삭제되었습니다.`
  } catch (error) {
    taskDeleteError.value = getMutationErrorMessage(
      error,
      '일정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    taskDeleteSubmitting.value = false
  }
}

async function reloadCalendar() {
  categoryLoadError.value = ''
  taskLoadError.value = ''
  holidayError.value = ''

  await Promise.all([
    loadCategories(),
    loadTasks(visibleRange.value),
    loadHolidays(visibleRange.value, true),
  ])
}

onMounted(loadCategories)
</script>

<style scoped>
.calendar-page {
  min-height: 100vh;
  padding: 38px 32px 48px;
  color: #1f2937;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.page-eyebrow {
  margin: 0 0 7px;
  color: #4a6fa5;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.page-header h1 {
  margin: 0;
  color: #1a233d;
  font-size: 28px;
  line-height: 1.25;
}

.page-description {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.page-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.page-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 40px;
  padding: 0 15px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.page-action:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}
.secondary-action {
  border: 1px solid #d7dce4;
  background: #ffffff;
  color: #334155;
}
.secondary-action:hover:not(:disabled) {
  border-color: #1a233d;
  color: #1a233d;
}
.primary-action {
  border: 1px solid #1a233d;
  background: #1a233d;
  color: #ffffff;
}
.primary-action:hover:not(:disabled) {
  background: #283554;
}

.success-message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding: 12px 15px;
  border: 1px solid #bbf7d0;
  border-radius: 9px;
  background: #f0fdf4;
  color: #166534;
  font-size: 13px;
  font-weight: 600;
}

.success-message button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #15803d;
  font-size: 20px;
  cursor: pointer;
}

.filter-card,
.calendar-card {
  border: 1px solid #e2e6ec;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.filter-card {
  margin-bottom: 18px;
  padding: 20px 22px;
}

.filter-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 15px;
}

.filter-heading h2 {
  margin: 0;
  color: #1a233d;
  font-size: 15px;
}

.filter-heading p,
.no-categories {
  margin: 5px 0 0;
  color: #7b8798;
  font-size: 12px;
}

.event-count {
  flex-shrink: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #dce1e8;
  border-radius: 999px;
  background: #ffffff;
  color: #536074;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s,
    color 0.15s;
}

.filter-chip:hover {
  border-color: var(--calendar-category-color, #94a3b8);
}
.filter-chip.active {
  border-color: #1a233d;
  background: #1a233d;
  color: #ffffff;
}

.category-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--calendar-category-color, #64748b);
}

.filter-chip.active .category-dot {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35);
}

.calendar-card {
  position: relative;
  padding: 24px;
  overflow: hidden;
}

.calendar-message {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: 9px;
  font-size: 13px;
}

.filter-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 9px;
  font-size: 13px;
}

.filter-error strong {
  display: block;
}
.filter-error p {
  margin: 3px 0 0;
}

.holiday-warning {
  margin-bottom: 14px;
  padding: 10px 13px;
  border: 1px solid #fde68a;
  border-radius: 8px;
  background: #fffbeb;
  color: #92400e;
  font-size: 12px;
}

.calendar-message strong {
  display: block;
  color: #334155;
}
.calendar-message p {
  margin: 3px 0 0;
  color: #64748b;
}
.loading-message,
.empty-message {
  background: #f6f8fb;
  color: #64748b;
}
.error-message {
  justify-content: space-between;
  background: #fff1f2;
  color: #991b1b;
}
.error-message strong,
.error-message p {
  color: #991b1b;
}
.error-message button {
  padding: 7px 11px;
  border: 1px solid #fecdd3;
  border-radius: 7px;
  background: #ffffff;
  color: #9f1239;
  font-weight: 600;
  cursor: pointer;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #dbe2ea;
  border-top-color: #1a233d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-icon {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid #dbe2ea;
  border-radius: 8px;
  color: #94a3b8;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.calendar-card :deep(.fc) {
  --fc-border-color: #e4e8ee;
  --fc-button-bg-color: #1a233d;
  --fc-button-border-color: #1a233d;
  --fc-button-hover-bg-color: #283554;
  --fc-button-hover-border-color: #283554;
  --fc-button-active-bg-color: #4a6fa5;
  --fc-button-active-border-color: #4a6fa5;
  --fc-today-bg-color: #f5f8fc;
  font-family: inherit;
}

.calendar-card :deep(.fc .fc-toolbar) {
  gap: 14px;
  margin-bottom: 22px;
}
.calendar-card :deep(.fc .fc-toolbar-title) {
  color: #1a233d;
  font-size: 21px;
}
.calendar-card :deep(.fc .fc-button) {
  border-radius: 7px;
  box-shadow: none;
  font-size: 12px;
  font-weight: 600;
}
.calendar-card :deep(.fc .fc-col-header-cell-cushion) {
  padding: 11px 4px;
  color: #475569;
  font-size: 12px;
  text-decoration: none;
}
.calendar-card :deep(.fc .fc-daygrid-day-number) {
  padding: 8px;
  color: #475569;
  font-size: 12px;
  text-decoration: none;
}
.calendar-card :deep(.fc .fc-day-sun .fc-daygrid-day-number) {
  color: #dc2626;
}
.calendar-card :deep(.fc .fc-day-sat .fc-daygrid-day-number) {
  color: #2563eb;
}
.calendar-card :deep(.fc .fc-daygrid-day:has(.calendar-holiday-event) .fc-daygrid-day-number) {
  color: #dc2626;
}
.calendar-card :deep(.fc .calendar-category-event) {
  border-color: var(--calendar-category-color, #64748b);
  background-color: var(--calendar-category-color, #64748b);
  cursor: pointer;
}
.calendar-card :deep(.fc .calendar-category-event:hover) {
  filter: brightness(0.92);
}
.calendar-card :deep(.fc .calendar-holiday-event) {
  --fc-event-text-color: #dc2626;
  border-color: transparent;
  background: transparent;
  color: #dc2626;
  cursor: default;
  font-size: 12px;
  text-align: right;
}
.calendar-card :deep(.fc .calendar-holiday-substitute) {
  border-color: transparent;
  background: transparent;
  color: #dc2626;
}
.calendar-card :deep(.fc .fc-event-title) {
  font-weight: 600;
}
.calendar-card :deep(.fc .calendar-holiday-event .fc-event-title) {
  font-weight: 400;
}
.calendar-card :deep(.fc .fc-day-other .calendar-holiday-event) {
  opacity: 0.3;
}

@media (max-width: 980px) {
  .calendar-page {
    padding: 30px 24px 44px;
  }
  .calendar-card :deep(.fc .fc-toolbar) {
    align-items: stretch;
    flex-direction: column;
  }
  .calendar-card :deep(.fc .fc-toolbar-chunk) {
    display: flex;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .calendar-page {
    padding: 24px 14px 36px;
  }
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .page-actions {
    display: grid;
    width: 100%;
    grid-template-columns: 1fr 1fr;
  }
  .page-action {
    justify-content: center;
    padding: 0 10px;
  }
  .page-action:first-child {
    grid-column: 1 / -1;
  }
  .filter-heading {
    flex-direction: column;
    gap: 8px;
  }
  .calendar-card {
    padding: 14px;
  }
  .filter-error {
    align-items: flex-start;
    flex-direction: column;
  }
  .error-message {
    align-items: flex-start;
    flex-direction: column;
  }
  .calendar-card :deep(.fc .fc-toolbar-title) {
    font-size: 18px;
  }
  .calendar-card :deep(.fc .fc-button) {
    padding: 0.35em 0.5em;
  }
}
</style>
