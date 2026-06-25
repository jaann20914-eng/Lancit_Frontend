<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">포트폴리오</h1>
        <p class="page-description">나의 역량을 소개하고 진행한 프로젝트를 관리할 수 있습니다.</p>
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
        <BaseButton @click="goToCreate">
          <span aria-hidden="true">＋</span>
          프로젝트 등록
        </BaseButton>
      </div>

      <BaseFilterBar role="search" aria-label="프로젝트 검색 및 정렬">
        <BaseSelect
          v-model="categoryFilter"
          width="110px"
          aria-label="프로젝트 카테고리"
          @change="resetPortfolioPage"
        >
          <option value="">전체</option>
          <option value="WEB_APP">웹/앱</option>
          <option value="DESIGN">디자인</option>
          <option value="BRANDING">브랜딩</option>
          <option value="MARKETING">마케팅</option>
          <option value="PLANNING">기획</option>
        </BaseSelect>
        <BaseSelect
          v-model="sortType"
          width="91px"
          aria-label="프로젝트 정렬"
          @change="resetPortfolioPage"
        >
          <option value="LATEST">최신순</option>
          <option value="OLDEST">오래된순</option>
        </BaseSelect>

        <BaseSearchInput
          v-model="keyword"
          type="text"
          placeholder="검색어를 입력하세요"
          :with-icon="false"
          aria-label="프로젝트 검색어"
          @search="submitPortfolioSearch"
        />
        <BaseButton @click="submitPortfolioSearch">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </template>
          검색
        </BaseButton>
      </BaseFilterBar>

      <div v-if="isLoading" class="state-card">
        <span class="spinner" aria-hidden="true"></span>
        <p>포트폴리오를 불러오고 있습니다.</p>
      </div>

      <div v-else-if="errorMessage" class="state-card error-state">
        <p>{{ errorMessage }}</p>
        <BaseButton variant="outline" size="sm" @click="loadPortfolios">다시 시도</BaseButton>
      </div>

      <PortfolioEmptyState
        v-else-if="!portfolios.length && !hasActiveProjectFilters"
        title="아직 등록된 프로젝트가 없습니다."
        description="경험과 역량을 보여줄 첫 프로젝트를 등록해보세요."
        button-text="첫 프로젝트 등록하기"
        @action="goToCreate"
      />

      <div v-else-if="!visiblePortfolios.length" class="state-card filter-empty-state">
        <p>검색 조건에 맞는 프로젝트가 없습니다.</p>
      </div>

      <template v-else>
        <div class="portfolio-grid">
          <PortfolioCard
            v-for="(portfolioItem, index) in visiblePortfolios"
            :key="getPortfolioId(portfolioItem) ?? index"
            :portfolio="portfolioItem"
            :banner-url="portfolioBannerUrls[getPortfolioId(portfolioItem)]"
            :is-deleting="String(deletingId) === String(getPortfolioId(portfolioItem))"
            @view="goToDetail"
            @edit="goToEdit"
            @delete="handleDelete"
          />
        </div>

        <BasePagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-elements="totalElements"
          :page-size="pageSize"
          :disabled="isLoading"
          @change="changePage"
        />
      </template>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  deletePortfolio,
  getMyPortfolios,
  getPortfolioFileUrl,
} from '@/features/portfolio/api/portfolioApi.js'
import {
  deletePortfolioProfileImage,
  getPortfolioProfile,
  getPortfolioProfileImageUrl,
  uploadPortfolioProfileImage,
  updatePortfolioProfile,
} from '@/features/portfolio/api/portfolioProfileApi.js'
import PortfolioCard from '@/features/portfolio/ui/PortfolioCard.vue'
import PortfolioEmptyState from '@/features/portfolio/ui/PortfolioEmptyState.vue'
import PortfolioProfileCard from '@/features/portfolio/ui/PortfolioProfileCard.vue'
import PortfolioProfileForm from '@/features/portfolio/ui/PortfolioProfileForm.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseFilterBar from '@/shared/ui/BaseFilterBar.vue'
import BasePagination from '@/shared/ui/BasePagination.vue'
import BaseSearchInput from '@/shared/ui/BaseSearchInput.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'

const router = useRouter()

const profile = ref(null)
const profileImageUrl = ref('')
const isProfileLoading = ref(true)
const isProfileEditing = ref(false)
const isProfileSaving = ref(false)
const profileLoadError = ref('')
const profileSaveError = ref('')
const profileSuccessMessage = ref('')
const portfolios = ref([])
const portfolioBannerUrls = ref({})
const keyword = ref('')
const categoryFilter = ref('')
const sortType = ref('LATEST')
const currentPage = ref(1)
const totalPages = ref(0)
const totalElements = ref(0)
const pageSize = 10
const isLoading = ref(true)
const errorMessage = ref('')
const deletingId = ref(null)

const visiblePortfolios = computed(() => portfolios.value)

const hasActiveProjectFilters = computed(
  () => Boolean(keyword.value.trim()) || Boolean(categoryFilter.value),
)

let searchTimerId = null

watch(keyword, () => {
  clearTimeout(searchTimerId)
  currentPage.value = 1
  searchTimerId = setTimeout(loadPortfolios, 300)
})

onBeforeUnmount(() => clearTimeout(searchTimerId))

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
    await loadProfileImage(data.profileFileId)
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
    let uploadedFileId = null
    let profileFileId = form.profileFileId
    if (form.profileImageFile) {
      const uploadedFile = await uploadPortfolioProfileImage(form.profileImageFile)
      if (!uploadedFile?.fileId) throw new Error('Invalid profile image upload response')
      uploadedFileId = uploadedFile.fileId
      profileFileId = uploadedFileId
    }

    const updatedProfile = await updateProfileWithTempImageCleanup(
      { ...form, profileFileId },
      uploadedFileId,
    )
    if (!updatedProfile) throw new Error('Invalid portfolio profile response')
    profile.value = updatedProfile
    await loadProfileImage(updatedProfile.profileFileId)
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

async function updateProfileWithTempImageCleanup(payload, uploadedFileId) {
  try {
    return await updatePortfolioProfile(payload)
  } catch (error) {
    await cleanupUploadedProfileImage(uploadedFileId)
    throw error
  }
}

async function cleanupUploadedProfileImage(uploadedFileId) {
  if (uploadedFileId === null || uploadedFileId === undefined) return

  try {
    await deletePortfolioProfileImage(uploadedFileId)
  } catch (error) {
    console.warn('프로필 이미지 TEMP 파일 정리에 실패했습니다.', error)
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
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getMyPortfolios({
      keyword: keyword.value.trim() || undefined,
      category: categoryFilter.value || undefined,
      sort: 'created_at',
      direction: sortType.value === 'OLDEST' ? 'ASC' : 'DESC',
      page: currentPage.value,
      size: pageSize,
    })
    portfolios.value = extractPortfolioList(data)
    totalPages.value = Number(data?.totalPages) || 0
    totalElements.value = Number(data?.totalElements ?? data?.totalCount ?? portfolios.value.length)

    if (currentPage.value > 1 && currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value)
      await loadPortfolios()
      return
    }
    loadPortfolioBannerUrls(portfolios.value)
  } catch (error) {
    errorMessage.value = getRequestError(
      error,
      '포트폴리오를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
    totalElements.value = 0
  } finally {
    isLoading.value = false
  }
}

function submitPortfolioSearch() {
  clearTimeout(searchTimerId)
  currentPage.value = 1
  loadPortfolios()
}

function resetPortfolioPage() {
  currentPage.value = 1
  loadPortfolios()
}

function changePage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
  loadPortfolios()
}

async function loadPortfolioBannerUrls(items) {
  portfolioBannerUrls.value = {}

  await Promise.all(
    items.map(async (portfolio) => {
      const id = getPortfolioId(portfolio)
      const fileId = portfolio?.bannerFileId
      if (id === null || id === undefined || fileId === null || fileId === undefined) return

      try {
        const url = await getPortfolioFileUrl(fileId)
        if (url) portfolioBannerUrls.value = { ...portfolioBannerUrls.value, [id]: url }
      } catch {
        // 배너를 불러오지 못해도 카드 placeholder와 관리 기능은 유지합니다.
      }
    }),
  )
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
  max-width: 100%;
  margin: 0 auto;
  padding: var(--lancit-page-padding);
}

.page-header {
  margin-bottom: var(--lancit-page-header-margin);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.page-header h1 {
  margin: 0 0 4px;
  color: #1a233d;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
}

.page-header p {
  margin: 0;
  color: var(--lancit-page-description-color);
  font-size: 14px;
  line-height: 1.5;
}

.profile-section {
  margin-bottom: 32px;
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

.project-toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 8px;
}

.search-input-wrap {
  position: relative;
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 17px;
  height: 17px;
  fill: none;
  stroke: #9ca3af;
  stroke-width: 2;
  pointer-events: none;
}

.search-input,
.filter-select {
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  color: #1a233d;
  font-size: 14px;
  outline: none;
}

.search-input {
  width: 100%;
  padding: 0 12px 0 38px;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-input:focus,
.filter-select:focus {
  border-color: #1a233d;
  box-shadow: 0 0 0 2px rgba(26, 35, 61, 0.08);
}

.filter-select {
  min-width: 96px;
  padding: 0 30px 0 12px;
  cursor: pointer;
}

.portfolio-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.pagination {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.pagination button {
  min-width: 64px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination span {
  color: #6b7280;
  font-size: 13px;
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

.state-card.filter-empty-state {
  min-height: 160px;
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

@media (max-width: 1100px) {
  .portfolio-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 800px) {
  .page {
    padding: var(--lancit-page-mobile-padding);
  }
}

@media (max-width: 700px) {
  .portfolio-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
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

  .project-toolbar {
    flex-wrap: wrap;
  }

  .search-input-wrap {
    flex-basis: 100%;
  }
}
</style>
