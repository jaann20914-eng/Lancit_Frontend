<template>
  <div class="page">
    <div class="top-actions">
      <button type="button" class="back-button" @click="goToList">← 공고 목록</button>
      <div v-if="recruitment && isOwner" class="management-actions">
        <button type="button" class="applicants-button" @click="goToApplicants">
          지원자 보기 ({{ recruitment.applicantCount }})
        </button>
        <button
          type="button"
          class="edit-button"
          :disabled="!recruitment.canEdit"
          :title="recruitment.canEdit ? '' : '지원자가 있는 공고는 수정할 수 없습니다.'"
          @click="goToEdit"
        >
          수정
        </button>
        <select
          v-if="recruitment.canChangeStatus"
          class="status-select"
          :disabled="isChangingStatus"
          aria-label="공고 상태 변경"
          @change="handleStatusChange"
        >
          <option value="">상태 변경</option>
          <option v-if="recruitment.status !== 'OPEN'" value="OPEN">모집중으로 변경</option>
          <option v-if="recruitment.status !== 'CLOSED'" value="CLOSED">마감으로 변경</option>
          <option v-if="recruitment.status !== 'CANCELLED'" value="CANCELLED">취소로 변경</option>
        </select>
        <button
          type="button"
          class="delete-button"
          :disabled="!recruitment.canDelete || isDeleting"
          :title="recruitment.canDelete ? '' : '지원자가 있는 공고는 삭제할 수 없습니다.'"
          @click="handleDelete"
        >
          {{ isDeleting ? '삭제 중...' : '삭제' }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="state-card">
      <span class="spinner" aria-hidden="true"></span>
      <p>공고 정보를 불러오고 있습니다.</p>
    </div>

    <div v-else-if="errorMessage" class="state-card error-state">
      <p>{{ errorMessage }}</p>
      <button type="button" class="retry-button" @click="loadRecruitment">다시 시도</button>
    </div>

    <article v-else-if="recruitment" class="detail-card">
      <img v-if="imageUrl" :src="imageUrl" :alt="`${recruitment.title} 공고 이미지`" class="cover-image" />

      <header class="detail-heading">
        <div class="badge-row">
          <span :class="['status-badge', recruitment.statusMeta.className]">{{ recruitment.statusMeta.label }}</span>
          <span class="category-badge">{{ recruitment.jobCategoryLabel }}</span>
          <span class="category-badge light">{{ recruitment.recruitmentCategoryLabel }}</span>
        </div>
        <h1>{{ recruitment.title || '제목 없는 공고' }}</h1>
        <p class="summary">{{ recruitment.summary || '등록된 요약이 없습니다.' }}</p>
        <p class="company-name">{{ recruitment.companyName || recruitment.companyEmail }}</p>
      </header>

      <dl class="information-grid">
        <div><dt>예산</dt><dd>{{ formatBudget(recruitment.budget) }}</dd></div>
        <div><dt>근무 위치</dt><dd>{{ recruitment.workLocation || '협의' }}</dd></div>
        <div><dt>모집 기간</dt><dd>{{ formatPeriod(recruitment.recruitmentStartAt, recruitment.recruitmentEndAt) }}</dd></div>
        <div><dt>예상 계약 기간</dt><dd>{{ formatPeriod(recruitment.contractStartAt, recruitment.contractEndAt) }}</dd></div>
        <div><dt>지원자 수</dt><dd>{{ recruitment.applicantCount }}명</dd></div>
        <div><dt>등록일</dt><dd>{{ formatDate(recruitment.createdAt) }}</dd></div>
      </dl>

      <section v-if="recruitment.techStacks.length" class="detail-section">
        <h2>기술 스택</h2>
        <div class="tech-stack-row">
          <span v-for="techStack in recruitment.techStacks" :key="techStack" class="tech-tag">{{ techStack }}</span>
        </div>
      </section>

      <section class="detail-section">
        <h2>공고 내용</h2>
        <p class="content">{{ recruitment.content || '등록된 상세 내용이 없습니다.' }}</p>
      </section>

      <section v-if="recruitment.requirements" class="detail-section">
        <h2>요구사항</h2>
        <p class="content">{{ recruitment.requirements }}</p>
      </section>

      <footer class="detail-footer">
        <span>최근 수정 {{ formatDateTime(recruitment.updatedAt) }}</span>
        <span v-if="isOwner && !recruitment.canEdit" class="permission-note">
          지원자가 있는 공고는 내용 수정 및 삭제가 제한됩니다.
        </span>
        <span v-else-if="!isOwner" class="permission-note">다른 기업의 공고는 조회만 가능합니다.</span>
      </footer>
    </article>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/model/authStore.js'
import {
  deleteCompanyRecruitment,
  getCompanyRecruitment,
  getFileUrl,
  updateCompanyRecruitmentStatus,
} from '@/features/company/recruitments/api/companyRecruitmentApi.js'
import { getCompanyApiError } from '@/features/company/recruitments/api/companyRecruitmentError.js'
import {
  formatBudget,
  formatDate,
  formatDateTime,
  getRecruitmentStatusMeta,
} from '@/features/company/recruitments/api/companyRecruitmentMapper.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const recruitment = ref(null)
const imageUrl = ref('')
const isLoading = ref(true)
const isDeleting = ref(false)
const isChangingStatus = ref(false)
const errorMessage = ref('')

const recruitmentId = () => route.params.recruitmentId ?? route.params.id
const isOwner = computed(() => {
  const currentCompanyEmail = normalizeEmail(authStore.email)
  const recruitmentCompanyEmail = normalizeEmail(recruitment.value?.companyEmail)
  return Boolean(currentCompanyEmail && recruitmentCompanyEmail && currentCompanyEmail === recruitmentCompanyEmail)
})

watch(() => recruitmentId(), loadRecruitment, { immediate: true })

async function loadRecruitment() {
  isLoading.value = true
  errorMessage.value = ''
  imageUrl.value = ''
  try {
    const data = await getCompanyRecruitment(recruitmentId())
    if (!data) throw new Error('Invalid recruitment response')
    recruitment.value = data
    if (data.imageFileId !== null) {
      try {
        imageUrl.value = (await getFileUrl(data.imageFileId)) || ''
      } catch {
        imageUrl.value = ''
      }
    }
  } catch (error) {
    recruitment.value = null
    errorMessage.value = getCompanyApiError(error, '공고 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    isLoading.value = false
  }
}

function formatPeriod(start, end) {
  if (!start && !end) return '미정'
  return `${start ? formatDate(start) : '미정'} ~ ${end ? formatDate(end) : '미정'}`
}

async function handleStatusChange(event) {
  const status = event.target.value
  event.target.value = ''
  if (!status || !isOwner.value || !recruitment.value?.canChangeStatus) return
  const label = getRecruitmentStatusMeta(status).label
  if (!confirm(`공고 상태를 '${label}'(으)로 변경하시겠습니까?`)) return

  isChangingStatus.value = true
  try {
    recruitment.value = await updateCompanyRecruitmentStatus(recruitmentId(), status)
  } catch (error) {
    alert(getCompanyApiError(error, '공고 상태를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.'))
  } finally {
    isChangingStatus.value = false
  }
}

async function handleDelete() {
  if (!isOwner.value || !recruitment.value?.canDelete) return
  if (!confirm(`'${recruitment.value.title}' 공고를 삭제하시겠습니까?`)) return
  isDeleting.value = true
  try {
    await deleteCompanyRecruitment(recruitmentId())
    router.push({ name: 'CompanyRecruitmentList' })
  } catch (error) {
    alert(getCompanyApiError(error, '공고를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.'))
  } finally {
    isDeleting.value = false
  }
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function goToList() {
  router.push({
    name: 'CompanyRecruitmentList',
    query: route.query.scope === 'all' ? { scope: 'all' } : {},
  })
}

function goToEdit() {
  if (!isOwner.value) return
  router.push({ name: 'CompanyRecruitmentEdit', params: { recruitmentId: recruitmentId() } })
}

function goToApplicants() {
  if (!isOwner.value) return
  router.push({ name: 'CompanyApplicantList', params: { recruitmentId: recruitmentId() } })
}
</script>

<style scoped>
.page { width: 100%; max-width: 1000px; margin: 0 auto; padding: 32px; color: #1f2937; }
.top-actions { margin-bottom: 18px; display: flex; justify-content: space-between; gap: 14px; }
.management-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.back-button, .management-actions button, .status-select, .retry-button { min-height: 38px; padding: 0 13px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #4b5563; font-size: 13px; cursor: pointer; }
.applicants-button { border-color: #1a233d !important; color: #1a233d !important; font-weight: 600; }
.delete-button { border-color: #fecaca !important; color: #dc2626 !important; }
.management-actions button:disabled, .status-select:disabled { opacity: .45; cursor: not-allowed; }
.detail-card, .state-card { border: 1px solid #e5e7eb; border-radius: 12px; background: white; overflow: hidden; }
.cover-image { width: 100%; max-height: 340px; object-fit: cover; display: block; }
.detail-heading { padding: 32px; border-bottom: 1px solid #e5e7eb; }
.badge-row { display: flex; flex-wrap: wrap; gap: 7px; }
.status-badge, .category-badge, .tech-tag { min-height: 26px; padding: 0 10px; border-radius: 999px; display: inline-flex; align-items: center; font-size: 11px; font-weight: 600; }
.status-open { background: #dcfce7; color: #15803d; }
.status-closed, .status-expired { background: #f3f4f6; color: #4b5563; }
.status-cancelled, .status-unknown { background: #fee2e2; color: #991b1b; }
.category-badge { background: #e8edf5; color: #1a233d; }
.category-badge.light { background: #f3f4f6; color: #6b7280; }
.detail-heading h1 { margin: 18px 0 8px; color: #1a233d; font-size: 28px; line-height: 1.35; }
.summary { margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6; }
.company-name { margin: 10px 0 0; color: #9ca3af; font-size: 12px; }
.information-grid { margin: 0; padding: 24px 32px; border-bottom: 1px solid #e5e7eb; background: #fafafa; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.information-grid dt { margin-bottom: 5px; color: #9ca3af; font-size: 11px; }
.information-grid dd { margin: 0; color: #374151; font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
.detail-section { padding: 28px 32px; border-bottom: 1px solid #e5e7eb; }
.detail-section h2 { margin: 0 0 15px; color: #1a233d; font-size: 17px; }
.content { margin: 0; color: #4b5563; font-size: 14px; line-height: 1.85; white-space: pre-wrap; overflow-wrap: anywhere; }
.tech-stack-row { display: flex; flex-wrap: wrap; gap: 7px; }
.tech-tag { background: #f0f4f9; color: #4a6fa5; font-weight: 500; }
.detail-footer { padding: 17px 32px; color: #9ca3af; font-size: 11px; display: flex; justify-content: space-between; gap: 12px; }
.permission-note { color: #b45309; }
.state-card { min-height: 350px; padding: 40px; color: #6b7280; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.state-card p { margin: 14px 0 0; }
.error-state { color: #b91c1c; }
.retry-button { margin-top: 18px; }
.spinner { width: 28px; height: 28px; border: 3px solid #dce2eb; border-top-color: #1a233d; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 760px) { .page { padding: 24px 18px; } .top-actions { flex-direction: column; } .management-actions { justify-content: flex-start; } .information-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } .detail-heading, .detail-section { padding: 24px; } }
@media (max-width: 480px) { .information-grid { grid-template-columns: 1fr; } .detail-footer { flex-direction: column; } }
</style>
