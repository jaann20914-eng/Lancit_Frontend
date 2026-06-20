<template>
  <form class="portfolio-form" @submit.prevent="handleSubmit">
    <div v-if="errorMessage" class="submit-error" role="alert">{{ errorMessage }}</div>

    <div class="form-group">
      <label for="portfolio-title" class="form-label">제목 <span>*</span></label>
      <input
        id="portfolio-title"
        v-model="form.title"
        type="text"
        class="form-input"
        :class="{ invalid: errors.title }"
        placeholder="프로젝트 제목을 입력하세요"
      />
      <p v-if="errors.title" class="form-error">{{ errors.title }}</p>
    </div>

    <div class="form-group">
      <div class="label-row">
        <label for="portfolio-summary" class="form-label">한 줄 요약 <span>*</span></label>
        <span class="character-count">{{ form.summary.length }}/30</span>
      </div>
      <input
        id="portfolio-summary"
        v-model="form.summary"
        type="text"
        maxlength="30"
        class="form-input"
        :class="{ invalid: errors.summary }"
        placeholder="프로젝트를 한 문장으로 소개해주세요"
      />
      <p v-if="errors.summary" class="form-error">{{ errors.summary }}</p>
      <p v-else class="form-help">핵심 내용을 30자 이내로 작성해주세요.</p>
    </div>

    <div class="form-group">
      <label for="portfolio-content" class="form-label">상세 설명</label>
      <textarea
        id="portfolio-content"
        v-model="form.content"
        rows="7"
        class="form-input form-textarea"
        placeholder="프로젝트 배경과 진행 내용, 성과를 작성해주세요"
      ></textarea>
      <p class="form-help">주요 내용을 200자 안팎으로 정리하면 읽기 좋습니다. ({{ form.content.length }}자)</p>
    </div>

    <div class="form-group">
      <label for="portfolio-category" class="form-label">카테고리 <span>*</span></label>
      <select
        id="portfolio-category"
        v-model="form.category"
        class="form-input"
        :class="{ invalid: errors.category }"
      >
        <option value="">카테고리를 선택하세요</option>
        <option v-for="category in categories" :key="category.value" :value="category.value">
          {{ category.label }}
        </option>
      </select>
      <p v-if="errors.category" class="form-error">{{ errors.category }}</p>
    </div>

    <div class="date-row">
      <div class="form-group">
        <label for="portfolio-start-date" class="form-label">시작일</label>
        <input id="portfolio-start-date" v-model="form.workStartAt" type="date" class="form-input" />
      </div>
      <div class="form-group">
        <label for="portfolio-end-date" class="form-label">종료일</label>
        <input
          id="portfolio-end-date"
          v-model="form.workEndAt"
          type="date"
          class="form-input"
          :class="{ invalid: errors.period }"
        />
      </div>
    </div>
    <p v-if="errors.period" class="form-error period-error">{{ errors.period }}</p>

    <label class="visibility-control">
      <input v-model="form.isPublic" type="checkbox" />
      <span>
        <strong>포트폴리오 공개</strong>
        <small>기업이 이 프로젝트를 확인할 수 있습니다.</small>
      </span>
    </label>

    <div class="form-actions">
      <button type="button" class="cancel-button" :disabled="isSubmitting" @click="$emit('cancel')">취소</button>
      <button type="submit" class="submit-button" :disabled="isSubmitting">
        {{ isSubmitting ? '저장 중...' : isEdit ? '수정 완료' : '프로젝트 등록' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { toDateInput } from '@/features/portfolio/api/portfolioMapper.js'

const props = defineProps({
  initialValue: {
    type: Object,
    default: () => ({})
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  isSubmitting: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['submit', 'cancel'])

const categories = [
  { value: 'WEB_APP', label: '웹/앱' },
  { value: 'DESIGN', label: '디자인' },
  { value: 'BRANDING', label: '브랜딩' },
  { value: 'MARKETING', label: '마케팅' },
  { value: 'PLANNING', label: '기획' }
]

const form = reactive({
  title: '',
  summary: '',
  content: '',
  category: '',
  workStartAt: '',
  workEndAt: '',
  isPublic: false,
  bannerFileId: null
})

const errors = reactive({})

watch(
  () => props.initialValue,
  (value) => {
    const source = value || {}
    form.title = source.title ?? ''
    form.summary = source.summary ?? ''
    form.content = source.content ?? ''
    form.category = source.category ?? ''
    form.workStartAt = toDateInput(source.workStartAt)
    form.workEndAt = toDateInput(source.workEndAt)
    form.isPublic = Boolean(source.isPublic)
    form.bannerFileId = source.bannerFileId ?? null
  },
  { immediate: true }
)

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key])
}

function handleSubmit() {
  clearErrors()

  const title = form.title.trim()
  const summary = form.summary.trim()

  if (!title) errors.title = '제목을 입력해주세요.'
  if (!summary) errors.summary = '한 줄 요약을 입력해주세요.'
  if (summary.length > 30) errors.summary = '한 줄 요약은 30자 이내로 입력해주세요.'
  if (!form.category) errors.category = '카테고리를 선택해주세요.'
  if (form.workStartAt && form.workEndAt && form.workStartAt > form.workEndAt) {
    errors.period = '종료일은 시작일보다 빠를 수 없습니다.'
  }

  if (Object.keys(errors).length) return

  emit('submit', {
    title,
    summary,
    content: form.content,
    category: form.category,
    workStartAt: form.workStartAt || null,
    workEndAt: form.workEndAt || null,
    isPublic: form.isPublic,
    bannerFileId: form.bannerFileId
  })
}
</script>

<style scoped>
.portfolio-form {
  padding: 28px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
}

.submit-error {
  margin-bottom: 22px;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
}

.form-group {
  margin-bottom: 20px;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-label {
  display: block;
  margin-bottom: 7px;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
}

.form-label span {
  color: #dc2626;
}

.character-count,
.form-help {
  color: #9ca3af;
  font-size: 12px;
}

.character-count {
  margin-bottom: 7px;
}

.form-help,
.form-error {
  margin: 6px 0 0;
}

.form-error {
  color: #dc2626;
  font-size: 12px;
}

.form-input {
  width: 100%;
  min-height: 42px;
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  color: #1f2937;
  font: inherit;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.form-input:focus {
  border-color: #1a233d;
  box-shadow: 0 0 0 3px rgba(26, 35, 61, 0.08);
}

.form-input.invalid {
  border-color: #ef4444;
}

.form-textarea {
  min-height: 150px;
  resize: vertical;
  line-height: 1.6;
}

.date-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.date-row .form-group {
  margin-bottom: 0;
}

.period-error {
  margin-bottom: 20px;
}

.visibility-control {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 11px;
  cursor: pointer;
}

.visibility-control input {
  width: 17px;
  height: 17px;
  margin: 2px 0 0;
  accent-color: #1a233d;
}

.visibility-control span {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.visibility-control strong {
  color: #1a233d;
  font-size: 14px;
  font-weight: 500;
}

.visibility-control small {
  color: #6b7280;
  font-size: 12px;
}

.form-actions {
  margin-top: 28px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-actions button {
  height: 42px;
  padding: 0 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.cancel-button {
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #4b5563;
}

.submit-button {
  border: none;
  background: #1a233d;
  color: #ffffff;
}

.submit-button:hover:not(:disabled) {
  background: #253a63;
}

.form-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .portfolio-form {
    padding: 20px;
  }

  .date-row {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .form-actions button {
    flex: 1;
  }
}
</style>
