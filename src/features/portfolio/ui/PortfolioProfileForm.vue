<template>
  <form class="profile-form" @submit.prevent="handleSubmit">
    <div v-if="errorMessage" class="submit-error" role="alert">{{ errorMessage }}</div>

    <div class="form-group">
      <div class="label-row">
        <label for="portfolio-profile-intro" class="form-label">한 줄 소개</label>
        <span class="character-count"
          >{{ form.intro.length }}/{{ PORTFOLIO_PROFILE_INTRO_MAX_LENGTH }}</span
        >
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
      <p v-else class="form-help">백엔드 제한에 따라 30자까지 입력할 수 있습니다.</p>
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
        <strong>포트폴리오 프로필 공개</strong>
        <small>기업이 내 포트폴리오 프로필과 공개 프로젝트를 확인할 수 있습니다.</small>
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
import { reactive, ref, watch } from 'vue'
import {
  normalizeTechStacks,
  PORTFOLIO_PROFILE_INTRO_MAX_LENGTH,
  PORTFOLIO_PROFILE_TECH_STACK_MAX_LENGTH,
} from '@/features/portfolio/api/portfolioProfileMapper.js'

const props = defineProps({
  initialValue: {
    type: Object,
    required: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['submit', 'cancel'])

const form = reactive({
  intro: '',
  techStacks: [],
  isPortfolioPublic: false,
})
const techStackInput = ref('')
const errors = reactive({})

watch(
  () => props.initialValue,
  (value) => {
    form.intro = typeof value?.intro === 'string' ? value.intro : ''
    form.techStacks = normalizeTechStacks(value?.techStacks)
    form.isPortfolioPublic = Boolean(value?.isPortfolioPublic)
    techStackInput.value = ''
    clearErrors()
  },
  { immediate: true },
)

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
  const invalid = candidates.find(
    (techStack) => techStack.length > PORTFOLIO_PROFILE_TECH_STACK_MAX_LENGTH,
  )
  if (invalid) {
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

function handleSubmit() {
  clearErrors()
  commitTechStack()

  const intro = form.intro.trim()
  if (intro.length > PORTFOLIO_PROFILE_INTRO_MAX_LENGTH) {
    errors.intro = `한 줄 소개는 ${PORTFOLIO_PROFILE_INTRO_MAX_LENGTH}자 이내로 입력해주세요.`
  }

  const invalidTechStack = form.techStacks.find(
    (techStack) => techStack.length > PORTFOLIO_PROFILE_TECH_STACK_MAX_LENGTH,
  )
  if (invalidTechStack) {
    errors.techStacks = `기술 스택은 항목당 ${PORTFOLIO_PROFILE_TECH_STACK_MAX_LENGTH}자 이내로 입력해주세요.`
  }

  if (Object.keys(errors).length) return

  emit('submit', {
    intro,
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
  background: #ffffff;
}

.submit-error {
  margin-bottom: 20px;
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
  font-weight: 600;
}

.character-count,
.form-help {
  color: #9ca3af;
  font-size: 12px;
}

.character-count {
  margin-bottom: 7px;
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
}

.form-input:focus,
.tag-input:focus-within {
  border-color: #1a233d;
  box-shadow: 0 0 0 3px rgba(26, 35, 61, 0.08);
}

.form-input.invalid,
.tag-input.invalid {
  border-color: #ef4444;
}

.form-help,
.form-error {
  margin: 6px 0 0;
}

.form-error {
  color: #dc2626;
  font-size: 12px;
}

.tag-input {
  min-height: 46px;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.tag-input input {
  min-width: 180px;
  height: 30px;
  padding: 0 4px;
  border: 0;
  outline: 0;
  flex: 1;
  color: #1f2937;
  font: inherit;
  font-size: 14px;
}

.tag {
  min-height: 28px;
  padding: 0 6px 0 10px;
  border-radius: 999px;
  background: #eef2f7;
  color: #334155;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.tag button {
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #64748b;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.tag button:hover {
  background: #dce2eb;
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
  color: #374151;
  font-size: 13px;
}

.visibility-control small {
  color: #9ca3af;
  font-size: 12px;
}

.form-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 9px;
}

.form-actions button {
  min-width: 92px;
  height: 40px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.cancel-button {
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #374151;
}

.submit-button {
  border: 1px solid #1a233d;
  background: #1a233d;
  color: #ffffff;
}

.form-actions button:disabled,
.tag button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
