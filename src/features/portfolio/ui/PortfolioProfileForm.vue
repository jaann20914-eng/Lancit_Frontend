<template>
  <form class="profile-form" @submit.prevent="handleSubmit">
    <div v-if="errorMessage" class="submit-error" role="alert">{{ errorMessage }}</div>

    <div class="policy-note">
      <strong>지원용 프로필 카드</strong>
      <p>이 정보는 기본 프로필과 별도로 저장됩니다.</p>
      <p>
        공고 지원 시 현재 지원용 프로필 카드가 지원 당시 정보로 제출됩니다. 제출 후 이
        카드를 수정해도 이미 제출한 지원서의 프로필 카드는 바뀌지 않습니다.
      </p>
    </div>

    <div class="form-grid">
      <div class="form-group">
        <label for="portfolio-profile-display-name" class="form-label">지원용 이름</label>
        <input
          id="portfolio-profile-display-name"
          v-model="form.displayName"
          type="text"
          :maxlength="PORTFOLIO_PROFILE_DISPLAY_NAME_MAX_LENGTH"
          :class="['form-input', { invalid: errors.displayName }]"
          placeholder="지원서에 표시할 이름"
          :disabled="isSubmitting"
        />
        <p v-if="errors.displayName" class="form-error">{{ errors.displayName }}</p>
      </div>

      <div class="form-group">
        <label for="portfolio-profile-job-category" class="form-label">지원용 직종</label>
        <select
          id="portfolio-profile-job-category"
          v-model="form.jobCategory"
          :class="['form-input', { invalid: errors.jobCategory }]"
          :disabled="isSubmitting"
        >
          <option value="" disabled>직종을 선택해주세요</option>
          <option v-for="option in jobCategoryOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <p v-if="errors.jobCategory" class="form-error">{{ errors.jobCategory }}</p>
      </div>
    </div>

    <div class="form-group">
      <span class="form-label">지원용 프로필 사진</span>
      <div class="image-field">
        <div class="image-preview" aria-hidden="true">
          <img v-if="imagePreviewUrl" :src="imagePreviewUrl" alt="" />
          <span v-else>{{ displayNameInitial }}</span>
        </div>
        <label class="image-button">
          이미지 선택
          <input
            type="file"
            accept="image/*"
            :disabled="isSubmitting"
            @change="handleImageChange"
          />
        </label>
      </div>
      <p class="form-help">새 이미지는 저장 시 지원용 프로필 사진으로 등록됩니다.</p>
    </div>

    <div class="form-group">
      <div class="label-row">
        <label for="portfolio-profile-intro" class="form-label">한 줄 소개</label>
        <span class="character-count">
          {{ form.intro.length }}/{{ PORTFOLIO_PROFILE_INTRO_MAX_LENGTH }}
        </span>
      </div>
      <input
        id="portfolio-profile-intro"
        v-model="form.intro"
        type="text"
        :maxlength="PORTFOLIO_PROFILE_INTRO_MAX_LENGTH"
        :class="['form-input', { invalid: errors.intro }]"
        placeholder="나의 강점을 한 문장으로 소개해주세요"
        :disabled="isSubmitting"
      />
      <p v-if="errors.intro" class="form-error">{{ errors.intro }}</p>
    </div>

    <div class="form-group">
      <div class="label-row">
        <label for="portfolio-profile-description" class="form-label">상세 소개</label>
        <span class="character-count">
          {{ form.description.length }}/{{ PORTFOLIO_PROFILE_DESCRIPTION_MAX_LENGTH }}
        </span>
      </div>
      <textarea
        id="portfolio-profile-description"
        v-model="form.description"
        rows="5"
        :maxlength="PORTFOLIO_PROFILE_DESCRIPTION_MAX_LENGTH"
        :class="['form-input', 'description-input', { invalid: errors.description }]"
        placeholder="경험과 강점을 자세히 소개해주세요"
        :disabled="isSubmitting"
      ></textarea>
      <p v-if="errors.description" class="form-error">{{ errors.description }}</p>
    </div>

    <div class="form-group">
      <label for="portfolio-profile-tech-stack" class="form-label">기술 스택</label>
      <div class="tag-input" :class="{ invalid: errors.techStacks }">
        <span v-for="techStack in form.techStacks" :key="techStack" class="tag">
          {{ techStack }}
          <button
            type="button"
            :aria-label="`${techStack} 삭제`"
            :disabled="isSubmitting"
            @click="removeTechStack(techStack)"
          >
            ×
          </button>
        </span>
        <input
          id="portfolio-profile-tech-stack"
          v-model="techStackInput"
          type="text"
          :maxlength="PORTFOLIO_PROFILE_TECH_STACK_MAX_LENGTH"
          placeholder="예: Vue, JavaScript"
          :disabled="isSubmitting"
          @keydown="handleTechStackKeydown"
          @blur="commitTechStack"
        />
      </div>
      <p v-if="errors.techStacks" class="form-error">{{ errors.techStacks }}</p>
      <p v-else class="form-help">
        쉼표 또는 Enter를 누르면 추가됩니다. 같은 값은 한 번만 저장됩니다.
      </p>
    </div>

    <label class="visibility-control">
      <input v-model="form.isPortfolioPublic" type="checkbox" :disabled="isSubmitting" />
      <span>
        <strong>지원용 프로필 공개</strong>
        <small>공개 인재 검색에서 이 카드를 노출합니다. 지원한 회사는 제출 당시 카드를 볼 수 있습니다.</small>
      </span>
    </label>

    <div class="form-actions">
      <button type="button" class="cancel-button" :disabled="isSubmitting" @click="$emit('cancel')">
        취소
      </button>
      <button type="submit" class="submit-button" :disabled="isSubmitting">
        {{ isSubmitting ? '저장 중...' : '프로필 저장' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import {
  normalizeTechStacks,
  PORTFOLIO_PROFILE_DESCRIPTION_MAX_LENGTH,
  PORTFOLIO_PROFILE_DISPLAY_NAME_MAX_LENGTH,
  PORTFOLIO_PROFILE_INTRO_MAX_LENGTH,
  PORTFOLIO_PROFILE_TECH_STACK_MAX_LENGTH,
} from '@/features/portfolio/api/portfolioProfileMapper.js'

const props = defineProps({
  initialValue: { type: Object, required: true },
  initialImageUrl: { type: String, default: '' },
  isSubmitting: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
})

const emit = defineEmits(['submit', 'cancel'])

const jobCategoryOptions = [
  { value: 'IT', label: 'IT' },
  { value: 'DESIGN', label: '디자인' },
  { value: 'MARKETING', label: '마케팅' },
  { value: 'VIDEO', label: '영상' },
  { value: 'MUSIC', label: '음악' },
  { value: 'EDUCATION', label: '교육' },
  { value: 'WRITING', label: '글쓰기' },
  { value: 'ETC', label: '기타' },
]

const form = reactive({
  displayName: '',
  jobCategory: '',
  profileFileId: null,
  intro: '',
  description: '',
  techStacks: [],
  isPortfolioPublic: false,
})
const techStackInput = ref('')
const selectedImageFile = ref(null)
const localImagePreviewUrl = ref('')
const errors = reactive({})

const imagePreviewUrl = computed(() => localImagePreviewUrl.value || props.initialImageUrl)
const displayNameInitial = computed(() => form.displayName.trim().charAt(0) || '?')

watch(
  () => props.initialValue,
  (value) => {
    form.displayName = typeof value?.displayName === 'string' ? value.displayName : ''
    form.jobCategory = value?.jobCategory ?? ''
    form.profileFileId = value?.profileFileId ?? null
    form.intro = typeof value?.intro === 'string' ? value.intro : ''
    form.description = typeof value?.description === 'string' ? value.description : ''
    form.techStacks = normalizeTechStacks(value?.techStacks)
    form.isPortfolioPublic = Boolean(value?.isPortfolioPublic)
    techStackInput.value = ''
    selectedImageFile.value = null
    clearLocalImagePreview()
    clearErrors()
  },
  { immediate: true },
)

onBeforeUnmount(clearLocalImagePreview)

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key])
}

function handleTechStackKeydown(event) {
  if (event.isComposing || (event.key !== 'Enter' && event.key !== ',')) return
  event.preventDefault()
  commitTechStack()
}

function commitTechStack() {
  if (!techStackInput.value.trim()) return
  const candidates = normalizeTechStacks(techStackInput.value)
  if (candidates.some((item) => item.length > PORTFOLIO_PROFILE_TECH_STACK_MAX_LENGTH)) {
    errors.techStacks = `기술 스택은 항목당 ${PORTFOLIO_PROFILE_TECH_STACK_MAX_LENGTH}자 이내로 입력해주세요.`
    return
  }
  form.techStacks = normalizeTechStacks([...form.techStacks, ...candidates])
  techStackInput.value = ''
  delete errors.techStacks
}

function removeTechStack(techStack) {
  form.techStacks = form.techStacks.filter((item) => item !== techStack)
}

function handleImageChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  clearLocalImagePreview()
  selectedImageFile.value = file
  localImagePreviewUrl.value = URL.createObjectURL(file)
}

function clearLocalImagePreview() {
  if (!localImagePreviewUrl.value) return
  URL.revokeObjectURL(localImagePreviewUrl.value)
  localImagePreviewUrl.value = ''
}

function handleSubmit() {
  clearErrors()
  commitTechStack()

  const displayName = form.displayName.trim()
  const intro = form.intro.trim()
  const description = form.description.trim()

  if (!displayName) errors.displayName = '지원용 이름을 입력해주세요.'
  if (!form.jobCategory) errors.jobCategory = '지원용 직종을 선택해주세요.'
  if (intro.length > PORTFOLIO_PROFILE_INTRO_MAX_LENGTH) {
    errors.intro = `한 줄 소개는 ${PORTFOLIO_PROFILE_INTRO_MAX_LENGTH}자 이내로 입력해주세요.`
  }
  if (description.length > PORTFOLIO_PROFILE_DESCRIPTION_MAX_LENGTH) {
    errors.description = `상세 소개는 ${PORTFOLIO_PROFILE_DESCRIPTION_MAX_LENGTH}자 이내로 입력해주세요.`
  }
  if (form.techStacks.some((item) => item.length > PORTFOLIO_PROFILE_TECH_STACK_MAX_LENGTH)) {
    errors.techStacks = `기술 스택은 항목당 ${PORTFOLIO_PROFILE_TECH_STACK_MAX_LENGTH}자 이내로 입력해주세요.`
  }
  if (Object.keys(errors).length) return

  emit('submit', {
    displayName,
    jobCategory: form.jobCategory,
    profileFileId: form.profileFileId,
    profileImageFile: selectedImageFile.value,
    intro,
    description,
    techStacks: form.techStacks,
    isPortfolioPublic: form.isPortfolioPublic,
  })
}
</script>

<style scoped>
.profile-form {
  padding: 24px;
  border: 1px solid #dce2eb;
  border-radius: 12px;
  background: #fff;
}

.submit-error,
.policy-note {
  margin-bottom: 22px;
  padding: 13px 15px;
  border-radius: 8px;
  font-size: 13px;
}

.submit-error { border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; }
.policy-note { border: 1px solid #bfdbfe; background: #eff6ff; color: #1e3a8a; }
.policy-note strong { display: block; margin-bottom: 5px; }
.policy-note p { margin: 2px 0; font-size: 12px; line-height: 1.5; }

.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.form-group { margin-bottom: 20px; }
.label-row { display: flex; align-items: center; justify-content: space-between; }
.form-label { display: block; margin-bottom: 7px; color: #374151; font-size: 13px; font-weight: 600; }
.character-count, .form-help { color: #9ca3af; font-size: 12px; }
.character-count { margin-bottom: 7px; }

.form-input {
  width: 100%;
  min-height: 42px;
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #1f2937;
  font: inherit;
  font-size: 14px;
  outline: none;
}

.description-input { min-height: 112px; resize: vertical; line-height: 1.6; }
.form-input:focus, .tag-input:focus-within { border-color: #1a233d; box-shadow: 0 0 0 3px rgba(26, 35, 61, 0.08); }
.form-input.invalid, .tag-input.invalid { border-color: #ef4444; }
.form-help, .form-error { margin: 6px 0 0; }
.form-error { color: #dc2626; font-size: 12px; }

.image-field { display: flex; align-items: center; gap: 14px; }
.image-preview { width: 64px; height: 64px; border-radius: 50%; background: #e8edf5; color: #1a233d; display: flex; align-items: center; justify-content: center; overflow: hidden; font-size: 22px; font-weight: 700; }
.image-preview img { width: 100%; height: 100%; object-fit: cover; }
.image-button { height: 38px; padding: 0 13px; border: 1px solid #d1d5db; border-radius: 6px; display: inline-flex; align-items: center; color: #374151; font-size: 13px; cursor: pointer; }
.image-button input { display: none; }

.tag-input { min-height: 46px; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.tag-input input { min-width: 180px; height: 30px; padding: 0 4px; border: 0; outline: 0; flex: 1; font: inherit; font-size: 14px; }
.tag { min-height: 28px; padding: 0 6px 0 10px; border-radius: 999px; background: #eef2f7; color: #334155; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; }
.tag button { width: 20px; height: 20px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: #64748b; font-size: 16px; cursor: pointer; }

.visibility-control { padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; display: flex; align-items: flex-start; gap: 11px; cursor: pointer; }
.visibility-control input { width: 17px; height: 17px; margin: 2px 0 0; accent-color: #1a233d; }
.visibility-control span { display: flex; flex-direction: column; gap: 3px; }
.visibility-control strong { color: #374151; font-size: 13px; }
.visibility-control small { color: #9ca3af; font-size: 12px; line-height: 1.5; }

.form-actions { margin-top: 24px; display: flex; justify-content: flex-end; gap: 9px; }
.form-actions button { min-width: 92px; height: 40px; padding: 0 14px; border-radius: 6px; font-size: 13px; cursor: pointer; }
.cancel-button { border: 1px solid #d1d5db; background: #fff; color: #374151; }
.submit-button { border: 1px solid #1a233d; background: #1a233d; color: #fff; }
.form-actions button:disabled, .tag button:disabled { opacity: 0.55; cursor: not-allowed; }

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; gap: 0; }
  .profile-form { padding: 18px; }
}
</style>
