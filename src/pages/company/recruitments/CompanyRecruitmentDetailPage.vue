<template>
  <div class="page">
    <div class="top-actions">
      <button type="button" class="back-button" @click="goBack">← {{ backButtonText }}</button>
      <div
        v-if="recruitment && isOwner && routeQuery.from !== 'proposal-select'"
        class="management-actions"
      >
        <button type="button" class="copy-button" @click="goToCopy">재등록</button>
        <button
          type="button"
          class="edit-button"
          :disabled="!recruitment.canEdit"
          :title="recruitment.canEdit ? '' : '지원자가 있는 공고는 수정할 수 없습니다.'"
          @click="goToEdit"
        >
          수정
        </button>
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

    <template v-else-if="recruitment">
      <article class="detail-card">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="`${recruitment.title} 공고 이미지`"
          class="cover-image"
        />

        <header class="detail-heading">
          <div class="badge-row">
            <span class="category-badge">{{ recruitment.jobCategoryLabel }}</span>
            <span class="category-badge light">{{ recruitment.recruitmentCategoryLabel }}</span>
            <div
              v-if="isOwner && recruitment.canChangeStatus"
              class="status-actions heading-status-actions"
              aria-label="공고 상태 변경"
            >
              <button
                v-for="statusOption in DETAIL_STATUS_OPTIONS"
                :key="statusOption.value"
                type="button"
                :class="[
                  'status-choice',
                  statusOption.className,
                  { active: recruitment.status === statusOption.value },
                ]"
                :aria-pressed="recruitment.status === statusOption.value"
                :disabled="isChangingStatus"
                @click="handleStatusChange(statusOption.value)"
              >
                {{ statusOption.label }}
              </button>
            </div>
            <span
              v-else
              :class="['status-badge', 'heading-status', recruitment.statusMeta.className]"
            >
              {{ recruitment.statusMeta.label }}
            </span>
          </div>
          <h1>{{ recruitment.title || '제목 없는 공고' }}</h1>
          <p class="summary">{{ recruitment.summary || '등록된 요약이 없습니다.' }}</p>
          <p class="company-name">{{ recruitment.companyName || recruitment.companyEmail }}</p>
        </header>

        <dl class="information-grid">
          <div>
            <dt>예산</dt>
            <dd>{{ formatBudget(recruitment.budget) }}</dd>
          </div>
          <div>
            <dt>근무 위치</dt>
            <dd>{{ recruitment.workLocation || '협의' }}</dd>
          </div>
          <div>
            <dt>모집 기간</dt>
            <dd>
              {{ formatPeriod(recruitment.recruitmentStartAt, recruitment.recruitmentEndAt) }}
            </dd>
          </div>
          <div>
            <dt>예상 계약 기간</dt>
            <dd>{{ formatPeriod(recruitment.contractStartAt, recruitment.contractEndAt) }}</dd>
          </div>
          <div>
            <dt>지원자 수</dt>
            <dd>{{ recruitment.applicantCount }}명</dd>
          </div>
          <div>
            <dt>등록일</dt>
            <dd>{{ formatDate(recruitment.createdAt) }}</dd>
          </div>
        </dl>

        <section v-if="recruitment.techStacks.length" class="detail-section">
          <h2>기술 스택</h2>
          <div class="tech-stack-row">
            <span v-for="techStack in recruitment.techStacks" :key="techStack" class="tech-tag">{{
              techStack
            }}</span>
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
          <span v-else-if="!isOwner" class="permission-note"
            >다른 기업의 공고는 조회만 가능합니다.</span
          >
        </footer>
      </article>

      <section v-if="isOwner" class="applicant-section">
        <header class="applicant-section-heading">
          <div>
            <h2>지원자 목록</h2>
            <p>이 공고에 지원한 프리랜서를 확인할 수 있습니다.</p>
          </div>
          <span class="applicant-count"
            >{{ applicationsPagination.totalElements.toLocaleString('ko-KR') }}명</span
          >
        </header>

        <div v-if="isApplicationsLoading" class="applicant-state">
          <span class="spinner" aria-hidden="true"></span>
          <p>지원자 목록을 불러오고 있습니다.</p>
        </div>

        <div v-else-if="applicationsError" class="applicant-state error-state">
          <p>{{ applicationsError }}</p>
          <BaseButton variant="outline" size="sm" @click="loadApplications">다시 시도</BaseButton>
        </div>

        <div v-else-if="!applications.length" class="applicant-state empty-applicant-state">
          <div class="empty-icon" aria-hidden="true">♙</div>
          <h3>아직 지원자가 없습니다.</h3>
          <p>새로운 지원자가 생기면 이곳에서 확인할 수 있습니다.</p>
        </div>

        <template v-else>
          <p class="view-note">상세 보기를 열면 최초 열람 시간이 기록됩니다.</p>
          <div class="application-list">
            <article
              v-for="application in applications"
              :key="application.applicationId"
              class="application-card"
            >
              <div class="applicant-avatar" aria-hidden="true">{{ getInitial(application) }}</div>
              <div class="applicant-main">
                <div class="name-row">
                  <h3>{{ application.applicantName || '이름 미등록' }}</h3>
                  <span v-if="!application.viewedAt" class="new-badge">NEW</span>
                  <span :class="['application-status-badge', application.statusMeta.className]">
                    {{ application.statusMeta.label }}
                  </span>
                </div>
                <p class="applicant-email">{{ application.applicantEmail }}</p>
                <p class="applicant-intro">
                  {{ application.intro || '등록된 상세 소개가 없습니다.' }}
                </p>
                <div class="applicant-meta-row">
                  <span>지원일 {{ formatDateTime(application.appliedAt) }}</span>
                  <span>포트폴리오 {{ application.portfolios.length }}개</span>
                  <span>{{
                    application.viewedAt ? `열람 ${formatDateTime(application.viewedAt)}` : '미열람'
                  }}</span>
                </div>
              </div>
              <BaseButton
                variant="secondary"
                size="sm"
                @click="goToApplicationDetail(application.applicationId)"
              >
                상세 보기
              </BaseButton>
            </article>
          </div>

          <BasePagination
            :current-page="applicationsPagination.page"
            :total-pages="applicationsPagination.totalPages"
            :total-elements="applicationsPagination.totalElements"
            :page-size="applicationsPagination.size"
            :disabled="isApplicationsLoading"
            @change="changeApplicationsPage"
          />
        </template>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/model/authStore.js'
import { getCompanyApplications } from '@/features/company/applicants/api/companyApplicationApi.js'
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
import BaseButton from '@/shared/ui/BaseButton.vue'
import BasePagination from '@/shared/ui/BasePagination.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const routeQuery = computed(() => route.query || {})
const DETAIL_STATUS_OPTIONS = [
  { value: 'OPEN', label: '모집중', className: 'status-choice-open' },
  { value: 'CLOSED', label: '마감', className: 'status-choice-closed' },
  { value: 'CANCELLED', label: '취소', className: 'status-choice-cancelled' },
]

const recruitment = ref(null)
const imageUrl = ref('')
const isLoading = ref(true)
const isDeleting = ref(false)
const isChangingStatus = ref(false)
const errorMessage = ref('')
const applications = ref([])
const isApplicationsLoading = ref(false)
const applicationsError = ref('')
const applicationsPagination = reactive({
  page: 1,
  size: 5,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
})

const recruitmentId = () => route.params.recruitmentId ?? route.params.id
const isOwner = computed(() => {
  const currentCompanyEmail = normalizeEmail(authStore.email)
  const recruitmentCompanyEmail = normalizeEmail(recruitment.value?.companyEmail)
  return Boolean(
    currentCompanyEmail &&
    recruitmentCompanyEmail &&
    currentCompanyEmail === recruitmentCompanyEmail,
  )
})

const backButtonText = computed(() => {
  switch (routeQuery.value.from) {
    case 'proposal-select':
      return '공고 선택 목록'

    default:
      return '공고 목록'
  }
})

watch(() => recruitmentId(), loadRecruitment, { immediate: true })

async function loadRecruitment() {
  isLoading.value = true
  errorMessage.value = ''
  imageUrl.value = ''
  applications.value = []
  applicationsError.value = ''
  Object.assign(applicationsPagination, {
    page: 1,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  try {
    const data = await getCompanyRecruitment(recruitmentId())
    if (!data) throw new Error('Invalid recruitment response')
    recruitment.value = data
    if (isOwner.value) loadApplications()
    if (data.imageFileId !== null) {
      try {
        imageUrl.value = (await getFileUrl(data.imageFileId)) || ''
      } catch {
        imageUrl.value = ''
      }
    }
  } catch (error) {
    recruitment.value = null
    errorMessage.value = getCompanyApiError(
      error,
      '공고 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    isLoading.value = false
  }
}

async function loadApplications() {
  if (!isOwner.value) return
  isApplicationsLoading.value = true
  applicationsError.value = ''
  try {
    const pageData = await getCompanyApplications(recruitmentId(), {
      page: applicationsPagination.page,
      size: applicationsPagination.size,
    })
    applications.value = pageData.content
    Object.assign(applicationsPagination, {
      page: pageData.page,
      size: pageData.size,
      totalElements: pageData.totalElements,
      totalPages: pageData.totalPages,
      hasNext: pageData.hasNext,
      hasPrev: pageData.hasPrev,
    })
  } catch (error) {
    applications.value = []
    applicationsError.value = getCompanyApiError(
      error,
      '지원자 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    isApplicationsLoading.value = false
  }
}

function formatPeriod(start, end) {
  if (!start && !end) return '미정'
  return `${start ? formatDate(start) : '미정'} ~ ${end ? formatDate(end) : '미정'}`
}

async function handleStatusChange(status) {
  if (
    !status ||
    !isOwner.value ||
    !recruitment.value?.canChangeStatus ||
    recruitment.value.status === status
  )
    return
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

function getInitial(application) {
  return (application.applicantName || application.applicantEmail || '?')
    .trim()
    .slice(0, 1)
    .toUpperCase()
}

function changeApplicationsPage(page) {
  applicationsPagination.page = page
  loadApplications()
}

function goBack() {
  const query = routeQuery.value

  switch (query.from) {
    case 'proposal-select':
      router.push({
        name: 'ProposalSelect',
        query: {
          freelancerEmail: query.freelancerEmail,
          page: query.page,
          selectedRecruitmentId: query.selectedRecruitmentId,
        },
      })
      break

    default:
      router.push({
        name: 'CompanyRecruitmentList',
        query: query.scope === 'all' ? { scope: 'all' } : {},
      })
  }
}

function goToEdit() {
  if (!isOwner.value) return
  router.push({ name: 'CompanyRecruitmentEdit', params: { recruitmentId: recruitmentId() } })
}

function goToCopy() {
  if (!isOwner.value) return
  router.push({ name: 'CompanyRecruitmentCreate', query: { copyFrom: recruitmentId() } })
}

function goToApplicationDetail(applicationId) {
  if (!isOwner.value) return
  router.push({
    name: 'CompanyApplicantDetail',
    params: { recruitmentId: recruitmentId(), applicationId },
  })
}
</script>

<style scoped>
.page {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--lancit-page-padding);
  color: #1f2937;
}
.top-actions {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  gap: 14px;
}
.management-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
.back-button,
.copy-button,
.edit-button,
.delete-button,
.retry-button {
  min-height: 38px;
  padding: 0 13px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #4b5563;
  font-size: 13px;
  cursor: pointer;
}
.delete-button {
  border-color: #fecaca !important;
  color: #dc2626 !important;
}
.edit-button:disabled,
.delete-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.status-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
}
.status-choice {
  min-height: 30px;
  padding: 0 11px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  opacity: 0.55;
  transition:
    opacity 0.15s,
    box-shadow 0.15s,
    transform 0.15s;
}
.status-choice:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}
.status-choice.active {
  opacity: 1;
  box-shadow: 0 0 0 2px rgba(26, 35, 61, 0.14);
}
.status-choice:disabled {
  cursor: wait;
  transform: none;
}
.status-choice-open {
  border-color: #bbf7d0;
  background: #dcfce7;
  color: #15803d;
}
.status-choice-closed {
  border-color: #d1d5db;
  background: #f3f4f6;
  color: #4b5563;
}
.status-choice-cancelled {
  border-color: #fecaca;
  background: #fee2e2;
  color: #991b1b;
}
.detail-card,
.state-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  overflow: hidden;
}
.cover-image {
  width: 100%;
  max-height: 340px;
  object-fit: cover;
  display: block;
}
.detail-heading {
  padding: 32px;
  border-bottom: 1px solid #e5e7eb;
}
.badge-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
}
.heading-status-actions {
  margin-left: auto;
}
.heading-status {
  margin-left: auto;
}
.status-badge,
.category-badge,
.tech-tag {
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
}
.status-open {
  background: #dcfce7;
  color: #15803d;
}
.status-closed,
.status-expired {
  background: #f3f4f6;
  color: #4b5563;
}
.status-cancelled,
.status-unknown {
  background: #fee2e2;
  color: #991b1b;
}
.category-badge {
  background: #e8edf5;
  color: #1a233d;
}
.category-badge.light {
  background: #f3f4f6;
  color: #6b7280;
}
.detail-heading h1 {
  margin: 18px 0 8px;
  color: #1a233d;
  font-size: 28px;
  line-height: 1.35;
}
.summary {
  margin: 0;
  color: #4b5563;
  font-size: 15px;
  line-height: 1.6;
}
.company-name {
  margin: 10px 0 0;
  color: #9ca3af;
  font-size: 12px;
}
.information-grid {
  margin: 0;
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.information-grid dt {
  margin-bottom: 5px;
  color: #9ca3af;
  font-size: 11px;
}
.information-grid dd {
  margin: 0;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.detail-section {
  padding: 28px 32px;
  border-bottom: 1px solid #e5e7eb;
}
.detail-section h2 {
  margin: 0 0 15px;
  color: #1a233d;
  font-size: 17px;
}
.content {
  margin: 0;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.85;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.tech-stack-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.tech-tag {
  background: #f0f4f9;
  color: #4a6fa5;
  font-weight: 500;
}
.detail-footer {
  padding: 17px 32px;
  color: #9ca3af;
  font-size: 11px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.permission-note {
  color: #b45309;
}
.applicant-section {
  margin-top: var(--lancit-section-gap);
  padding: 28px 32px 32px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
}
.applicant-section-heading {
  margin-bottom: 22px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}
.applicant-section-heading h2 {
  margin: 0 0 6px;
  color: #1a233d;
  font-size: 20px;
}
.applicant-section-heading p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}
.applicant-count {
  min-width: 46px;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: #e8edf5;
  color: #1a233d;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}
.applicant-state {
  min-height: 210px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.applicant-state p {
  margin: 12px 0 0;
  font-size: 13px;
}
.empty-icon {
  width: 46px;
  height: 46px;
  margin-bottom: 14px;
  border-radius: 50%;
  background: #e8edf5;
  color: #1a233d;
  display: grid;
  place-items: center;
  font-size: 21px;
}
.empty-applicant-state h3 {
  margin: 0;
  color: #1a233d;
  font-size: 16px;
}
.view-note {
  margin: -4px 0 12px;
  color: #9ca3af;
  font-size: 11px;
  text-align: right;
}
.application-list {
  display: grid;
  gap: var(--lancit-list-gap);
}
.application-card {
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 17px;
}
.applicant-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #e8edf5;
  color: #1a233d;
  display: grid;
  place-items: center;
  font-size: 15px;
  font-weight: 700;
}
.name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
}
.name-row h3 {
  margin: 0;
  color: #1a233d;
  font-size: 15px;
}
.new-badge,
.application-status-badge {
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
}
.new-badge {
  background: #dbeafe;
  color: #1d4ed8;
}
.status-pending {
  background: #fef9c3;
  color: #92400e;
}
.status-accepted {
  background: #dcfce7;
  color: #15803d;
}
.status-rejected,
.status-cancelled,
.status-unknown {
  background: #fee2e2;
  color: #991b1b;
}
.applicant-email {
  margin: 4px 0 9px;
  color: #9ca3af;
  font-size: 11px;
}
.applicant-intro {
  margin: 0 0 10px;
  color: #4b5563;
  font-size: 12px;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.applicant-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 13px;
  color: #9ca3af;
  font-size: 10px;
}
.application-detail-button {
  min-height: 36px;
  padding: 0 13px;
  border: 1px solid #1a233d;
  border-radius: 6px;
  background: white;
  color: #1a233d;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}
.pagination {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 13px;
  color: #6b7280;
  font-size: 12px;
}
.pagination button {
  height: 33px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
}
.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.state-card {
  min-height: 350px;
  padding: 40px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.state-card p {
  margin: 14px 0 0;
}
.error-state {
  color: #b91c1c;
}
.retry-button {
  margin-top: 18px;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #dce2eb;
  border-top-color: #1a233d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 760px) {
  .page {
    padding: var(--lancit-page-mobile-padding);
  }
  .top-actions {
    flex-direction: column;
  }
  .management-actions {
    justify-content: flex-start;
  }
  .information-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .detail-heading,
  .detail-section {
    padding: 24px;
  }
  .applicant-section {
    padding: 24px;
  }
  .application-card {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .application-detail-button {
    grid-column: 1 / -1;
  }
}
@media (max-width: 480px) {
  .information-grid {
    grid-template-columns: 1fr;
  }
  .detail-footer {
    flex-direction: column;
  }
}
</style>
