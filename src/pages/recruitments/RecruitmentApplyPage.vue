<template>
  <div class="page">
    <div class="top-actions">
      <button type="button" class="back-button" @click="goToDetail">← 공고 상세</button>
    </div>

    <div v-if="isRecruitmentLoading" class="state-card">
      <span class="spinner" aria-hidden="true"></span>
      <p>지원할 공고를 확인하고 있습니다.</p>
    </div>

    <div v-else-if="recruitmentError" class="state-card error-state">
      <p>{{ recruitmentError }}</p>
      <button type="button" class="retry-button" @click="loadPage">다시 시도</button>
    </div>

    <div v-else-if="recruitment && isApplicationUnavailable" class="state-card blocked-state">
      <h1>{{ recruitment.isApplied ? '이미 지원한 공고입니다.' : '현재 지원할 수 없는 공고입니다.' }}</h1>
      <p>
        {{
          recruitment.isApplied
            ? '지원 현황은 공고 찾기의 지원 완료 탭에서 확인할 수 있습니다.'
            : '공고의 모집 상태와 모집 기간을 확인해주세요.'
        }}
      </p>
      <button type="button" class="primary-button" @click="goToDetail">공고 상세로 돌아가기</button>
    </div>

    <template v-else-if="recruitment">
      <header class="recruitment-card">
        <div class="card-badge-header">
          <div class="badge-row">
            <span class="category-badge">{{ recruitment.jobCategoryLabel }}</span>
            <span class="category-badge light">{{ recruitment.recruitmentCategoryLabel }}</span>
          </div>
          <span :class="['status-badge', recruitment.statusMeta.className]">
            {{ recruitment.statusMeta.label }}
          </span>
        </div>
        <p class="company-name">{{ recruitment.companyName || '기업 정보 없음' }}</p>
        <h1>{{ recruitment.title || '제목 없는 공고' }}</h1>
        <p class="guide-text">
          지원 시 현재 작성한 포트폴리오 프로필 카드와 선택한 프로젝트가 이 공고를 등록한
          회사에 공개됩니다.
        </p>
      </header>

      <section class="page-section" aria-labelledby="profile-section-title">
        <div class="section-heading">
          <div>
            <span class="step-number">1</span>
            <div>
              <h2 id="profile-section-title">지원용 프로필 카드</h2>
              <p>회사에 전달할 프로필을 확인하고 필요한 내용을 수정해주세요.</p>
            </div>
          </div>
        </div>

        <div v-if="isProfileLoading" class="section-state">
          <span class="spinner" aria-hidden="true"></span>
          <p>프로필을 불러오고 있습니다.</p>
        </div>
        <div v-else-if="profileLoadError" class="section-state error-state">
          <p>{{ profileLoadError }}</p>
          <button type="button" class="retry-button" @click="loadProfile">다시 시도</button>
        </div>
        <template v-else-if="profile">
          <PortfolioProfileForm
            v-if="isProfileEditing"
            :initial-value="profile"
            :initial-image-url="profileImageUrl"
            :is-submitting="isProfileSaving"
            :error-message="profileSaveError"
            @submit="handleProfileSave"
            @cancel="cancelProfileEdit"
          />
          <PortfolioProfileCard
            v-else
            :profile="profile"
            :profile-image-url="profileImageUrl"
            @edit="startProfileEdit"
          />
          <p v-if="profileSuccessMessage" class="success-message" role="status">
            {{ profileSuccessMessage }}
          </p>
        </template>
      </section>

      <section class="page-section" aria-labelledby="project-section-title">
        <div class="section-heading project-heading">
          <div>
            <span class="step-number">2</span>
            <div>
              <h2 id="project-section-title">제출 프로젝트 선택</h2>
              <p>지원할 공고에 보여줄 프로젝트를 1개 이상 선택해주세요.</p>
            </div>
          </div>
          <span v-if="portfolios.length" class="selection-count">
            {{ selectedPortfolioIds.length }} / {{ portfolios.length }}개 선택
          </span>
        </div>

        <p class="disclosure-note">
          비공개 프로젝트도 지원 시 선택하면 이 공고를 등록한 회사에는 공개됩니다.
        </p>

        <div v-if="isPortfolioLoading" class="section-state">
          <span class="spinner" aria-hidden="true"></span>
          <p>프로젝트를 불러오고 있습니다.</p>
        </div>
        <div v-else-if="portfolioLoadError" class="section-state error-state">
          <p>{{ portfolioLoadError }}</p>
          <button type="button" class="retry-button" @click="loadPortfolios">다시 시도</button>
        </div>
        <div v-else-if="!portfolios.length" class="section-state empty-state">
          <h3>지원에 제출할 프로젝트가 없습니다.</h3>
          <p>포트폴리오에 프로젝트를 등록한 뒤 다시 지원해주세요.</p>
          <button type="button" class="primary-button" @click="goToPortfolio">프로젝트 등록하기</button>
        </div>
        <div v-else class="project-grid">
          <PortfolioCard
            v-for="portfolio in portfolios"
            :key="getPortfolioId(portfolio)"
            :portfolio="portfolio"
            :banner-url="portfolioBannerUrls[getPortfolioId(portfolio)]"
            selectable
            :selected="selectedPortfolioIds.includes(getPortfolioId(portfolio))"
            :disabled="isSubmitting"
            @select="handlePortfolioSelection"
          />
        </div>
      </section>

      <div class="submit-panel">
        <div>
          <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>
          <p v-else class="submit-guide">
            프로필과 선택한 프로젝트는 지원 시점의 정보로 회사에 전달됩니다.
          </p>
        </div>
        <button type="button" class="submit-button" :disabled="isSubmitting" @click="handleApply">
          {{ isSubmitting ? submitStatusText : '지원 완료' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { applyToRecruitment } from '@/features/applications/api/applicationApi.js'
import {
  getPortfolioProfile,
  getPortfolioProfileImageUrl,
  updatePortfolioProfile,
  uploadPortfolioProfileImage,
} from '@/features/portfolio/api/portfolioProfileApi.js'
import { getMyPortfolios, getPortfolioFileUrl } from '@/features/portfolio/api/portfolioApi.js'
import PortfolioCard from '@/features/portfolio/ui/PortfolioCard.vue'
import PortfolioProfileCard from '@/features/portfolio/ui/PortfolioProfileCard.vue'
import PortfolioProfileForm from '@/features/portfolio/ui/PortfolioProfileForm.vue'
import { getRecruitment } from '@/features/recruitments/api/recruitmentApi.js'

const route = useRoute()
const router = useRouter()

const recruitment = ref(null)
const profile = ref(null)
const portfolios = ref([])
const profileImageUrl = ref('')
const portfolioBannerUrls = ref({})
const selectedPortfolioIds = ref([])

const isRecruitmentLoading = ref(true)
const isProfileLoading = ref(false)
const isPortfolioLoading = ref(false)
const isProfileEditing = ref(false)
const isProfileSaving = ref(false)
const isSubmitting = ref(false)
const submitStage = ref('')

const recruitmentError = ref('')
const profileLoadError = ref('')
const profileSaveError = ref('')
const profileSuccessMessage = ref('')
const portfolioLoadError = ref('')
const submitError = ref('')

const recruitmentId = computed(() => route.params.recruitmentId)
const isApplicationUnavailable = computed(
  () => Boolean(recruitment.value?.isApplied || !recruitment.value?.canApply),
)
const submitStatusText = computed(() =>
  submitStage.value === 'profile' ? '프로필 저장 중...' : '지원 처리 중...',
)

watch(recruitmentId, loadPage, { immediate: true })

async function loadPage() {
  recruitment.value = null
  recruitmentError.value = ''
  isRecruitmentLoading.value = true
  submitError.value = ''

  try {
    const data = await getRecruitment(recruitmentId.value)
    if (!data) throw new Error('Invalid recruitment response')
    recruitment.value = data
  } catch (error) {
    recruitmentError.value = getRequestError(
      error,
      '지원할 공고를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    isRecruitmentLoading.value = false
  }

  if (!recruitment.value || isApplicationUnavailable.value) return
  await Promise.all([loadProfile(), loadPortfolios()])
}

async function loadProfile() {
  isProfileLoading.value = true
  profileLoadError.value = ''
  profileSaveError.value = ''
  profileSuccessMessage.value = ''

  try {
    const data = await getPortfolioProfile()
    if (!data) throw new Error('Invalid portfolio profile response')
    profile.value = data
    await loadProfileImage(data.profileFileId)
  } catch (error) {
    profile.value = null
    profileLoadError.value = getRequestError(
      error,
      '포트폴리오 프로필을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    isProfileLoading.value = false
  }
}

async function loadProfileImage(fileId) {
  profileImageUrl.value = ''
  if (fileId === null || fileId === undefined) return

  try {
    profileImageUrl.value = await getPortfolioProfileImageUrl(fileId)
  } catch {
    profileImageUrl.value = ''
  }
}

async function loadPortfolios() {
  isPortfolioLoading.value = true
  portfolioLoadError.value = ''
  selectedPortfolioIds.value = []

  try {
    const data = await getMyPortfolios({ page: 1, size: 100, sort: 'latest' })
    portfolios.value = (Array.isArray(data?.content) ? data.content : []).filter(
      (portfolio) => !portfolio.isDeleted && Number.isInteger(getPortfolioId(portfolio)),
    )
    await loadPortfolioBannerUrls(portfolios.value)
  } catch (error) {
    portfolios.value = []
    portfolioLoadError.value = getRequestError(
      error,
      '프로젝트 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    isPortfolioLoading.value = false
  }
}

function startProfileEdit() {
  profileSaveError.value = ''
  profileSuccessMessage.value = ''
  submitError.value = ''
  isProfileEditing.value = true
}

function cancelProfileEdit() {
  profileSaveError.value = ''
  isProfileEditing.value = false
}

async function handleProfileSave(form) {
  isProfileSaving.value = true
  profileSaveError.value = ''
  profileSuccessMessage.value = ''

  try {
    const updatedProfile = await persistProfile(form)
    profile.value = updatedProfile
    await loadProfileImage(updatedProfile.profileFileId)
    isProfileEditing.value = false
    profileSuccessMessage.value = '지원용 프로필이 저장되었습니다.'
  } catch (error) {
    profileSaveError.value = getRequestError(
      error,
      '포트폴리오 프로필을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    isProfileSaving.value = false
  }
}

async function persistProfile(form) {
  let profileFileId = form.profileFileId
  if (form.profileImageFile) {
    const uploadedFile = await uploadPortfolioProfileImage(form.profileImageFile)
    if (!uploadedFile?.fileId) throw new Error('Invalid profile image upload response')
    profileFileId = uploadedFile.fileId
  }

  const updatedProfile = await updatePortfolioProfile({ ...form, profileFileId })
  if (!updatedProfile) throw new Error('Invalid portfolio profile response')
  return updatedProfile
}

async function handleApply() {
  submitError.value = ''

  if (recruitment.value?.isApplied) {
    submitError.value = '이미 지원한 공고입니다.'
    return
  }
  if (!recruitment.value?.canApply) {
    submitError.value = '현재 지원할 수 없는 공고입니다.'
    return
  }
  if (!profile.value || profileLoadError.value) {
    submitError.value = '지원용 프로필을 먼저 불러와주세요.'
    return
  }
  if (isProfileEditing.value) {
    submitError.value = '수정 중인 프로필을 먼저 저장해주세요.'
    return
  }

  const availablePortfolioIds = new Set(portfolios.value.map(getPortfolioId))
  const portfolioIds = selectedPortfolioIds.value.filter((id) => availablePortfolioIds.has(id))
  if (!portfolioIds.length) {
    submitError.value = '지원 시 공개할 프로젝트를 1개 이상 선택해주세요.'
    return
  }

  isSubmitting.value = true
  submitStage.value = 'profile'

  try {
    const savedProfile = await updatePortfolioProfile(profile.value)
    if (!savedProfile) throw new Error('Invalid portfolio profile response')
    profile.value = savedProfile

    submitStage.value = 'application'
    const intro = (savedProfile.description || savedProfile.intro || '').trim()
    await applyToRecruitment(recruitmentId.value, { intro, portfolioIds })

    alert('지원이 완료되었습니다.')
    await router.push({ name: 'RecruitmentDetail', params: { id: recruitmentId.value } })
  } catch (error) {
    submitError.value =
      submitStage.value === 'profile'
        ? getRequestError(
            error,
            '포트폴리오 프로필을 저장하지 못해 지원이 진행되지 않았습니다.',
          )
        : getApplicationError(error)
  } finally {
    isSubmitting.value = false
    submitStage.value = ''
  }
}

async function loadPortfolioBannerUrls(items) {
  portfolioBannerUrls.value = {}

  await Promise.all(
    items.map(async (portfolio) => {
      const id = getPortfolioId(portfolio)
      const fileId = portfolio.bannerFileId
      if (id === null || fileId === null || fileId === undefined) return

      try {
        const url = await getPortfolioFileUrl(fileId)
        if (url) portfolioBannerUrls.value = { ...portfolioBannerUrls.value, [id]: url }
      } catch {
        // 이미지 조회 실패 시 기존 카드의 그라데이션 배너를 사용합니다.
      }
    }),
  )
}

function handlePortfolioSelection(portfolio, selected) {
  if (isSubmitting.value) return
  const id = getPortfolioId(portfolio)
  if (id === null) return

  selectedPortfolioIds.value = selected
    ? [...new Set([...selectedPortfolioIds.value, id])]
    : selectedPortfolioIds.value.filter((portfolioId) => portfolioId !== id)
}

function getPortfolioId(portfolio) {
  const rawId = portfolio?.portfolioId
  if (rawId === null || rawId === undefined || rawId === '') return null
  const id = Number(rawId)
  return Number.isInteger(id) ? id : null
}

function goToDetail() {
  router.push({ name: 'RecruitmentDetail', params: { id: recruitmentId.value } })
}

function goToPortfolio() {
  router.push({ name: 'PortfolioCreate' })
}

function getApplicationError(error) {
  const status = error?.response?.status
  if (status === 409) return '이미 지원한 공고입니다.'
  if (status === 404) return '지원할 공고를 찾을 수 없습니다.'
  if (status === 403) return '이 공고에 지원할 권한이 없습니다.'
  return getRequestError(error, '지원하지 못했습니다. 잠시 후 다시 시도해주세요.')
}

function getRequestError(error, fallback) {
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
}

.back-button,
.retry-button,
.primary-button {
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

.primary-button {
  border-color: #1a233d;
  background: #1a233d;
  color: white;
}

.recruitment-card,
.page-section,
.state-card,
.submit-panel {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
}

.recruitment-card {
  margin-bottom: 18px;
  padding: 28px 30px;
}

.card-badge-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.card-badge-header .status-badge {
  flex: 0 0 auto;
}

.status-badge,
.category-badge {
  min-height: 25px;
  padding: 0 9px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
}

.status-open { background: #dcfce7; color: #15803d; }
.status-closed, .status-expired { background: #f3f4f6; color: #4b5563; }
.status-cancelled, .status-unknown { background: #fee2e2; color: #991b1b; }
.category-badge { background: #e8edf5; color: #1a233d; }
.category-badge.light { background: #f3f4f6; color: #6b7280; }

.company-name {
  margin: 18px 0 5px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
}

.recruitment-card h1 {
  margin: 0;
  color: #1a233d;
  font-size: 25px;
  line-height: 1.4;
}

.guide-text {
  margin: 16px 0 0;
  padding: 13px 15px;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e3a8a;
  font-size: 13px;
  line-height: 1.65;
}

.page-section {
  margin-bottom: 18px;
  padding: 26px;
}

.section-heading {
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.section-heading > div {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1a233d;
  color: white;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
}

.section-heading h2 {
  margin: 1px 0 5px;
  color: #1a233d;
  font-size: 18px;
}

.section-heading p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.selection-count {
  padding: 6px 10px;
  border-radius: 999px;
  background: #eef2f7;
  color: #374151;
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 600;
}

.disclosure-note {
  margin: -5px 0 18px;
  padding: 11px 13px;
  border-radius: 7px;
  background: #fffbeb;
  color: #92400e;
  font-size: 12px;
  line-height: 1.55;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.submit-panel {
  padding: 18px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.submit-guide,
.submit-error {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
}

.submit-guide { color: #6b7280; }
.submit-error { color: #b91c1c; }

.submit-button {
  min-width: 130px;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid #1a233d;
  border-radius: 7px;
  background: #1a233d;
  color: white;
  flex: 0 0 auto;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.submit-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.state-card,
.section-state {
  min-height: 260px;
  padding: 36px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.section-state {
  min-height: 210px;
  border: 1px dashed #d1d5db;
  border-radius: 9px;
}

.state-card p,
.section-state p {
  margin: 13px 0 0;
}

.state-card h1,
.section-state h3 {
  margin: 0;
  color: #1a233d;
  font-size: 18px;
}

.state-card .primary-button,
.section-state .primary-button,
.retry-button {
  margin-top: 18px;
}

.error-state { color: #b91c1c; }
.success-message { margin: 12px 0 0; color: #15803d; font-size: 12px; }

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #dce2eb;
  border-top-color: #1a233d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 760px) {
  .page { padding: 24px 18px; }
  .recruitment-card, .page-section { padding: 22px; }
  .card-badge-header { align-items: flex-start; }
  .submit-panel { align-items: stretch; flex-direction: column; }
  .submit-button { width: 100%; }
}

@media (max-width: 900px) {
  .project-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 520px) {
  .project-grid { grid-template-columns: 1fr; }
  .section-heading { flex-direction: column; }
  .selection-count { align-self: flex-start; }
}
</style>
