<template>
  <div class="page">
    <div class="top-actions">
      <button type="button" class="back-button" @click="goToApplications">← 지원한 공고</button>
      <div class="top-action-buttons">
        <button
          v-if="application?.contractId"
          type="button"
          class="contract-button"
          @click="goToContract"
        >
          계약 보기
        </button>
        <button type="button" class="recruitment-button" @click="goToRecruitment">공고 보기</button>
      </div>
    </div>

    <div v-if="isLoading" class="state-card">
      <span class="spinner" aria-hidden="true"></span>
      <p>지원서를 불러오고 있습니다.</p>
    </div>

    <div v-else-if="loadError" class="state-card error-state">
      <p>{{ loadError }}</p>
      <button type="button" class="retry-button" @click="loadApplication">다시 시도</button>
    </div>

    <template v-else-if="application">
      <header class="application-header">
        <div>
          <p class="eyebrow">지원 공고</p>
          <h1>{{ application.recruitmentTitle || '공고 지원서' }}</h1>
          <p>지원일 {{ formatDateTime(application.appliedAt) }}</p>
          <p v-if="application.viewedAt">회사 열람 {{ formatDateTime(application.viewedAt) }}</p>
          <p v-if="application.canceledAt">취소일 {{ formatDateTime(application.canceledAt) }}</p>
        </div>
        <span :class="['status-badge', statusMeta.className]">{{ statusMeta.label }}</span>
      </header>

      <p v-if="successMessage" class="success-message" role="status">{{ successMessage }}</p>
      <p v-if="actionError" class="action-error" role="alert">{{ actionError }}</p>
      <p v-if="isViewedPending" class="readonly-message">
        회사가 열람한 지원서는 수정하거나 취소할 수 없습니다.
      </p>

      <section class="page-section">
        <div class="section-heading">
          <div>
            <h2>지원 소개</h2>
            <p>공고 담당자에게 전달한 소개입니다.</p>
          </div>
          <button
            v-if="isPending && !isEditing"
            type="button"
            class="secondary-button"
            :disabled="!canModify"
            :title="readOnlyReason"
            @click="startEditing"
          >
            지원서 수정
          </button>
        </div>

        <textarea
          v-if="isEditing"
          v-model="editForm.intro"
          class="intro-input"
          maxlength="1000"
          rows="6"
          placeholder="공고에 맞는 경험과 강점을 소개해주세요."
        ></textarea>
        <p v-else class="intro-text">{{ application.intro || '등록된 지원 소개가 없습니다.' }}</p>
        <p v-if="isEditing" class="character-count">{{ editForm.intro.length }} / 1000</p>
      </section>

      <section v-if="application.portfolioProfile" class="page-section">
        <div class="section-heading">
          <div>
            <h2>제출 프로필</h2>
            <p>지원 시점에 전달된 프로필 정보입니다.</p>
          </div>
        </div>
        <dl class="profile-grid">
          <div>
            <dt>이름</dt>
            <dd>{{ application.portfolioProfile.displayName || '미등록' }}</dd>
          </div>
          <div>
            <dt>직무</dt>
            <dd>{{ jobCategoryLabel(application.portfolioProfile.jobCategory) }}</dd>
          </div>
          <div class="full">
            <dt>소개</dt>
            <dd>
              {{
                application.portfolioProfile.description ||
                application.portfolioProfile.intro ||
                '미등록'
              }}
            </dd>
          </div>
          <div class="full">
            <dt>기술 스택</dt>
            <dd>{{ formatTechStacks(application.portfolioProfile.techStacks) }}</dd>
          </div>
        </dl>
      </section>

      <section class="page-section">
        <div class="section-heading">
          <div>
            <h2>{{ isEditing ? '제출 프로젝트 선택' : '제출 프로젝트' }}</h2>
            <p>
              {{
                isEditing
                  ? '수정할 프로젝트를 1개 이상 선택해주세요.'
                  : '지원 시 공개한 프로젝트입니다.'
              }}
            </p>
          </div>
          <span v-if="isEditing && portfolios.length" class="selection-count">
            {{ editForm.portfolioIds.length }} / {{ portfolios.length }}개 선택
          </span>
        </div>

        <div v-if="isPortfolioLoading" class="section-state">
          <span class="spinner" aria-hidden="true"></span>
          <p>프로젝트를 불러오고 있습니다.</p>
        </div>
        <div v-else-if="portfolioError" class="section-state error-state">
          <p>{{ portfolioError }}</p>
          <button type="button" class="retry-button" @click="loadEditablePortfolios">
            다시 시도
          </button>
        </div>
        <div v-else-if="isEditing && !portfolios.length" class="section-state">
          <p>수정에 사용할 프로젝트가 없습니다.</p>
        </div>
        <p v-if="removedPortfolioMessage" class="portfolio-notice">
          {{ removedPortfolioMessage }}
        </p>
        <div v-else-if="displayedPortfolios.length" class="project-grid">
          <PortfolioCard
            v-for="portfolio in displayedPortfolios"
            :key="portfolio.portfolioId"
            :portfolio="portfolio"
            :banner-url="portfolioBannerUrls[portfolio.portfolioId]"
            :selectable="isEditing"
            :selected="editForm.portfolioIds.includes(Number(portfolio.portfolioId))"
            :disabled="isSaving"
            :readonly="!isEditing"
            :show-visibility="false"
            @select="handlePortfolioSelection"
          />
        </div>
        <div v-else class="section-state"><p>제출된 프로젝트가 없습니다.</p></div>
      </section>

      <div v-if="isEditing" class="action-panel">
        <button type="button" class="secondary-button" :disabled="isSaving" @click="cancelEditing">
          취소
        </button>
        <button type="button" class="primary-button" :disabled="isSaving" @click="saveApplication">
          {{ isSaving ? '저장 중...' : '수정 완료' }}
        </button>
      </div>

      <div v-else-if="isPending" class="cancel-panel">
        <p>
          {{
            isViewedPending
              ? '회사가 열람하여 지원을 취소할 수 없습니다.'
              : '지원 취소 후 해당 공고에 다시 지원할 수 있습니다.'
          }}
        </p>
        <button
          type="button"
          class="danger-button"
          :disabled="isCancelling || !canModify"
          :title="readOnlyReason"
          @click="cancelApplication"
        >
          {{ isCancelling ? '취소 중...' : '지원 취소' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  cancelMyApplication,
  getMyApplication,
  updateMyApplication,
} from '@/features/applications/api/applicationApi.js'
import {
  JOB_CATEGORY_OPTIONS,
  formatDateTime,
} from '@/features/company/recruitments/api/companyRecruitmentMapper.js'
import { getAllMyPortfolios, getPortfolioFileUrl } from '@/features/portfolio/api/portfolioApi.js'
import PortfolioCard from '@/features/portfolio/ui/PortfolioCard.vue'

const APPLICATION_STATUS_META = {
  PENDING: { label: '검토 중', className: 'status-pending' },
  ACCEPTED: { label: '채택', className: 'status-accepted' },
  REJECTED: { label: '미채택', className: 'status-rejected' },
  CANCELLED: { label: '지원 취소', className: 'status-cancelled' },
}

const route = useRoute()
const router = useRouter()
const application = ref(null)
const portfolios = ref([])
const portfolioBannerUrls = ref({})
const isLoading = ref(true)
const isEditing = ref(false)
const isPortfolioLoading = ref(false)
const isSaving = ref(false)
const isCancelling = ref(false)
const loadError = ref('')
const portfolioError = ref('')
const actionError = ref('')
const successMessage = ref('')
const removedPortfolioMessage = ref('')
const editForm = reactive({ intro: '', portfolioIds: [] })

const recruitmentId = computed(() => route.params.id)
const statusMeta = computed(
  () =>
    APPLICATION_STATUS_META[application.value?.status] || {
      label: application.value?.status || '상태 미정',
      className: 'status-unknown',
    },
)
const isPending = computed(() => application.value?.status === 'PENDING')
const isViewedPending = computed(() => isPending.value && Boolean(application.value?.viewedAt))
const canModify = computed(() => isPending.value && !application.value?.viewedAt)
const readOnlyReason = computed(() =>
  isViewedPending.value ? '회사가 열람한 지원서는 변경할 수 없습니다.' : '',
)
const displayedPortfolios = computed(() =>
  isEditing.value ? portfolios.value : (application.value?.portfolios ?? []),
)

watch(recruitmentId, loadApplication, { immediate: true })

async function loadApplication() {
  isLoading.value = true
  loadError.value = ''
  actionError.value = ''
  successMessage.value = ''
  removedPortfolioMessage.value = ''
  isEditing.value = false
  try {
    const data = await getMyApplication(recruitmentId.value)
    if (!data) throw new Error('Invalid application response')
    application.value = data
    await loadBannerUrls(data.portfolios)
  } catch (error) {
    application.value = null
    loadError.value = getRequestError(
      error,
      '지원서를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    isLoading.value = false
  }
}

async function startEditing() {
  if (!canModify.value) return
  actionError.value = ''
  successMessage.value = ''
  editForm.intro = application.value?.intro || ''
  editForm.portfolioIds = (application.value?.portfolios ?? [])
    .map((portfolio) => Number(portfolio.portfolioId))
    .filter(Number.isInteger)
  isEditing.value = true
  await loadEditablePortfolios()
}

async function loadEditablePortfolios() {
  isPortfolioLoading.value = true
  portfolioError.value = ''
  try {
    const data = await getAllMyPortfolios({ sort: 'latest' })
    portfolios.value = data.filter((portfolio) => !portfolio.isDeleted)
    const availableIds = new Set(portfolios.value.map((portfolio) => Number(portfolio.portfolioId)))
    const selectedIds = editForm.portfolioIds.filter((portfolioId) => availableIds.has(portfolioId))
    removedPortfolioMessage.value =
      selectedIds.length === editForm.portfolioIds.length
        ? ''
        : '삭제되었거나 사용할 수 없는 프로젝트는 선택에서 제외했습니다.'
    editForm.portfolioIds = selectedIds
    await loadBannerUrls(portfolios.value)
  } catch (error) {
    portfolios.value = []
    portfolioError.value = getRequestError(
      error,
      '프로젝트를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    isPortfolioLoading.value = false
  }
}

async function loadBannerUrls(items = []) {
  await Promise.all(
    items.map(async (portfolio) => {
      const portfolioId = Number(portfolio?.portfolioId)
      if (
        !Number.isInteger(portfolioId) ||
        portfolio?.bannerFileId == null ||
        portfolioBannerUrls.value[portfolioId]
      )
        return
      try {
        const url = await getPortfolioFileUrl(portfolio.bannerFileId)
        if (url) portfolioBannerUrls.value = { ...portfolioBannerUrls.value, [portfolioId]: url }
      } catch {
        // 이미지 조회 실패 시 카드의 기본 배너를 사용합니다.
      }
    }),
  )
}

function handlePortfolioSelection(portfolio, selected) {
  const portfolioId = Number(portfolio?.portfolioId)
  if (!Number.isInteger(portfolioId) || isSaving.value) return
  editForm.portfolioIds = selected
    ? [...new Set([...editForm.portfolioIds, portfolioId])]
    : editForm.portfolioIds.filter((id) => id !== portfolioId)
}

async function saveApplication() {
  actionError.value = ''
  successMessage.value = ''
  if (!editForm.portfolioIds.length) {
    actionError.value = '제출 프로젝트를 1개 이상 선택해주세요.'
    return
  }

  isSaving.value = true
  try {
    const updated = await updateMyApplication(recruitmentId.value, editForm)
    if (!updated) throw new Error('Invalid application response')
    application.value = updated
    isEditing.value = false
    successMessage.value = '지원서가 수정되었습니다.'
    await loadBannerUrls(updated.portfolios)
  } catch (error) {
    actionError.value = getRequestError(
      error,
      '지원서를 수정하지 못했습니다. 공고 상태를 확인해주세요.',
    )
  } finally {
    isSaving.value = false
  }
}

function cancelEditing() {
  isEditing.value = false
  portfolioError.value = ''
  actionError.value = ''
  removedPortfolioMessage.value = ''
}

async function cancelApplication() {
  if (
    !canModify.value ||
    !confirm('지원을 취소하시겠습니까? 취소 후 해당 공고에 다시 지원할 수 있습니다.')
  )
    return
  isCancelling.value = true
  actionError.value = ''
  try {
    await cancelMyApplication(recruitmentId.value)
    await router.push({ name: 'RecruitmentList', query: { tab: 'APPLIED' } })
  } catch (error) {
    actionError.value = getRequestError(
      error,
      '지원을 취소하지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    isCancelling.value = false
  }
}

function goToApplications() {
  router.push({ name: 'RecruitmentList', query: { tab: 'APPLIED' } })
}

function goToRecruitment() {
  router.push({ name: 'RecruitmentDetail', params: { id: recruitmentId.value } })
}

function goToContract() {
  if (!application.value?.contractId) return
  router.push({ name: 'ContractDetail', params: { id: application.value.contractId } })
}

function jobCategoryLabel(value) {
  return JOB_CATEGORY_OPTIONS.find((option) => option.value === value)?.label || value || '미등록'
}

function formatTechStacks(value) {
  return Array.isArray(value) && value.length ? value.join(', ') : '미등록'
}

function getRequestError(error, fallback) {
  const status = error?.response?.status
  if (status === 404) return '지원서를 찾을 수 없습니다.'
  if (status === 409) return '현재 상태에서는 지원서를 변경할 수 없습니다.'
  const message = error?.response?.data?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}
</script>

<style scoped>
.page {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px;
  color: #1f2937;
}
.top-actions {
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.top-action-buttons {
  display: flex;
  gap: 8px;
}
.back-button,
.recruitment-button,
.contract-button,
.retry-button,
.secondary-button,
.primary-button,
.danger-button {
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #4b5563;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.recruitment-button,
.contract-button,
.primary-button {
  border-color: #1a233d;
  background: #1a233d;
  color: white;
}
.danger-button {
  border-color: #fecaca;
  color: #dc2626;
}
button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.application-header,
.page-section,
.state-card,
.action-panel,
.cancel-panel {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
}
.application-header {
  margin-bottom: 16px;
  padding: 28px 32px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}
.eyebrow {
  margin: 0 0 7px !important;
  color: #64748b !important;
  font-size: 11px !important;
  font-weight: 700;
  text-transform: uppercase;
}
.application-header h1 {
  margin: 0 0 8px;
  color: #1a233d;
  font-size: 25px;
}
.application-header p {
  margin: 0;
  color: #9ca3af;
  font-size: 12px;
}
.status-badge {
  min-height: 28px;
  padding: 0 11px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 700;
}
.status-pending {
  background: #fef3c7;
  color: #92400e;
}
.status-accepted {
  background: #dcfce7;
  color: #15803d;
}
.status-rejected,
.status-cancelled,
.status-unknown {
  background: #f3f4f6;
  color: #6b7280;
}
.page-section {
  margin-bottom: 16px;
  padding: 28px 32px;
}
.section-heading {
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.section-heading h2 {
  margin: 0 0 5px;
  color: #1a233d;
  font-size: 17px;
}
.section-heading p {
  margin: 0;
  color: #9ca3af;
  font-size: 12px;
}
.intro-text {
  margin: 0;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
}
.intro-input {
  width: 100%;
  padding: 13px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  color: #374151;
  font: inherit;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
}
.intro-input:focus {
  border-color: #1a233d;
  outline: none;
  box-shadow: 0 0 0 3px rgba(26, 35, 61, 0.08);
}
.character-count {
  margin: 6px 0 0;
  color: #9ca3af;
  font-size: 11px;
  text-align: right;
}
.profile-grid {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.profile-grid .full {
  grid-column: 1 / -1;
}
.profile-grid dt {
  margin-bottom: 5px;
  color: #9ca3af;
  font-size: 11px;
}
.profile-grid dd {
  margin: 0;
  color: #374151;
  font-size: 13px;
  line-height: 1.6;
}
.project-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.selection-count {
  color: #64748b;
  font-size: 12px;
}
.state-card,
.section-state {
  min-height: 220px;
  padding: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  text-align: center;
}
.section-state {
  min-height: 140px;
  padding: 20px;
  border-radius: 8px;
  background: #f8fafc;
}
.state-card p,
.section-state p {
  margin: 12px 0 0;
}
.error-state {
  color: #b91c1c;
}
.retry-button {
  margin-top: 15px;
}
.spinner {
  width: 26px;
  height: 26px;
  border: 3px solid #dce2eb;
  border-top-color: #1a233d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.success-message,
.action-error {
  margin: 0 0 16px;
  padding: 12px 14px;
  border-radius: 7px;
  font-size: 13px;
}
.success-message {
  background: #ecfdf5;
  color: #047857;
}
.action-error {
  background: #fef2f2;
  color: #b91c1c;
}
.readonly-message,
.portfolio-notice {
  margin: 0 0 16px;
  padding: 12px 14px;
  border-radius: 7px;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
}
.portfolio-notice {
  margin-bottom: 12px;
  background: #fffbeb;
  color: #92400e;
}
.action-panel,
.cancel-panel {
  padding: 18px 22px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.cancel-panel {
  justify-content: space-between;
}
.cancel-panel p {
  margin: 0;
  color: #9ca3af;
  font-size: 12px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 800px) {
  .page {
    padding: 24px 18px;
  }
  .project-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 520px) {
  .application-header,
  .section-heading,
  .cancel-panel {
    align-items: stretch;
    flex-direction: column;
  }
  .profile-grid,
  .project-grid {
    grid-template-columns: 1fr;
  }
  .profile-grid .full {
    grid-column: auto;
  }
}
</style>
