<template>
  <section class="external-job-panel" aria-label="외부 공고 목록">
    <BaseFilterBar as="form" aria-label="외부 공고 검색 및 필터" @submit.prevent="applySearch">
      <BaseSelect
        v-model="filters.recommendationType"
        width="150px"
        aria-label="추천 분류"
        :disabled="isLoading"
        @change="resetAndLoad"
      >
        <option value="">전체 추천 분류</option>
        <option
          v-for="option in EXTERNAL_JOB_RECOMMENDATION_OPTIONS"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </BaseSelect>
      <BaseSelect
        v-model="filters.sort"
        width="91px"
        aria-label="정렬 방식"
        :disabled="isLoading"
        @change="resetAndLoad"
      >
        <option value="RECOMMENDED">추천순</option>
        <option value="LATEST">최신순</option>
      </BaseSelect>
      <BaseSearchInput
        v-model.trim="searchKeyword"
        type="text"
        placeholder="제목이나 회사명으로 검색"
        :with-icon="false"
        :disabled="isLoading"
        aria-label="외부 공고 검색어"
      />
      <BaseButton type="submit" :disabled="isLoading">
        <template #icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </template>
        검색
      </BaseButton>
    </BaseFilterBar>

    <p class="source-notice">
      원문 출처: 서울시 일자리플러스센터
    </p>

    <div v-if="isLoading" class="state-card">
      <span class="spinner" aria-hidden="true"></span>
      <p>외부 공고를 불러오고 있습니다.</p>
    </div>

    <div v-else-if="errorMessage" class="state-card error-state">
      <p>{{ errorMessage }}</p>
      <BaseButton variant="outline" size="sm" @click="loadExternalJobs">다시 시도</BaseButton>
    </div>

    <section v-else-if="!externalJobs.length" class="empty-state">
      <div class="empty-icon" aria-hidden="true">⌕</div>
      <h2>조건에 맞는 외부 공고가 없습니다.</h2>
      <p>검색어나 필터 조건을 변경한 뒤 다시 확인해주세요.</p>
    </section>

    <template v-else>
      <div class="result-summary">
        총 {{ pagination.totalElements.toLocaleString('ko-KR') }}개의 외부 공고
      </div>

      <div class="recruitment-list">
        <ExternalJobCard
          v-for="item in externalJobs"
          :key="item.externalJobId"
          :job="item"
          :show-ai-recommended-tag="shouldShowAiRecommendation(item)"
          @view-detail="goToDetail"
        />
      </div>

      <BasePagination
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        :total-elements="pagination.totalElements"
        :page-size="pagination.size"
        :disabled="isLoading"
        @change="changePage"
      />
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  EXTERNAL_JOB_RECOMMENDATION_OPTIONS,
  getExternalJobs,
  refreshExternalJobRecommendations,
} from '@/features/externalJobs/api/externalJobApi.js'
import { getUserMe } from '@/features/account/api/accountApi.js'
import { useAuthStore } from '@/features/auth/model/authStore.js'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseFilterBar from '@/shared/ui/BaseFilterBar.vue'
import BasePagination from '@/shared/ui/BasePagination.vue'
import BaseSearchInput from '@/shared/ui/BaseSearchInput.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import ExternalJobCard from './ExternalJobCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const externalJobs = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const searchKeyword = ref('')
const filters = reactive({ keyword: '', recommendationType: '', sort: 'RECOMMENDED' })
const pagination = reactive({
  page: 1,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
})
const currentJobCategory = computed(() => normalizeJobCategory(authStore.jobCategory))
const aiRecommendedJobId = ref(null)
const hasResolvedAiRecommendedJobId = ref(false)
let latestRequestId = 0
let isMounted = false

onMounted(async () => {
  await ensureCurrentUserJobCategory()
  isMounted = true
  loadExternalJobs({
    refreshRecommendations: Boolean(
      currentJobCategory.value && authStore.isExternalJobRecommendationStale,
    ),
  })
})

watch(currentJobCategory, (nextJobCategory, previousJobCategory) => {
  if (!isMounted || nextJobCategory === previousJobCategory) return
  resetAiRecommendedJob()
  resetAndLoad({ refreshRecommendations: Boolean(nextJobCategory) })
})

async function loadExternalJobs({ refreshRecommendations = false } = {}) {
  const requestId = ++latestRequestId
  const jobCategory = currentJobCategory.value
  isLoading.value = true
  errorMessage.value = ''

  try {
    if (refreshRecommendations && jobCategory) {
      try {
        await refreshExternalJobRecommendations(jobCategory)
        clearExternalJobRecommendationStale()
        resetAiRecommendedJob()
      } catch {
        // Refresh 실패 시에도 목록 API가 전역 fallback 기준으로 응답할 수 있어 조회는 계속한다.
      }
      if (requestId !== latestRequestId) return
    }

    const canResolveAiRecommendedJobFromCurrentRequest = isAiRecommendedSourceRequest()

    if (!canResolveAiRecommendedJobFromCurrentRequest) {
      await ensureAiRecommendedJobId(jobCategory)
      if (requestId !== latestRequestId) return
    }

    const data = await getExternalJobs({
      jobCategory: jobCategory || undefined,
      keyword: filters.keyword,
      recommendationType: filters.recommendationType,
      sort: filters.sort,
      page: pagination.page,
      size: pagination.size,
    })

    if (requestId !== latestRequestId) return

    externalJobs.value = data.content

    if (canResolveAiRecommendedJobFromCurrentRequest) {
      resolveAiRecommendedJobIdFrom(data.content)
    }

    Object.assign(pagination, {
      page: data.page,
      size: data.size,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      hasNext: data.hasNext,
      hasPrev: data.hasPrev,
    })
  } catch (error) {
    if (requestId !== latestRequestId) return
    externalJobs.value = []
    errorMessage.value = getExternalJobError(
      error,
      '외부 공고를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    if (requestId === latestRequestId) isLoading.value = false
  }
}

function applySearch() {
  filters.keyword = searchKeyword.value
  resetAndLoad()
}

function resetAndLoad(options = {}) {
  pagination.page = 1
  loadExternalJobs(options)
}

function changePage(page) {
  if (page < 1 || page > pagination.totalPages || page === pagination.page) return
  pagination.page = page
  loadExternalJobs()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goToDetail(externalJobId) {
  if (externalJobId === null || externalJobId === undefined) return
  router.push({
    name: 'ExternalJobDetail',
    params: { externalJobId },
    query: { from: 'external' },
  })
}

async function ensureCurrentUserJobCategory() {
  if (currentJobCategory.value || !authStore.isFreelancer) return

  try {
    const response = await getUserMe()
    updateAuthJobCategory(response.data?.data?.jobCategory ?? response.data?.jobCategory ?? '')
  } catch {
    updateAuthJobCategory('')
  }
}

function updateAuthJobCategory(jobCategory) {
  if (typeof authStore.updateJobCategory === 'function') {
    authStore.updateJobCategory(jobCategory, { markExternalJobsStale: false })
    return
  }
  authStore.jobCategory = jobCategory || null
}

function clearExternalJobRecommendationStale() {
  if (typeof authStore.clearExternalJobRecommendationStale === 'function') {
    authStore.clearExternalJobRecommendationStale()
  }
}

function normalizeJobCategory(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function shouldShowAiRecommendation(item) {
  const externalJobId = getExternalJobId(item)

  return (
    hasResolvedAiRecommendedJobId.value &&
    aiRecommendedJobId.value !== null &&
    externalJobId !== null &&
    String(externalJobId) === String(aiRecommendedJobId.value)
  )
}

function isAiRecommendedSourceRequest() {
  return (
    Number(pagination.page) === 1 &&
    filters.sort === 'RECOMMENDED' &&
    filters.recommendationType === '' &&
    filters.keyword.trim() === ''
  )
}

async function ensureAiRecommendedJobId(jobCategory) {
  if (hasResolvedAiRecommendedJobId.value) return

  const data = await getExternalJobs({
    jobCategory: jobCategory || undefined,
    keyword: '',
    recommendationType: '',
    sort: 'RECOMMENDED',
    page: 1,
    size: 1,
  })

  resolveAiRecommendedJobIdFrom(data.content)
}

function resolveAiRecommendedJobIdFrom(content = []) {
  aiRecommendedJobId.value = getExternalJobId(content?.[0])
  hasResolvedAiRecommendedJobId.value = true
}

function resetAiRecommendedJob() {
  aiRecommendedJobId.value = null
  hasResolvedAiRecommendedJobId.value = false
}

function getExternalJobId(item) {
  return item?.externalJobId ?? item?.id ?? null
}

function getExternalJobError(error, fallback) {
  const status = error?.response?.status
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  if (status === 403) return '외부 공고를 조회할 권한이 없습니다.'
  if (status === 404) return '요청한 외부 공고를 찾을 수 없습니다.'

  const message = error?.response?.data?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}
</script>

<style scoped>
.filter-panel {
  margin-bottom: 14px;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: white;
}
.search-row {
  display: flex;
  gap: 8px;
}
.filter-row {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.control {
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font: inherit;
  font-size: 13px;
  outline: none;
}
.control:focus {
  border-color: #1a233d;
  box-shadow: 0 0 0 3px rgba(26, 35, 61, 0.08);
}
.search-input {
  flex: 1;
  min-width: 160px;
  padding: 0 12px;
}
.filter-select,
.sort-select {
  min-width: 180px;
  padding: 0 10px;
}
.search-button,
.retry-button,
.reset-button {
  height: 40px;
  padding: 0 16px;
  border: 1px solid #1a233d;
  border-radius: 6px;
  background: white;
  color: #1a233d;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.reset-button {
  border-color: #d1d5db;
  color: #6b7280;
}
.source-notice {
  margin: 0 0 18px;
  padding: 11px 14px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e40af;
  font-size: 13px;
  line-height: 1.5;
}
.result-summary {
  margin-bottom: 10px;
  color: #6b7280;
  font-size: 13px;
}
.recruitment-list {
  display: grid;
  gap: 14px;
}
.state-card,
.empty-state {
  min-height: 330px;
  padding: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.state-card {
  color: #6b7280;
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
.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  border-radius: 50%;
  background: #e8edf5;
  color: #1a233d;
  display: grid;
  place-items: center;
  font-size: 26px;
}
.empty-state h2 {
  margin: 0 0 8px;
  color: #1a233d;
  font-size: 18px;
}
.empty-state p {
  margin: 0;
  color: #6b7280;
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
.pagination {
  margin-top: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #6b7280;
  font-size: 13px;
}
.pagination button {
  height: 34px;
  padding: 0 13px;
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
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 560px) {
  .search-row {
    flex-wrap: wrap;
  }
  .search-input {
    flex-basis: 100%;
  }
  .search-button {
    width: 100%;
  }
  .filter-select,
  .sort-select,
  .reset-button {
    width: 100%;
  }
}
</style>
