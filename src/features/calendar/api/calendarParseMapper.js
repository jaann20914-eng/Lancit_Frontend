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

function hasField(dto, field) {
  return dto != null && Object.prototype.hasOwnProperty.call(dto, field)
}

function normalizeConfidence(value) {
  const confidence = Number(value)
  if (!Number.isFinite(confidence)) return null
  if (confidence >= 0 && confidence <= 1) return Math.round(confidence * 100)
  return Math.round(Math.max(0, Math.min(100, confidence)))
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
    startAt: toDateTimeInput(dto?.startAt),
    endAt: toDateTimeInput(dto?.endAt),
    paidAt: toDateTimeInput(dto?.paidAt),
  }

  if (hasText(dto?.title)) patch.title = dto.title.trim()
  if (hasField(dto, 'content')) patch.content = toOptionalText(dto.content)
  if (hasField(dto, 'memo')) patch.memo = toOptionalText(dto.memo)
  if (hasField(dto, 'clientCompany')) patch.clientCompany = toOptionalText(dto.clientCompany)
  if (status) patch.status = status
  if (Number.isFinite(Number(budget)) && Number(budget) >= 0) patch.budget = Number(budget)

  return {
    patch,
    confidence: normalizeConfidence(dto?.confidence),
    requiresConfirmation: dto?.requiresConfirmation === true,
    warnings: Array.isArray(dto?.warnings) ? dto.warnings.filter(hasText) : [],
    details: {
      start,
      end,
      paid,
      budgetText: toOptionalText(dto?.budgetText),
    },
  }
}
