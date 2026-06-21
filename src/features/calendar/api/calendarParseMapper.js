import { TASK_STATUS_OPTIONS } from './calendarMapper.js'

const VALID_TASK_STATUSES = new Set(TASK_STATUS_OPTIONS.map((status) => status.value))

function hasText(value) {
  return typeof value === 'string' && value.trim() !== ''
}

function toDateTimeInput(value) {
  if (!hasText(value)) return ''
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  return match ? `${match[1]}T${match[2]}` : ''
}

function toOptionalText(value) {
  return hasText(value) ? value.trim() : ''
}

function formatDateDetail(prefix, dto) {
  const precision = dto?.[`${prefix}Precision`] || 'NONE'
  const at = dto?.[`${prefix}At`]
  const date = dto?.[`${prefix}Date`]
  const time = dto?.[`${prefix}Time`]
  const text = dto?.[`${prefix}Text`]

  let value = text || at || ''
  if (!value && date) value = time ? `${date} ${time}` : date
  if (!value && time) value = time

  return { precision, value }
}

export function mapTaskParseResponse(dto) {
  const status = VALID_TASK_STATUSES.has(dto?.status) ? dto.status : null
  const start = formatDateDetail('start', dto)
  const end = formatDateDetail('end', dto)
  const paid = formatDateDetail('paid', dto)
  const budget = dto?.budget ?? dto?.budgetAmount ?? dto?.contractAmount ?? null
  const patch = {
    startAt: start.precision === 'DATE_TIME' ? toDateTimeInput(dto?.startAt) : '',
    endAt: end.precision === 'DATE_TIME' ? toDateTimeInput(dto?.endAt) : '',
    paidAt: paid.precision === 'DATE_TIME' ? toDateTimeInput(dto?.paidAt) : '',
  }

  if (hasText(dto?.title)) patch.title = dto.title.trim()
  if (dto?.content != null) patch.content = toOptionalText(dto.content)
  if (dto?.memo != null) patch.memo = toOptionalText(dto.memo)
  if (dto?.clientCompany != null) patch.clientCompany = toOptionalText(dto.clientCompany)
  if (status) patch.status = status
  if (Number.isFinite(Number(budget)) && Number(budget) >= 0) patch.budget = Number(budget)

  return {
    patch,
    confidence: typeof dto?.confidence === 'number'
      ? Math.round(Math.max(0, Math.min(1, dto.confidence)) * 100)
      : null,
    warnings: Array.isArray(dto?.warnings) ? dto.warnings.filter(hasText) : [],
    details: {
      start,
      end,
      paid,
      budgetText: toOptionalText(dto?.budgetText),
    },
  }
}
