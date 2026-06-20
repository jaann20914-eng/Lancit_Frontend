<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>포트폴리오</h1>
        <p>나의 역량을 소개하고 진행한 프로젝트를 관리할 수 있습니다.</p>
      </div>
    </header>

    <section class="profile-section" aria-labelledby="profile-section-title">
      <div class="section-heading">
        <div>
          <h2 id="profile-section-title">포트폴리오 프로필</h2>
          <p>프로젝트 전체를 대표하는 소개와 공개 여부입니다.</p>
        </div>
      </div>

      <div v-if="isProfileLoading" class="state-card profile-state">
        <span class="spinner" aria-hidden="true"></span>
        <p>프로필을 불러오고 있습니다.</p>
      </div>

      <div v-else-if="profileLoadError" class="state-card profile-state error-state">
        <p>{{ profileLoadError }}</p>
        <button type="button" class="retry-button" @click="loadProfile">다시 시도</button>
      </div>

      <template v-else-if="profile">
        <PortfolioProfileForm
          v-if="isProfileEditing"
          :initial-value="profile"
          :is-submitting="isProfileSaving"
          :error-message="profileSaveError"
          @submit="handleProfileSave"
          @cancel="cancelProfileEdit"
        />
        <PortfolioProfileCard v-else :profile="profile" @edit="startProfileEdit" />

        <p v-if="profileSuccessMessage" class="save-message success" role="status">
          {{ profileSuccessMessage }}
        </p>
      </template>
    </section>

    <section aria-labelledby="project-section-title">
      <div class="section-heading project-heading">
        <div>
          <h2 id="project-section-title">내 프로젝트</h2>
          <p>프로젝트별 공개 여부는 각 프로젝트에서 따로 설정합니다.</p>
        </div>
        <button type="button" class="primary-button" @click="goToCreate">
          <span aria-hidden="true">＋</span>
          프로젝트 등록
        </button>
      </div>

      <div v-if="isLoading" class="state-card">
        <span class="spinner" aria-hidden="true"></span>
        <p>포트폴리오를 불러오고 있습니다.</p>
      </div>

      <div v-else-if="errorMessage" class="state-card error-state">
        <p>{{ errorMessage }}</p>
        <button type="button" class="retry-button" @click="loadPortfolios">다시 시도</button>
      </div>

      <PortfolioEmptyState
        v-else-if="!portfolios.length"
        title="아직 등록된 프로젝트가 없습니다."
        description="경험과 역량을 보여줄 첫 프로젝트를 등록해보세요."
        button-text="첫 프로젝트 등록하기"
        @action="goToCreate"
      />

      <div v-else class="portfolio-grid">
        <PortfolioCard
          v-for="(portfolioItem, index) in portfolios"
          :key="getPortfolioId(portfolioItem) ?? index"
          :portfolio="portfolioItem"
          :is-deleting="String(deletingId) === String(getPortfolioId(portfolioItem))"
          @view="goToDetail"
          @edit="goToEdit"
          @delete="handleDelete"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { deletePortfolio, getMyPortfolios } from '@/features/portfolio/api/portfolioApi.js'
import {
  getPortfolioProfile,
  updatePortfolioProfile,
} from '@/features/portfolio/api/portfolioProfileApi.js'
import PortfolioCard from '@/features/portfolio/ui/PortfolioCard.vue'
import PortfolioEmptyState from '@/features/portfolio/ui/PortfolioEmptyState.vue'
import PortfolioProfileCard from '@/features/portfolio/ui/PortfolioProfileCard.vue'
import PortfolioProfileForm from '@/features/portfolio/ui/PortfolioProfileForm.vue'

const router = useRouter()

const profile = ref(null)
const isProfileLoading = ref(true)
const isProfileEditing = ref(false)
const isProfileSaving = ref(false)
const profileLoadError = ref('')
const profileSaveError = ref('')
const profileSuccessMessage = ref('')
const portfolios = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const deletingId = ref(null)

onMounted(() => {
  loadProfile()
  loadPortfolios()
})

async function loadProfile() {
  isProfileLoading.value = true
  profileLoadError.value = ''

  try {
    const data = await getPortfolioProfile()
    if (!data) throw new Error('Invalid portfolio profile response')
    profile.value = data
  } catch (error) {
    profileLoadError.value = getRequestError(
      error,
      '포트폴리오 프로필을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    isProfileLoading.value = false
  }
}

function startProfileEdit() {
  profileSaveError.value = ''
  profileSuccessMessage.value = ''
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
    const updatedProfile = await updatePortfolioProfile(form)
    if (!updatedProfile) throw new Error('Invalid portfolio profile response')
    profile.value = updatedProfile
    isProfileEditing.value = false
    profileSuccessMessage.value = '포트폴리오 프로필이 저장되었습니다.'
  } catch (error) {
    profileSaveError.value = getRequestError(
      error,
      '포트폴리오 프로필을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    isProfileSaving.value = false
  }
}

async function loadPortfolios() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getMyPortfolios({ page: 1, size: 10 })
    portfolios.value = extractPortfolioList(data)
  } catch (error) {
    errorMessage.value = getRequestError(
      error,
      '포트폴리오를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    isLoading.value = false
  }
}

function extractPortfolioList(data) {
  return Array.isArray(data?.content) ? data.content : []
}

function getPortfolioId(portfolio) {
  return portfolio?.portfolioId
}

function goToCreate() {
  router.push({ name: 'PortfolioCreate' })
}

function goToDetail(portfolio) {
  const id = getPortfolioId(portfolio)
  if (id === undefined || id === null) {
    alert('선택한 프로젝트 정보를 확인할 수 없습니다.')
    return
  }
  router.push({ name: 'PortfolioDetail', params: { id } })
}

function goToEdit(portfolio) {
  const id = getPortfolioId(portfolio)
  if (id === undefined || id === null) {
    alert('선택한 프로젝트를 수정할 수 없습니다.')
    return
  }
  router.push({ name: 'PortfolioEditor', params: { id } })
}

async function handleDelete(portfolio) {
  const id = getPortfolioId(portfolio)
  if (id === undefined || id === null) {
    alert('선택한 프로젝트를 삭제할 수 없습니다.')
    return
  }

  const title = portfolio.title || '이 프로젝트'
  if (!confirm(`'${title}'을(를) 삭제하시겠습니까?`)) return

  deletingId.value = id
  try {
    await deletePortfolio(id)
    await loadPortfolios()
  } catch (error) {
    alert(getRequestError(error, '프로젝트를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.'))
  } finally {
    deletingId.value = null
  }
}

function getRequestError(error, fallback) {
  const message = error?.response?.data?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}
</script>

<style scoped>
.page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
}

.page-header {
  margin-bottom: 32px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.page-header h1 {
  margin: 0 0 6px;
  color: #1a233d;
  font-size: 24px;
  font-weight: 700;
}

.page-header p {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
}

.profile-section {
  margin-bottom: 40px;
}

.section-heading {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.section-heading h2 {
  margin: 0 0 5px;
  color: #1a233d;
  font-size: 18px;
  font-weight: 700;
}

.section-heading p {
  margin: 0;
  color: #9ca3af;
  font-size: 13px;
}

.project-heading {
  align-items: center;
}

.primary-button {
  height: 42px;
  padding: 0 17px;
  border: none;
  border-radius: 6px;
  background: #1a233d;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.primary-button:hover {
  background: #253a63;
}

.portfolio-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.state-card {
  min-height: 280px;
  padding: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.state-card.profile-state {
  min-height: 180px;
}

.state-card p {
  margin: 14px 0 0;
  font-size: 14px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #dce2eb;
  border-top-color: #1a233d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.error-state {
  color: #b91c1c;
}

.retry-button {
  margin-top: 18px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  cursor: pointer;
}

.save-message {
  margin: 12px 0 0;
  padding: 10px 13px;
  border-radius: 6px;
  font-size: 13px;
}

.save-message.success {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 820px) {
  .portfolio-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .page {
    padding: 24px 18px;
  }

  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .project-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .primary-button {
    align-self: flex-start;
  }
}
</style>
