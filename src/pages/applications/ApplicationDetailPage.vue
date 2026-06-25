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
      <article class="application-summary-card">
        <header class="application-heading">
          <div>
            <p class="eyebrow">지원 정보</p>
            <h1>{{ application.recruitmentTitle || '공고 지원서' }}</h1>
          </div>
          <span :class="['status-badge', statusMeta.className]">{{ statusMeta.label }}</span>
        </header>
        <dl class="application-meta">
          <div>
            <dt>지원자</dt>
            <dd>{{ submittedProfile.displayName }}</dd>
          </div>
          <div>
            <dt>지원일</dt>
            <dd>{{ formatDateTime(application.appliedAt) }}</dd>
          </div>
          <div>
            <dt>열람일</dt>
            <dd>{{ formatDateTime(application.viewedAt) }}</dd>
          </div>
          <div>
            <dt>계약</dt>
            <dd>{{ application.contractId ? `계약 #${application.contractId}` : '없음' }}</dd>
          </div>
          <div v-if="application.canceledAt">
            <dt>취소일</dt>
            <dd>{{ formatDateTime(application.canceledAt) }}</dd>
          </div>
        </dl>
      </article>

      <p v-if="successMessage" class="success-message" role="status">{{ successMessage }}</p>
      <p v-if="actionError" class="action-error" role="alert">{{ actionError }}</p>
      <p v-if="isViewedPending" class="readonly-message">
        회사가 열람한 지원서는 수정하거나 취소할 수 없습니다.
      </p>

      <section class="content-panel" aria-labelledby="submitted-profile-title">
        <div class="section-heading">
          <div>
            <h2 id="submitted-profile-title">지원 프로필</h2>
            <p>지원 시점에 전달된 프로필 정보입니다.</p>
          </div>
        </div>
        <PortfolioProfileCard
          :profile="submittedProfile"
          :profile-image-url="profileImageUrl"
          :editable="false"
          :show-visibility="false"
        />
      </section>

      <section class="content-panel" aria-labelledby="submitted-projects-title">
        <div class="section-heading">
          <div>
            <h2 id="submitted-projects-title">
              {{ isEditing ? '제출 프로젝트 선택' : '제출 프로젝트' }}
            </h2>
            <p>
              {{
                isEditing
                  ? '수정할 프로젝트를 1개 이상 선택해주세요.'
                  : '지원 시 공개한 프로젝트입니다.'
              }}
            </p>
          </div>
          <span v-if="isEditing && portfolios.length" class="project-count">
            {{ editForm.portfolioIds.length }} / {{ portfolios.length }}개 선택
          </span>
          <span v-else class="project-count">{{ application.portfolios.length }}개</span>
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
        <div v-else-if="displayedPortfolios.length" class="portfolio-grid">
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
        <p v-else class="empty-note">제출된 프로젝트가 없습니다.</p>
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
import { formatDateTime } from '@/features/company/recruitments/api/companyRecruitmentMapper.js'
import { getAllMyPortfolios, getPortfolioFileUrl } from '@/features/portfolio/api/portfolioApi.js'
import { getPortfolioProfileImageUrl } from '@/features/portfolio/api/portfolioProfileApi.js'
import PortfolioCard from '@/features/portfolio/ui/PortfolioCard.vue'
import PortfolioProfileCard from '@/features/portfolio/ui/PortfolioProfileCard.vue'

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
const profileImageUrl = ref('')
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
const editForm = reactive({ intro: '', portfolioIds: [], portfolioProfile: null })

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
const submittedProfile = computed(() => {
  const profile = application.value?.portfolioProfile ?? {}
  return {
    ...profile,
    displayName: profile.displayName || application.value?.applicantName || '이름 미등록',
    freelancerEmail: profile.freelancerEmail || application.value?.applicantEmail || '',
    jobCategory: profile.jobCategory ?? null,
    isPortfolioPublic: Boolean(profile.isPortfolioPublic),
    intro: profile.intro || '',
    description: profile.description || '',
    techStacks: Array.isArray(profile.techStacks) ? profile.techStacks : [],
  }
})

watch(recruitmentId, loadApplication, { immediate: true })

async function loadApplication() {
  isLoading.value = true
  loadError.value = ''
  actionError.value = ''
  successMessage.value = ''
  removedPortfolioMessage.value = ''
  isEditing.value = false
  portfolioBannerUrls.value = {}
  profileImageUrl.value = ''
  try {
    const data = await getMyApplication(recruitmentId.value)
    if (!data) throw new Error('Invalid application response')
    application.value = data
    await Promise.all([loadBannerUrls(data.portfolios), loadProfileImage(data.portfolioProfile)])
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

async function loadProfileImage(profile) {
  const profileFileId = profile?.profileFileId
  if (profileFileId === null || profileFileId === undefined) return
  try {
    profileImageUrl.value = await getPortfolioProfileImageUrl(profileFileId)
  } catch {
    profileImageUrl.value = ''
  }
}

async function startEditing() {
  if (!canModify.value) return
  actionError.value = ''
  successMessage.value = ''
  editForm.intro = application.value?.intro || ''
  editForm.portfolioProfile = application.value?.portfolioProfile ?? null
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
  justify-content: space-between;
  gap: 14px;
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
.back-button,
.retry-button,
.secondary-button {
  border-color: #d1d5db;
  color: #4b5563;
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
.application-summary-card,
.content-panel,
.state-card,
.action-panel,
.cancel-panel {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
}
.application-summary-card,
.content-panel {
  margin-bottom: 16px;
  overflow: hidden;
}
.application-heading {
  padding: 26px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}
.eyebrow {
  margin: 0 0 6px;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 700;
}
.application-heading h1 {
  margin: 0;
  color: #1a233d;
  font-size: 21px;
  line-height: 1.4;
}
.application-meta {
  margin: 0;
  padding: 20px 28px;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}
.application-meta dt {
  margin-bottom: 5px;
  color: #9ca3af;
  font-size: 11px;
}
.application-meta dd {
  margin: 0;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.status-badge {
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  font-size: 10px;
  font-weight: 700;
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
.content-panel {
  padding: 26px 28px 28px;
}
.section-heading {
  margin-bottom: 18px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}
.section-heading h2 {
  margin: 0 0 5px;
  color: #1a233d;
  font-size: 19px;
}
.section-heading p {
  margin: 0;
  color: #6b7280;
  font-size: 12px;
}
.portfolio-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.project-count {
  min-width: 42px;
  min-height: 28px;
  padding: 0 9px;
  border-radius: 999px;
  background: #e8edf5;
  color: #1a233d;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.empty-note {
  margin: 0;
  padding: 34px;
  border: 1px dashed #d1d5db;
  border-radius: 10px;
  color: #9ca3af;
  font-size: 13px;
  text-align: center;
}
.state-card,
.section-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  text-align: center;
}
.state-card {
  min-height: 350px;
  padding: 40px;
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
  width: 28px;
  height: 28px;
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
  margin-bottom: 16px;
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
}
@media (max-width: 1100px) {
  .portfolio-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 760px) {
  .application-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .page {
    padding: 24px 18px;
  }
  .top-actions,
  .section-heading,
  .cancel-panel {
    flex-direction: column;
  }
  .top-action-buttons {
    justify-content: flex-end;
  }
  .application-heading,
  .section-heading {
    align-items: flex-start;
  }
  .portfolio-grid {
    grid-template-columns: 1fr;
  }
  .content-panel {
    padding: 22px;
  }
}
@media (max-width: 440px) {
  .application-meta {
    grid-template-columns: 1fr;
  }
}
</style>
