<template>
  <form class="portfolio-form" @submit.prevent="handleSubmit">
    <div v-if="errorMessage" class="submit-error" role="alert">{{ errorMessage }}</div>

    <div class="form-group">
      <label for="portfolio-banner" class="form-label">배너 이미지</label>
      <label
        class="banner-control"
        :class="{ 'has-image': bannerPreviewUrl, invalid: errors.banner }"
        for="portfolio-banner"
      >
        <input
          id="portfolio-banner"
          ref="bannerInput"
          type="file"
          accept="image/*"
          @change="handleBannerChange"
        />
        <img v-if="bannerPreviewUrl" :src="bannerPreviewUrl" alt="선택한 배너 이미지 미리보기" />
        <span v-else class="banner-placeholder" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M4 16.5 8.5 12l3 3 2.5-2.5 6 6M9 8.5h.01M5 4h14a1 1 0 0 1 1 1v14H4V5a1 1 0 0 1 1-1Z"
            />
          </svg>
        </span>
        <span class="banner-overlay">
          <strong>{{ bannerPreviewUrl ? '이미지 변경' : '배너 이미지 선택' }}</strong>
          <small>가로형 이미지를 권장합니다. (최대 10MB)</small>
        </span>
      </label>
      <div v-if="selectedBanner" class="selected-banner-row">
        <span>{{ selectedBanner.name }}</span>
        <button type="button" @click="clearBanner">선택 취소</button>
      </div>
      <p v-if="errors.banner" class="form-error">{{ errors.banner }}</p>
    </div>

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
      <p class="form-help">
        주요 내용을 200자 안팎으로 정리하면 읽기 좋습니다. ({{ form.content.length }}자)
      </p>
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
        <input
          id="portfolio-start-date"
          v-model="form.workStartAt"
          type="date"
          class="form-input"
        />
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

    <div class="form-group result-file-group">
      <label for="portfolio-files" class="form-label">결과물 파일</label>
      <label class="file-upload-control" :class="{ invalid: errors.files }" for="portfolio-files">
        <input
          id="portfolio-files"
          ref="resultFileInput"
          type="file"
          multiple
          @change="handleResultFilesChange"
        />
        <span class="upload-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
          </svg>
        </span>
        <span>
          <strong>파일 선택</strong>
          <small>파일당 최대 10MB, 전체 50MB까지 등록할 수 있습니다.</small>
        </span>
      </label>

      <ul v-if="displayedFiles.length" class="file-list" aria-label="결과물 파일 목록">
        <li v-for="file in displayedFiles" :key="file.key">
          <span class="file-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M7 3h7l4 4v14H7V3Zm7 0v5h5" />
            </svg>
          </span>
          <span class="file-information">
            <strong>{{ file.name }}</strong>
            <small>{{ formatFileSize(file.size) }}{{ file.isExisting ? ' · 등록됨' : '' }}</small>
          </span>
          <button
            v-if="!file.isExisting"
            type="button"
            class="remove-file-button"
            :aria-label="`${file.name} 삭제`"
            @click="removeResultFile(file.index)"
          >
            ×
          </button>
        </li>
      </ul>
      <p v-if="errors.files" class="form-error">{{ errors.files }}</p>
    </div>

    <label class="visibility-control">
      <input v-model="form.isPublic" type="checkbox" />
      <span>
        <strong>포트폴리오 공개</strong>
        <small>기업이 이 프로젝트를 확인할 수 있습니다.</small>
      </span>
    </label>

    <div class="form-actions">
      <button type="button" class="cancel-button" :disabled="isSubmitting" @click="$emit('cancel')">
        취소
      </button>
      <button type="submit" class="submit-button" :disabled="isSubmitting">
        {{ isSubmitting ? '저장 중...' : isEdit ? '수정 완료' : '프로젝트 등록' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { toDateInput } from '@/features/portfolio/api/portfolioMapper.js'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_REQUEST_SIZE = 50 * 1024 * 1024

const props = defineProps({
  initialValue: {
    type: Object,
    default: () => ({}),
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  initialFiles: {
    type: Array,
    default: () => [],
  },
  initialBannerUrl: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['submit', 'cancel'])

const categories = [
  { value: 'WEB_APP', label: '웹/앱' },
  { value: 'DESIGN', label: '디자인' },
  { value: 'BRANDING', label: '브랜딩' },
  { value: 'MARKETING', label: '마케팅' },
  { value: 'PLANNING', label: '기획' },
]

const bannerInput = ref(null)
const resultFileInput = ref(null)
const selectedBanner = ref(null)
const selectedResultFiles = ref([])
const localBannerUrl = ref('')

const bannerPreviewUrl = computed(() => localBannerUrl.value || props.initialBannerUrl)
const displayedFiles = computed(() => [
  ...props.initialFiles.map((file) => ({
    key: `existing-${file.fileId}`,
    name: file.oriName || '등록된 파일',
    size: Number(file.fileSize) || 0,
    isExisting: true,
  })),
  ...selectedResultFiles.value.map((file, index) => ({
    key: `selected-${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    size: file.size,
    index,
    isExisting: false,
  })),
])

const form = reactive({
  title: '',
  summary: '',
  content: '',
  category: '',
  workStartAt: '',
  workEndAt: '',
  isPublic: false,
  bannerFileId: null,
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
  { immediate: true },
)

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key])
}

function revokeLocalBannerUrl() {
  if (!localBannerUrl.value) return
  URL.revokeObjectURL(localBannerUrl.value)
  localBannerUrl.value = ''
}

function handleBannerChange(event) {
  const file = event.target.files?.[0] ?? null
  delete errors.banner
  if (!file) return
  if (!file.type.startsWith('image/')) {
    errors.banner = '이미지 파일만 배너로 등록할 수 있습니다.'
    event.target.value = ''
    return
  }
  if (file.size > MAX_FILE_SIZE) {
    errors.banner = '배너 이미지는 10MB 이하만 등록할 수 있습니다.'
    event.target.value = ''
    return
  }

  revokeLocalBannerUrl()
  selectedBanner.value = file
  localBannerUrl.value = URL.createObjectURL(file)
}

function clearBanner() {
  selectedBanner.value = null
  revokeLocalBannerUrl()
  if (bannerInput.value) bannerInput.value.value = ''
  delete errors.banner
}

function handleResultFilesChange(event) {
  const incomingFiles = Array.from(event.target.files ?? [])
  delete errors.files
  if (!incomingFiles.length) return

  const oversizedFile = incomingFiles.find((file) => file.size > MAX_FILE_SIZE)
  if (oversizedFile) {
    errors.files = `${oversizedFile.name} 파일은 10MB를 초과하여 등록할 수 없습니다.`
    event.target.value = ''
    return
  }

  const nextFiles = [...selectedResultFiles.value]
  incomingFiles.forEach((file) => {
    const isDuplicate = nextFiles.some(
      (item) =>
        item.name === file.name &&
        item.size === file.size &&
        item.lastModified === file.lastModified,
    )
    if (!isDuplicate) nextFiles.push(file)
  })

  const totalSize = nextFiles.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > MAX_REQUEST_SIZE) {
    errors.files = '결과물 파일의 전체 용량은 50MB를 초과할 수 없습니다.'
    event.target.value = ''
    return
  }

  selectedResultFiles.value = nextFiles
  event.target.value = ''
}

function removeResultFile(index) {
  selectedResultFiles.value.splice(index, 1)
  delete errors.files
}

function formatFileSize(size) {
  if (!size) return '0 KB'
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
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
    bannerFileId: form.bannerFileId,
    bannerFile: selectedBanner.value,
    resultFiles: [...selectedResultFiles.value],
  })
}

onBeforeUnmount(revokeLocalBannerUrl)
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

.banner-control {
  position: relative;
  min-height: 210px;
  border: 1px dashed #cbd5e1;
  border-radius: 9px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
}

.banner-control.invalid,
.file-upload-control.invalid {
  border-color: #ef4444;
}

.banner-control input,
.file-upload-control input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.banner-control img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-placeholder svg,
.upload-icon svg,
.file-icon svg {
  width: 100%;
  height: 100%;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.banner-placeholder {
  width: 42px;
  height: 42px;
  color: #94a3b8;
}

.banner-overlay {
  position: absolute;
  inset: 0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #475569;
  text-align: center;
}

.banner-control.has-image .banner-overlay {
  background: rgba(15, 23, 42, 0);
  color: transparent;
  transition:
    background 0.15s,
    color 0.15s;
}

.banner-control.has-image:hover .banner-overlay,
.banner-control.has-image:focus-within .banner-overlay {
  background: rgba(15, 23, 42, 0.58);
  color: #ffffff;
}

.banner-overlay strong {
  font-size: 14px;
  font-weight: 600;
}

.banner-overlay small {
  font-size: 11px;
}

.banner-control:not(.has-image) .banner-overlay {
  padding-top: 76px;
}

.selected-banner-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #64748b;
  font-size: 12px;
}

.selected-banner-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-banner-row button,
.remove-file-button {
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
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
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
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

.result-file-group {
  margin-top: 20px;
}

.file-upload-control {
  position: relative;
  min-height: 76px;
  padding: 16px 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #fafafa;
  display: flex;
  align-items: center;
  gap: 13px;
  cursor: pointer;
}

.file-upload-control:hover {
  border-color: #64748b;
  background: #f8fafc;
}

.upload-icon {
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
  color: #475569;
}

.file-upload-control > span:last-child {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-upload-control strong {
  color: #334155;
  font-size: 13px;
}

.file-upload-control small {
  color: #94a3b8;
  font-size: 11px;
}

.file-list {
  margin: 10px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
  list-style: none;
}

.file-list li {
  min-height: 58px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  display: flex;
  align-items: center;
  gap: 11px;
}

.file-icon {
  width: 23px;
  height: 23px;
  flex: 0 0 auto;
  color: #64748b;
}

.file-information {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.file-information strong {
  overflow: hidden;
  color: #374151;
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-information small {
  color: #9ca3af;
  font-size: 10px;
}

.remove-file-button {
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  font-size: 20px;
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
