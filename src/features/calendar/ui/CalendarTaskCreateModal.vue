<template>
  <Teleport to="body">
    <div class="form-modal-overlay" role="presentation" @click.self="closeModal">
      <section
        :class="['form-modal', 'task-modal', { 'create-mode': !isEditing }]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
      >
        <header class="modal-header">
          <div>
            <p class="modal-eyebrow">SCHEDULE</p>
            <h2 id="task-form-title">{{ isEditing ? '일정 수정' : '일정 등록' }}</h2>
            <p v-if="isEditing">등록된 일정 정보를 수정합니다.</p>
          </div>
          <button type="button" class="icon-button" :aria-label="`${isEditing ? '일정 수정' : '일정 등록'} 닫기`" :disabled="submitting || parsing" @click="closeModal">×</button>
        </header>

        <form novalidate @submit.prevent="handleSubmit">
          <div :class="['form-layout', { 'with-ai': !isEditing }]">
            <aside v-if="!isEditing" class="ai-panel" aria-labelledby="ai-parse-title">
              <div class="ai-panel-heading">
                <span class="ai-icon" aria-hidden="true">✦</span>
                <div>
                  <p>AI ASSIST</p>
                  <h3 id="ai-parse-title">AI로 입력하기</h3>
                </div>
              </div>
              <p class="ai-description">
                일정 내용을 문장으로 입력하면 AI가 직접 입력 항목을 채워줍니다. AI 분석 후에도 모든 항목을 수정할 수 있습니다.
              </p>

              <label class="ai-source-field">
                <span>일정 내용</span>
                <textarea
                  v-model="aiSourceText"
                  rows="8"
                  maxlength="1000"
                  placeholder="예: 내일 오후 3시부터 4시까지 삼성전자와 Zoom 킥오프, 예산 100만원"
                  :disabled="parsing"
                ></textarea>
                <small>{{ aiSourceText.length }}/1000</small>
              </label>

              <button class="parse-button" type="button" :disabled="parsing || !aiSourceText.trim()" @click="handleParse">
                <span aria-hidden="true">✦</span>
                {{ parsing ? '일정 분석 중...' : 'AI로 일정 분석' }}
              </button>

              <p v-if="parseError" class="parse-error" role="alert">{{ parseError }}</p>

              <section
                v-if="parseResult"
                :class="['parse-result', { 'needs-confirmation': parseNeedsConfirmation }]"
                aria-live="polite"
              >
                <div class="result-heading">
                  <strong>{{ parseResultTitle }}</strong>
                  <span v-if="parseResult.confidence != null">신뢰도 {{ parseResult.confidence }}%</span>
                </div>
                <p>{{ parseResultMessage }}</p>

                <dl v-if="visibleParseDetails.length" class="parse-details">
                  <div v-for="detail in visibleParseDetails" :key="detail.label">
                    <dt>{{ detail.label }}</dt>
                    <dd>
                      {{ detail.value }}
                      <span v-if="detail.precision">{{ precisionLabel(detail.precision) }}</span>
                    </dd>
                  </div>
                </dl>

                <div v-if="parseResult.warnings.length" class="parse-warnings">
                  <strong>확인할 내용</strong>
                  <ul>
                    <li v-for="warning in parseResult.warnings" :key="warning">{{ warning }}</li>
                  </ul>
                </div>
              </section>

              <p class="category-notice">
                카테고리는 오른쪽에서 직접 선택해주세요.
              </p>
            </aside>

            <section class="manual-panel" aria-labelledby="manual-input-title">
              <div v-if="!isEditing" class="manual-heading">
                <p>MANUAL INPUT</p>
                <h3 id="manual-input-title">직접 입력</h3>
              </div>

              <div class="form-grid">
                <label class="form-field field-full">
                  <span>제목 <em>*</em></span>
                  <input v-model="form.title" type="text" maxlength="255" placeholder="일정 제목을 입력하세요" required />
                </label>

                <label class="form-field">
                  <span>카테고리 <em>*</em></span>
                  <select v-model="form.categoryId" required>
                    <option disabled value="">카테고리 선택</option>
                    <option v-for="category in categories" :key="category.id" :value="String(category.id)">
                      {{ category.label }}
                    </option>
                  </select>
                </label>

                <label class="form-field">
                  <span>상태 <em>*</em></span>
                  <select v-model="form.status" required>
                    <option v-for="status in TASK_STATUS_OPTIONS" :key="status.value" :value="status.value">
                      {{ status.label }}
                    </option>
                  </select>
                </label>

                <label class="form-field">
                  <span>시작 일시 <em>*</em></span>
                  <input v-model="form.startAt" type="datetime-local" step="900" required />
                </label>

                <label class="form-field">
                  <span>종료 일시 <em>*</em></span>
                  <input v-model="form.endAt" type="datetime-local" step="900" required />
                </label>

                <label class="form-field field-full">
                  <span>설명</span>
                  <textarea v-model="form.content" rows="3" placeholder="일정에 대한 설명을 입력하세요"></textarea>
                </label>

                <label class="form-field field-full">
                  <span>메모</span>
                  <textarea v-model="form.memo" rows="2" placeholder="장소, 링크, 준비물 등 부가 정보를 입력하세요"></textarea>
                </label>

                <label class="form-field">
                  <span>고객사</span>
                  <input v-model="form.clientCompany" type="text" maxlength="255" placeholder="선택 입력" />
                </label>

                <label class="form-field">
                  <span>예산</span>
                  <div class="number-field">
                    <input v-model="form.budget" type="number" min="0" step="1" placeholder="0" />
                    <span>원</span>
                  </div>
                </label>

                <label class="form-field field-full">
                  <span>입금 일시</span>
                  <input v-model="form.paidAt" type="datetime-local" step="900" />
                </label>
              </div>

              <p v-if="localError || error" class="form-error" role="alert">{{ localError || error }}</p>

              <footer class="modal-actions">
                <button type="button" class="button button-secondary" :disabled="submitting || parsing" @click="closeModal">취소</button>
                <button type="submit" class="button button-primary" :disabled="submitting || parsing">
                  {{ submitting ? '저장 중...' : (isEditing ? '변경사항 저장' : '일정 등록') }}
                </button>
              </footer>
            </section>
          </div>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { parseCalendarTask } from '@/features/calendar/api/calendarApi.js'
import { TASK_STATUS_OPTIONS } from '@/features/calendar/api/calendarMapper.js'
import { mapTaskParseResponse } from '@/features/calendar/api/calendarParseMapper.js'

const props = defineProps({
  categories: { type: Array, required: true },
  initialDate: { type: Date, default: () => new Date() },
  task: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const localError = ref('')
const aiSourceText = ref('')
const parsing = ref(false)
const parseError = ref('')
const parseResult = ref(null)
const isEditing = computed(() => props.task?.taskId != null)
const parseNeedsConfirmation = computed(() => (
  parseResult.value?.requiresConfirmation === true
  || (parseResult.value?.warnings?.length ?? 0) > 0
))
const parseResultTitle = computed(() => (
  parseNeedsConfirmation.value ? '확인 필요' : '분석 완료'
))
const parseResultMessage = computed(() => (
  parseNeedsConfirmation.value
    ? 'AI가 확정하지 못한 항목이 있습니다. 시작 및 종료 일시를 확인해주세요.'
    : '분석 결과를 오른쪽 입력란에 반영했습니다. 필수 항목을 확인해주세요.'
))
const visibleParseDetails = computed(() => {
  const details = parseResult.value?.details
  if (!details) return []

  return [
    { label: '시작', ...details.start },
    { label: '종료', ...details.end },
    { label: '입금', ...details.paid },
    details.budgetText ? { label: '금액', value: details.budgetText, precision: null } : null,
  ].filter((detail) => detail?.value)
})

function toInputDateTime(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const now = new Date()
const defaultStart = props.task?.start ? new Date(props.task.start) : new Date(props.initialDate)
const isToday = defaultStart.getFullYear() === now.getFullYear()
  && defaultStart.getMonth() === now.getMonth()
  && defaultStart.getDate() === now.getDate()
if (!props.task?.start && isToday) {
  defaultStart.setHours(now.getHours(), now.getMinutes(), 0, 0)
} else if (!props.task?.start) {
  defaultStart.setHours(9, 0, 0, 0)
}
defaultStart.setSeconds(0, 0)
defaultStart.setMinutes(Math.ceil(defaultStart.getMinutes() / 15) * 15)
const defaultEnd = props.task?.end
  ? new Date(props.task.end)
  : new Date(defaultStart.getTime() + 60 * 60 * 1000)

const form = reactive({
  title: props.task?.title || '',
  categoryId: props.task?.categoryId != null
    ? String(props.task.categoryId)
    : (props.categories[0]?.id != null ? String(props.categories[0].id) : ''),
  status: TASK_STATUS_OPTIONS.some((status) => status.value === props.task?.status)
    ? props.task.status
    : 'IN_PROGRESS',
  startAt: toInputDateTime(defaultStart),
  endAt: toInputDateTime(defaultEnd),
  content: props.task?.description || '',
  memo: props.task?.memo || '',
  clientCompany: props.task?.clientCompany || '',
  budget: props.task?.budget ?? '',
  paidAt: props.task?.paidAt ? toInputDateTime(new Date(props.task.paidAt)) : '',
})

function emptyToNull(value) {
  const normalized = String(value || '').trim()
  return normalized || null
}

function closeModal() {
  if (!props.submitting && !parsing.value) emit('close')
}

function precisionLabel(precision) {
  return {
    NONE: '미확정',
    DATE_ONLY: '날짜만 인식',
    TIME_ONLY: '시간만 인식',
    DATE_TIME: '일시 확정',
  }[precision] || precision
}

function getParseErrorMessage(error) {
  const status = error?.response?.status
  if (status === 400) return error?.response?.data?.message || '분석할 문장을 확인해주세요.'
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  if (status === 403) return '일정 분석 권한이 없습니다.'
  if (status === 404) return '일정 분석 API를 찾을 수 없습니다.'
  return error?.response?.data?.message || '일정 분석에 실패했습니다. 잠시 후 다시 시도해주세요.'
}

async function handleParse() {
  const sourceText = aiSourceText.value.trim()
  if (!sourceText) {
    parseError.value = '분석할 일정 내용을 입력해주세요.'
    return
  }

  parsing.value = true
  parseError.value = ''
  parseResult.value = null
  try {
    const response = await parseCalendarTask(sourceText)
    const mappedResult = mapTaskParseResponse(response)
    Object.assign(form, mappedResult.patch)
    parseResult.value = mappedResult
    localError.value = ''
  } catch (error) {
    parseError.value = getParseErrorMessage(error)
  } finally {
    parsing.value = false
  }
}

function handleSubmit() {
  localError.value = ''
  const startTime = new Date(form.startAt).getTime()
  const endTime = new Date(form.endAt).getTime()

  if (!form.title.trim() || !form.categoryId) {
    localError.value = '제목과 카테고리는 필수입니다.'
    return
  }
  if (!form.startAt || !form.endAt) {
    localError.value = '시작 일시와 종료 일시를 확인해주세요.'
    return
  }
  if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
    localError.value = '유효한 시작 및 종료 일시를 입력해주세요.'
    return
  }
  if (startTime > endTime) {
    localError.value = '종료 일시는 시작 일시보다 빠를 수 없습니다.'
    return
  }
  if (form.budget !== '' && Number(form.budget) < 0) {
    localError.value = '예산은 0원 이상이어야 합니다.'
    return
  }

  emit('submit', {
    categoryId: Number(form.categoryId),
    title: form.title.trim(),
    status: form.status,
    startAt: form.startAt,
    endAt: form.endAt,
    content: emptyToNull(form.content),
    memo: emptyToNull(form.memo),
    clientCompany: emptyToNull(form.clientCompany),
    budget: form.budget === '' ? null : Number(form.budget),
    paidAt: emptyToNull(form.paidAt),
  })
}
</script>

<style scoped>
.form-modal-overlay { position: fixed; inset: 0; z-index: 410; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(15, 23, 42, .48); }
.form-modal { width: min(100%, 720px); max-height: 92vh; overflow-y: auto; padding: 28px; border-radius: 14px; background: #ffffff; box-shadow: 0 20px 60px rgba(15, 23, 42, .22); }
.form-modal.create-mode { width: min(100%, 1160px); }
.modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 24px; }
.modal-eyebrow { margin: 0 0 6px; color: #4a6fa5; font-size: 10px; font-weight: 800; letter-spacing: .14em; }
.modal-header h2 { margin: 0; color: #1a233d; font-size: 22px; }
.modal-header p:not(.modal-eyebrow) { margin: 6px 0 0; color: #64748b; font-size: 13px; }
.icon-button { width: 34px; height: 34px; padding: 0; border: 0; border-radius: 8px; background: transparent; color: #64748b; font-size: 26px; cursor: pointer; }
.icon-button:hover:not(:disabled) { background: #f1f5f9; color: #1a233d; }

.form-layout.with-ai { display: grid; grid-template-columns: minmax(290px, 360px) minmax(0, 1fr); overflow: hidden; border: 1px solid #dbe2ec; border-radius: 12px; }
.ai-panel { display: flex; min-width: 0; flex-direction: column; padding: 24px; border-right: 1px solid #dbe2ec; background: #f6f8fc; }
.ai-panel-heading { display: flex; align-items: center; gap: 11px; }
.ai-panel-heading p,
.manual-heading p { margin: 0 0 3px; color: #4a6fa5; font-size: 10px; font-weight: 800; letter-spacing: .12em; }
.ai-panel-heading h3,
.manual-heading h3 { margin: 0; color: #1a233d; font-size: 17px; }
.ai-icon { display: inline-flex; width: 34px; height: 34px; flex: 0 0 auto; align-items: center; justify-content: center; border-radius: 10px; background: #1a233d; color: #ffffff; font-size: 18px; }
.ai-description { margin: 14px 0 18px; color: #64748b; font-size: 12px; line-height: 1.6; }
.ai-source-field { display: flex; flex-direction: column; gap: 8px; }
.ai-source-field > span { color: #334155; font-size: 13px; font-weight: 600; }
.ai-source-field textarea { width: 100%; min-height: 174px; padding: 12px; border: 1px solid #cfd8e5; border-radius: 9px; background: #ffffff; color: #1f2937; font: inherit; font-size: 13px; line-height: 1.6; outline: none; resize: vertical; }
.ai-source-field textarea:focus { border-color: #4a6fa5; box-shadow: 0 0 0 3px rgba(74, 111, 165, .1); }
.ai-source-field small { align-self: flex-end; color: #94a3b8; font-size: 10px; }
.parse-button { display: inline-flex; width: 100%; height: 42px; align-items: center; justify-content: center; gap: 7px; margin-top: 13px; border: 1px solid #1a233d; border-radius: 8px; background: #1a233d; color: #ffffff; font-size: 13px; font-weight: 700; cursor: pointer; }
.parse-button:hover:not(:disabled) { background: #283554; }
.parse-button:disabled { opacity: .55; cursor: wait; }
.parse-error { margin: 12px 0 0; padding: 10px 11px; border-radius: 8px; background: #fff1f2; color: #991b1b; font-size: 11px; line-height: 1.5; }
.parse-result { margin-top: 14px; padding: 13px; border: 1px solid #cce4d4; border-radius: 9px; background: #f2faf5; color: #335c42; font-size: 11px; }
.parse-result.needs-confirmation { border-color: #f1d18f; background: #fff8e7; color: #674b16; }
.result-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.result-heading strong { color: #24613b; font-size: 12px; }
.result-heading span { padding: 3px 7px; border-radius: 999px; background: #dcefe2; font-size: 10px; font-weight: 700; }
.parse-result.needs-confirmation .result-heading strong { color: #7c4a03; }
.parse-result.needs-confirmation .result-heading span { background: #f8e6b7; }
.parse-result > p { margin: 7px 0 0; line-height: 1.5; }
.parse-details { display: grid; gap: 7px; margin: 11px 0 0; padding-top: 10px; border-top: 1px solid #d9eadf; }
.parse-details div { display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 7px; }
.parse-details dt { color: #52705e; font-weight: 700; }
.parse-details dd { min-width: 0; margin: 0; overflow-wrap: anywhere; color: #274b35; }
.parse-details dd span { display: block; margin-top: 2px; color: #6b8273; font-size: 10px; }
.parse-warnings { margin-top: 10px; padding-top: 9px; border-top: 1px solid #d9eadf; color: #7c5b22; }
.parse-warnings ul { margin: 5px 0 0; padding-left: 17px; line-height: 1.5; }
.category-notice { margin: auto 0 0; padding-top: 18px; color: #718096; font-size: 10px; line-height: 1.55; }
.manual-panel { min-width: 0; }
.form-layout.with-ai .manual-panel { padding: 24px; }
.manual-heading { margin-bottom: 20px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 16px; }
.form-field { display: flex; min-width: 0; flex-direction: column; gap: 8px; }
.field-full { grid-column: 1 / -1; }
.form-field > span { color: #334155; font-size: 13px; font-weight: 600; }
.form-field em { color: #dc2626; font-style: normal; }
.form-field input,
.form-field select,
.form-field textarea { width: 100%; border: 1px solid #d7dce4; border-radius: 8px; background: #ffffff; color: #1f2937; font: inherit; font-size: 14px; outline: none; }
.form-field input,
.form-field select { height: 44px; padding: 0 12px; }
.form-field textarea { padding: 11px 12px; resize: vertical; line-height: 1.5; }
.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus { border-color: #4a6fa5; box-shadow: 0 0 0 3px rgba(74, 111, 165, .1); }
.number-field { position: relative; }
.number-field input { padding-right: 38px; }
.number-field span { position: absolute; top: 50%; right: 13px; color: #64748b; font-size: 12px; transform: translateY(-50%); }

.form-error { margin: 18px 0 0; padding: 11px 13px; border-radius: 8px; background: #fff1f2; color: #991b1b; font-size: 12px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 9px; padding-top: 24px; }
.button { min-width: 94px; height: 40px; padding: 0 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.button:disabled { opacity: .55; cursor: wait; }
.button-secondary { border: 1px solid #d7dce4; background: #ffffff; color: #475569; }
.button-primary { border: 1px solid #1a233d; background: #1a233d; color: #ffffff; }
.button-primary:hover:not(:disabled) { background: #283554; }

@media (max-width: 900px) {
  .form-layout.with-ai { grid-template-columns: 1fr; }
  .ai-panel { border-right: 0; border-bottom: 1px solid #dbe2ec; }
  .category-notice { margin-top: 0; }
}

@media (max-width: 640px) {
  .form-modal-overlay { align-items: flex-end; padding: 0; }
  .form-modal { width: 100%; padding: 22px; border-radius: 16px 16px 0 0; }
  .form-layout.with-ai { margin: 0 -6px; }
  .ai-panel,
  .form-layout.with-ai .manual-panel { padding: 18px; }
  .form-grid { grid-template-columns: 1fr; }
  .field-full { grid-column: auto; }
}
</style>
