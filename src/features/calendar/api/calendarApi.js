import httpClient from '@/shared/api/httpClient.js'

function unwrapResponse(response) {
  return response.data?.data ?? response.data
}

function asList(value) {
  return Array.isArray(value) ? value : []
}

export async function getCalendarCategories() {
  const response = await httpClient.get('/api/calendar/categories')
  return asList(unwrapResponse(response))
}

export async function createCalendarCategory({ categoryName, color }) {
  const response = await httpClient.post('/api/calendar/categories', { categoryName, color })
  return unwrapResponse(response)
}

export async function updateCalendarCategory(categoryId, { categoryName, color }) {
  const response = await httpClient.put(`/api/calendar/categories/${categoryId}`, {
    categoryName,
    color,
  })
  return unwrapResponse(response)
}

export async function deleteCalendarCategory(categoryId, moveToCategoryId = null) {
  const config = moveToCategoryId == null ? undefined : { params: { moveToCategoryId } }
  const response = await httpClient.delete(`/api/calendar/categories/${categoryId}`, config)
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

  const response = await httpClient.get('/api/calendar/tasks', { params })
  return asList(unwrapResponse(response))
}

export async function getCalendarHolidays(year) {
  const response = await httpClient.get('/api/holidays', { params: { year } })
  return asList(unwrapResponse(response))
}

export async function createCalendarTask(task) {
  const response = await httpClient.post('/api/calendar/tasks', task)
  return unwrapResponse(response)
}

export async function parseCalendarTask(sourceText) {
  const response = await httpClient.post(
    '/api/calendar/tasks/parse',
    { sourceText },
    { timeout: 30000 },
  )
  return unwrapResponse(response)
}

export async function updateCalendarTask(taskId, task) {
  const response = await httpClient.put(`/api/calendar/tasks/${taskId}`, task)
  return unwrapResponse(response)
}

export async function deleteCalendarTask(taskId) {
  const response = await httpClient.delete(`/api/calendar/tasks/${taskId}`)
  return unwrapResponse(response)
}
