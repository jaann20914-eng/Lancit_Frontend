import httpClient from '@/shared/api/httpClient.js'

function unwrapResponse(response) {
  return response.data?.data ?? response.data
}

function asList(value) {
  return Array.isArray(value) ? value : []
}

export async function getCalendarCategories() {
  const response = await httpClient.get('/calendar/categories')
  return asList(unwrapResponse(response))
}

export async function createCalendarCategory({ categoryName, color }) {
  const response = await httpClient.post('/calendar/categories', { categoryName, color })
  return unwrapResponse(response)
}

export async function updateCalendarCategory(categoryId, { categoryName, color }) {
  const response = await httpClient.put(`/calendar/categories/${categoryId}`, {
    categoryName,
    color,
  })
  return unwrapResponse(response)
}

export async function deleteCalendarCategory(categoryId, moveToCategoryId = null) {
  const config = moveToCategoryId == null ? undefined : { params: { moveToCategoryId } }
  const response = await httpClient.delete(`/calendar/categories/${categoryId}`, config)
  return unwrapResponse(response)
}

export async function getCalendarTasks({ startDate, endDate, categoryId } = {}) {
  const params = {}

  if (startDate && endDate) {
    params.startDate = startDate
    params.endDate = endDate
  }
  if (categoryId != null) {
    params.categoryId = categoryId
  }

  const response = await httpClient.get('/calendar/tasks', { params })
  return asList(unwrapResponse(response))
}

export async function getCalendarHolidays(year) {
  const response = await httpClient.get('/holidays', { params: { year } })
  return asList(unwrapResponse(response))
}

export async function createCalendarTask(task) {
  const response = await httpClient.post('/calendar/tasks', task)
  return unwrapResponse(response)
}

export async function parseCalendarTask(sourceText) {
  const response = await httpClient.post(
    '/calendar/tasks/parse',
    { sourceText },
    { timeout: 30000 },
  )
  return unwrapResponse(response)
}

export async function updateCalendarTask(taskId, task) {
  const response = await httpClient.put(`/calendar/tasks/${taskId}`, task)
  return unwrapResponse(response)
}

export async function deleteCalendarTask(taskId) {
  const response = await httpClient.delete(`/calendar/tasks/${taskId}`)
  return unwrapResponse(response)
}
