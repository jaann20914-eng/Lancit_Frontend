<template>
  <div class="page">
    <header class="page-header">
      <h1>{{ isEdit ? '공고 수정' : '공고 등록' }}</h1>
      <p>{{ isEdit ? '등록한 공고의 내용을 수정합니다.' : '프로젝트에 꼭 맞는 프리랜서를 모집해보세요.' }}</p>
    </header>

    <div v-if="isLoading" class="state-card">
      <span class="spinner" aria-hidden="true"></span>
      <p>공고 정보를 불러오고 있습니다.</p>
    </div>

    <div v-else-if="loadError" class="state-card error-state">
      <p>{{ loadError }}</p>
      <button type="button" class="retry-button" @click="loadInitialValue">다시 시도</button>
    </div>

    <form v-else class="editor-form" @submit.prevent="handleSubmit">
      <div v-if="submitError" class="submit-error" role="alert">{{ submitError }}</div>

      <section class="form-section">
        <div class="section-heading">
          <h2>기본 정보</h2>
          <p><span class="required">*</span> 표시는 필수 입력 항목입니다.</p>
        </div>

        <div class="form-group full">
          <div class="label-row">
            <label for="recruitment-title">공고 제목 <span class="required">*</span></label>
            <span>{{ form.title.length }}/255</span>
          </div>
          <input id="recruitment-title" v-model="form.title" maxlength="255" class="form-control" :class="{ invalid: errors.title }" placeholder="예: 쇼핑몰 웹 서비스 개발자를 찾습니다" />
          <p v-if="errors.title" class="form-error">{{ errors.title }}</p>
        </div>

        <div class="form-group full">
          <div class="label-row">
            <label for="recruitment-summary">한 줄 요약 <span class="required">*</span></label>
            <span>{{ form.summary.length }}/100</span>
          </div>
          <input id="recruitment-summary" v-model="form.summary" maxlength="100" class="form-control" :class="{ invalid: errors.summary }" placeholder="공고의 핵심을 간단히 소개해주세요" />
          <p v-if="errors.summary" class="form-error">{{ errors.summary }}</p>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label for="job-category">직무 카테고리 <span class="required">*</span></label>
            <select id="job-category" v-model="form.jobCategory" class="form-control" :class="{ invalid: errors.jobCategory }">
              <option value="">직무를 선택하세요</option>
              <option v-for="option in JOB_CATEGORY_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
            <p v-if="errors.jobCategory" class="form-error">{{ errors.jobCategory }}</p>
          </div>
          <div class="form-group">
            <label for="recruitment-category">공고 카테고리 <span class="required">*</span></label>
            <select id="recruitment-category" v-model="form.recruitmentCategory" class="form-control" :class="{ invalid: errors.recruitmentCategory }">
              <option value="">분야를 선택하세요</option>
              <option v-for="option in RECRUITMENT_CATEGORY_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
            <p v-if="errors.recruitmentCategory" class="form-error">{{ errors.recruitmentCategory }}</p>
          </div>
        </div>
      </section>

      <section class="form-section">
        <div class="section-heading"><h2>상세 내용</h2><p>업무 범위와 기대 결과를 구체적으로 작성해주세요.</p></div>
        <div class="form-group full">
          <label for="recruitment-content">공고 내용 <span class="required">*</span></label>
          <textarea id="recruitment-content" v-model="form.content" rows="9" class="form-control textarea" :class="{ invalid: errors.content }" placeholder="프로젝트 소개, 주요 업무, 기대 결과를 작성해주세요"></textarea>
          <p v-if="errors.content" class="form-error">{{ errors.content }}</p>
        </div>
        <div class="form-group full">
          <label for="requirements">요구사항</label>
          <textarea id="requirements" v-model="form.requirements" rows="5" class="form-control textarea" placeholder="필요 경력, 필수 역량, 우대사항을 작성해주세요"></textarea>
        </div>
        <div class="form-group full">
          <label for="tech-stacks">기술 스택</label>
          <input id="tech-stacks" v-model="form.techStacks" class="form-control" :class="{ invalid: errors.techStacks }" placeholder="Vue, JavaScript, Figma (쉼표로 구분)" />
          <p v-if="errors.techStacks" class="form-error">{{ errors.techStacks }}</p>
          <p v-else class="form-help">각 태그는 50자 이하이며 쉼표로 구분해 전송됩니다.</p>
        </div>
      </section>

      <section class="form-section">
        <div class="section-heading"><h2>예산 및 일정</h2><p>일정은 선택 사항이며 시작일보다 종료일이 빠를 수 없습니다.</p></div>
        <div class="form-grid">
          <div class="form-group">
            <label for="budget">예상 예산</label>
            <div class="input-suffix"><input id="budget" v-model.number="form.budget" type="number" min="0" step="1" class="form-control" :class="{ invalid: errors.budget }" /><span>원</span></div>
            <p v-if="errors.budget" class="form-error">{{ errors.budget }}</p>
          </div>
          <div class="form-group">
            <label for="work-location">근무 위치</label>
            <input id="work-location" v-model="form.workLocation" maxlength="255" class="form-control" placeholder="예: 서울 강남구 / 원격 병행" />
          </div>
        </div>

        <div class="form-grid">
          <div class="form-group"><label for="recruitment-start">모집 시작일</label><input id="recruitment-start" v-model="form.recruitmentStartAt" type="date" class="form-control" :class="{ invalid: errors.recruitmentPeriod }" /></div>
          <div class="form-group"><label for="recruitment-end">모집 마감일</label><input id="recruitment-end" v-model="form.recruitmentEndAt" type="date" :min="minimumDeadline" class="form-control" :class="{ invalid: errors.recruitmentPeriod || errors.deadline }" /></div>
        </div>
        <p v-if="errors.deadline || errors.recruitmentPeriod" class="form-error period-error">{{ errors.deadline || errors.recruitmentPeriod }}</p>

        <div class="form-grid contract-dates">
          <div class="form-group"><label for="contract-start">예상 계약 시작일</label><input id="contract-start" v-model="form.contractStartAt" type="date" class="form-control" :class="{ invalid: errors.contractPeriod }" /></div>
          <div class="form-group"><label for="contract-end">예상 계약 종료일</label><input id="contract-end" v-model="form.contractEndAt" type="date" class="form-control" :class="{ invalid: errors.contractPeriod }" /></div>
        </div>
        <p v-if="errors.contractPeriod" class="form-error period-error">{{ errors.contractPeriod }}</p>
      </section>

      <section class="form-section">
        <div class="section-heading"><h2>공고 이미지</h2><p>백엔드 파일 API를 통해 이미지 1개를 등록할 수 있습니다.</p></div>
        <label class="file-control">
          <input type="file" accept="image/*" @change="handleImageChange" />
          <span>{{ selectedImageName || (form.imageFileId ? '등록된 이미지 유지' : '이미지 선택') }}</span>
        </label>
        <p v-if="errors.image" class="form-error">{{ errors.image }}</p>
      </section>

      <div class="form-actions">
        <button type="button" class="cancel-button" :disabled="isSubmitting" @click="handleCancel">취소</button>
        <button type="submit" class="submit-button" :disabled="isSubmitting">
          {{ isSubmitting ? (isUploading ? '이미지 업로드 중...' : '저장 중...') : (isEdit ? '수정 완료' : '공고 등록') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createCompanyRecruitment,
  getCompanyRecruitment,
  updateCompanyRecruitment,
  uploadRecruitmentImage,
} from '@/features/company/recruitments/api/companyRecruitmentApi.js'
import { getCompanyApiError } from '@/features/company/recruitments/api/companyRecruitmentError.js'
import {
  JOB_CATEGORY_OPTIONS,
  normalizeTechStacks,
  RECRUITMENT_CATEGORY_OPTIONS,
  toDateInput,
} from '@/features/company/recruitments/api/companyRecruitmentMapper.js'

const route = useRoute()
const router = useRouter()

const form = reactive(createEmptyForm())
const errors = reactive({})
const isLoading = ref(false)
const isSubmitting = ref(false)
const isUploading = ref(false)
const loadError = ref('')
const submitError = ref('')
const selectedImage = ref(null)
const selectedImageName = ref('')

const recruitmentId = computed(() => route.params.recruitmentId ?? route.params.id)
const isEdit = computed(() => recruitmentId.value !== undefined)
const minimumDeadline = computed(() => {
  const today = new Date()
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
  return today.toISOString().slice(0, 10)
})

watch(recruitmentId, loadInitialValue, { immediate: true })

function createEmptyForm() {
  return {
    title: '', summary: '', content: '', requirements: '', jobCategory: '', recruitmentCategory: '',
    techStacks: '', workLocation: '', budget: 0, imageFileId: null,
    recruitmentStartAt: '', recruitmentEndAt: '', contractStartAt: '', contractEndAt: '',
  }
}

async function loadInitialValue() {
  Object.assign(form, createEmptyForm())
  clearErrors()
  loadError.value = ''
  submitError.value = ''
  selectedImage.value = null
  selectedImageName.value = ''

  if (!isEdit.value) {
    isLoading.value = false
    return
  }

  isLoading.value = true
  try {
    const data = await getCompanyRecruitment(recruitmentId.value)
    if (!data) throw new Error('Invalid recruitment response')
    if (!data.isMine) {
      loadError.value = '본인이 등록한 공고만 수정할 수 있습니다.'
      return
    }
    if (!data.canEdit) {
      loadError.value = '지원자가 있는 공고는 수정할 수 없습니다.'
      return
    }
    Object.assign(form, {
      title: data.title,
      summary: data.summary,
      content: data.content,
      requirements: data.requirements,
      jobCategory: data.jobCategory,
      recruitmentCategory: data.recruitmentCategory,
      techStacks: data.techStacks.join(', '),
      workLocation: data.workLocation,
      budget: data.budget,
      imageFileId: data.imageFileId,
      recruitmentStartAt: toDateInput(data.recruitmentStartAt),
      recruitmentEndAt: toDateInput(data.recruitmentEndAt),
      contractStartAt: toDateInput(data.contractStartAt),
      contractEndAt: toDateInput(data.contractEndAt),
    })
  } catch (error) {
    loadError.value = getCompanyApiError(error, '공고 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    isLoading.value = false
  }
}

function clearErrors() { Object.keys(errors).forEach((key) => delete errors[key]) }

function validateForm() {
  clearErrors()
  if (!form.title.trim()) errors.title = '공고 제목을 입력해주세요.'
  if (!form.summary.trim()) errors.summary = '한 줄 요약을 입력해주세요.'
  if (!form.content.trim()) errors.content = '공고 내용을 입력해주세요.'
  if (!form.jobCategory) errors.jobCategory = '직무 카테고리를 선택해주세요.'
  if (!form.recruitmentCategory) errors.recruitmentCategory = '공고 카테고리를 선택해주세요.'
  if (!Number.isFinite(Number(form.budget)) || Number(form.budget) < 0) errors.budget = '예산은 0 이상이어야 합니다.'

  const stacks = normalizeTechStacks(form.techStacks)
  if (stacks.some((stack) => stack.length > 50)) errors.techStacks = '기술 스택 태그는 각각 50자 이하여야 합니다.'
  if (form.recruitmentEndAt && form.recruitmentEndAt < minimumDeadline.value) errors.deadline = '모집 마감일은 오늘보다 빠를 수 없습니다.'
  if (form.recruitmentStartAt && form.recruitmentEndAt && form.recruitmentStartAt > form.recruitmentEndAt) errors.recruitmentPeriod = '모집 종료일은 시작일보다 빠를 수 없습니다.'
  if (form.contractStartAt && form.contractEndAt && form.contractStartAt > form.contractEndAt) errors.contractPeriod = '계약 종료일은 시작일보다 빠를 수 없습니다.'
  return Object.keys(errors).length === 0
}

function handleImageChange(event) {
  const file = event.target.files?.[0] ?? null
  selectedImage.value = file
  selectedImageName.value = file?.name ?? ''
  delete errors.image
  if (file && !file.type.startsWith('image/')) {
    errors.image = '이미지 파일만 등록할 수 있습니다.'
    selectedImage.value = null
  }
}

async function handleSubmit() {
  if (!validateForm()) return
  isSubmitting.value = true
  submitError.value = ''

  try {
    if (selectedImage.value) {
      isUploading.value = true
      const uploaded = await uploadRecruitmentImage(selectedImage.value)
      if (!uploaded?.fileId) throw new Error('Invalid file upload response')
      form.imageFileId = uploaded.fileId
      isUploading.value = false
    }

    if (isEdit.value) {
      const updated = await updateCompanyRecruitment(recruitmentId.value, form)
      router.push({ name: 'CompanyRecruitmentDetail', params: { recruitmentId: updated?.recruitmentId ?? recruitmentId.value } })
      return
    }

    const created = await createCompanyRecruitment(form)
    if (created?.recruitmentId !== null && created?.recruitmentId !== undefined) {
      router.push({ name: 'CompanyRecruitmentDetail', params: { recruitmentId: created.recruitmentId } })
    } else {
      router.push({ name: 'CompanyRecruitmentList' })
    }
  } catch (error) {
    submitError.value = getCompanyApiError(error, '공고를 저장하지 못했습니다. 입력 내용을 확인하고 다시 시도해주세요.')
  } finally {
    isUploading.value = false
    isSubmitting.value = false
  }
}

function handleCancel() {
  router.push(isEdit.value
    ? { name: 'CompanyRecruitmentDetail', params: { recruitmentId: recruitmentId.value } }
    : { name: 'CompanyRecruitmentList' })
}
</script>

<style scoped>
.page { width: 100%; max-width: 900px; margin: 0 auto; padding: 32px; color: #1f2937; }
.page-header { margin-bottom: 24px; }
.page-header h1 { margin: 0 0 6px; color: #1a233d; font-size: 24px; }
.page-header p { margin: 0; color: #6b7280; font-size: 14px; }
.editor-form { display: grid; gap: 16px; }
.form-section { padding: 28px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; }
.section-heading { margin-bottom: 24px; display: flex; align-items: baseline; justify-content: space-between; gap: 14px; }
.section-heading h2 { margin: 0; color: #1a233d; font-size: 17px; }
.section-heading p { margin: 0; color: #9ca3af; font-size: 11px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 18px; }
.form-group { margin-bottom: 20px; }
.form-group:last-child, .form-grid .form-group { margin-bottom: 0; }
.form-group.full + .form-group.full { margin-top: 20px; }
.form-group label, .label-row label { margin-bottom: 7px; color: #374151; display: block; font-size: 13px; font-weight: 600; }
.label-row { display: flex; justify-content: space-between; }
.label-row > span { color: #9ca3af; font-size: 11px; }
.required { color: #dc2626; }
.form-control { width: 100%; min-height: 42px; padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #1f2937; font: inherit; font-size: 14px; outline: none; }
.form-control:focus { border-color: #1a233d; box-shadow: 0 0 0 3px rgba(26,35,61,.08); }
.form-control.invalid { border-color: #ef4444; }
.textarea { resize: vertical; line-height: 1.65; }
.form-error { margin: 6px 0 0; color: #dc2626; font-size: 11px; }
.form-help { margin: 6px 0 0; color: #9ca3af; font-size: 11px; }
.period-error { margin: 7px 0 0; }
.contract-dates { margin-top: 20px; }
.input-suffix { position: relative; }
.input-suffix input { padding-right: 40px; }
.input-suffix span { position: absolute; top: 50%; right: 12px; transform: translateY(-50%); color: #9ca3af; font-size: 12px; }
.file-control { min-height: 76px; padding: 16px; border: 1px dashed #cbd5e1; border-radius: 8px; background: #fafafa; display: flex; align-items: center; gap: 12px; cursor: pointer; }
.file-control input { max-width: 210px; }
.file-control span { color: #6b7280; font-size: 12px; overflow-wrap: anywhere; }
.submit-error { padding: 13px 15px; border: 1px solid #fecaca; border-radius: 7px; background: #fef2f2; color: #b91c1c; font-size: 13px; }
.form-actions { padding-top: 8px; display: flex; justify-content: flex-end; gap: 9px; }
.cancel-button, .submit-button, .retry-button { min-height: 42px; padding: 0 20px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
.cancel-button, .retry-button { border: 1px solid #d1d5db; background: white; color: #4b5563; }
.submit-button { min-width: 120px; border: 0; background: #1a233d; color: white; }
.form-actions button:disabled { opacity: .55; cursor: not-allowed; }
.state-card { min-height: 340px; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; color: #6b7280; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.state-card p { margin: 14px 0 0; }
.error-state { color: #b91c1c; }
.retry-button { margin-top: 18px; }
.spinner { width: 28px; height: 28px; border: 3px solid #dce2eb; border-top-color: #1a233d; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 700px) { .page { padding: 24px 18px; } .form-section { padding: 22px 18px; } .form-grid { grid-template-columns: 1fr; } .section-heading { align-items: flex-start; flex-direction: column; } .contract-dates { margin-top: 18px; } }
</style>
