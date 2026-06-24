<template>
  <section class="external-job-panel" aria-label="외부 공고 목록">
    <BaseFilterBar as="form" aria-label="외부 공고 검색 및 필터" @submit.prevent="applySearch">
      <BaseSelect
        v-model="filters.recommendationType"
        width="150px"
        aria-label="추천 분류"
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
      <BaseSelect v-model="filters.sort" width="91px" aria-label="정렬 방식" @change="resetAndLoad">
        <option value="RECOMMENDED">추천순</option>
        <option value="LATEST">최신순</option>
      </BaseSelect>
      <BaseSearchInput
        v-model.trim="searchKeyword"
        type="text"
        placeholder="제목이나 회사명으로 검색"
        :with-icon="false"
        aria-label="외부 공고 검색어"
      />
      <BaseButton type="submit">
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
      외부 공고는 공공 채용 API를 기반으로 수집된 정보입니다. 지원은 원문 사이트에서 진행해주세요.
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
        <article
          v-for="(item, index) in externalJobs"
          :key="item.externalJobId"
          class="recruitment-card"
        >
          <div class="card-main">
            <div class="card-heading">
              <div class="title-area">
                <button type="button" class="title-button" @click="goToDetail(item.externalJobId)">
                  {{ item.title || '제목 없는 공고' }}
                </button>
                <div class="meta-row">
                  <span class="meta-item">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M8 7h4M8 11h4M8 15h4M3 21h18"
                      />
                    </svg>
                    {{ displayText(item.companyName, '기관 정보 없음') }}
                  </span>
                  <span class="meta-separator" aria-hidden="true">·</span>
                  <span class="meta-item">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    {{ displayText(item.location, '-') }}
                  </span>
                </div>
              </div>

              <div class="badge-row">
                <span v-if="shouldShowAiRecommendation(index)" class="ai-recommendation-badge">
                  AI가 추천하는 공고입니다.
                </span>
                <span
                  v-if="item.recommendationLabel"
                  :class="['recommendation-badge', item.recommendationClassName]"
                >
                  {{ item.recommendationLabel }}
                </span>
                <span v-if="item.freelanceTypeLabel" class="freelance-badge">
                  {{ item.freelanceTypeLabel }}
                </span>
              </div>
            </div>

            <dl class="information-panel">
              <div class="information-item">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M7 8h10M7 12h10M7 16h6" />
                </svg>
                <div>
                  <dt>업종 카테고리</dt>
                  <dd>{{ displayText(item.jobCategoryRaw, '-') }}</dd>
                </div>
              </div>
              <div class="information-item">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <ellipse cx="12" cy="5" rx="7" ry="3" />
                  <path
                    d="M5 5v5c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 10v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M5 15v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"
                  />
                </svg>
                <div>
                  <dt>급여/보수</dt>
                  <dd>{{ displayText(item.salaryText, '-') }}</dd>
                </div>
              </div>
              <div class="information-item">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <div>
                  <dt>마감일</dt>
                  <dd>{{ formatExternalDate(item.deadlineAt) }}</dd>
                </div>
              </div>
              <div class="information-item">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 19V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
                  <path d="M14 3v5h5M8 13h8M8 17h5" />
                </svg>
                <div>
                  <dt>출처</dt>
                  <dd>{{ displayText(item.sourceLabel, '-') }}</dd>
                </div>
              </div>
            </dl>

            <div class="card-footer">
              <div class="action-buttons">
                <BaseButton
                  class="detail-button"
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="goToDetail(item.externalJobId)"
                >
                  {{ item.detailButtonLabel || '상세 보기' }}
                </BaseButton>
                <a
                  v-if="item.sourceUrl"
                  class="source-link"
                  :href="item.sourceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ item.sourceButtonLabel || '사이트에서 확인' }}
                </a>
                <button v-else type="button" class="source-link disabled-link" disabled>
                  원문 없음
                </button>
              </div>
            </div>
          </div>
        </article>
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
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  EXTERNAL_JOB_RECOMMENDATION_OPTIONS,
  getExternalJobs,
} from '@/features/externalJobs/api/externalJobApi.js'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseFilterBar from '@/shared/ui/BaseFilterBar.vue'
import BasePagination from '@/shared/ui/BasePagination.vue'
import BaseSearchInput from '@/shared/ui/BaseSearchInput.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'

const router = useRouter()
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
let latestRequestId = 0

onMounted(() => {
  loadExternalJobs()
})

async function loadExternalJobs() {
  const requestId = ++latestRequestId
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getExternalJobs({
      keyword: filters.keyword,
      recommendationType: filters.recommendationType,
      sort: filters.sort,
      page: pagination.page,
      size: pagination.size,
    })

    if (requestId !== latestRequestId) return

    externalJobs.value = data.content
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

function resetAndLoad() {
  pagination.page = 1
  loadExternalJobs()
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

function displayText(value, fallback = '-') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function formatExternalDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10).replaceAll('-', '.')
}

function shouldShowAiRecommendation(index) {
  const pageNumber = Number(pagination.page)
  return (
    filters.sort === 'RECOMMENDED' &&
    index === 0 &&
    !pagination.hasPrev &&
    (pageNumber === 0 || pageNumber === 1)
  )
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
.recruitment-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.recruitment-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
}
.card-main {
  padding: 22px 24px 16px;
}
.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.title-area {
  min-width: 0;
}
.title-button {
  padding: 0;
  border: 0;
  background: none;
  color: #1a233d;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.4;
  text-align: left;
  overflow-wrap: anywhere;
  cursor: pointer;
}
.title-button:hover {
  text-decoration: underline;
}
.badge-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  flex: 0 0 auto;
}
.recommendation-badge,
.ai-recommendation-badge,
.freelance-badge {
  min-height: 25px;
  padding: 0 9px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
}
.ai-recommendation-badge {
  background: #1a233d;
  color: #ffffff;
}
.recommendation-high {
  background: #fef3c7;
  color: #92400e;
}
.recommendation-recommended {
  background: #dcfce7;
  color: #15803d;
}
.recommendation-possible,
.recommendation-unknown {
  background: #e0f2fe;
  color: #0369a1;
}
.freelance-badge {
  background: #ede9fe;
  color: #6d28d9;
}
.meta-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #7c8799;
  font-size: 12px;
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.meta-item svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}
.meta-separator {
  color: #cbd5e1;
}
.information-panel {
  margin: 16px 0 0;
  padding: 13px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fcfcfd;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.information-item {
  min-width: 0;
  padding: 0 14px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 11px;
}
.information-item:first-child {
  padding-left: 0;
}
.information-item:last-child {
  padding-right: 0;
  border-right: 0;
}
.information-item > svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: #64748b;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
  flex: 0 0 auto;
}
.information-item div {
  min-width: 0;
}
.information-item dt {
  margin-bottom: 3px;
  color: #9ca3af;
  font-size: 10px;
}
.information-item dd {
  margin: 0;
  color: #374151;
  font-size: 12px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.card-footer {
  min-height: 48px;
  padding-top: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
}
.action-buttons {
  display: flex;
  gap: 8px;
  flex: 0 0 auto;
}
.detail-button {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.source-link {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid #1a233d;
  border-radius: 6px;
  background: #1a233d;
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}
.disabled-link {
  border-color: #d1d5db;
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
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
@media (max-width: 800px) {
  .information-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .information-item {
    padding: 12px;
    border-right: 0;
    border-bottom: 1px solid #e5e7eb;
  }
  .information-item:nth-child(odd) {
    padding-left: 0;
    border-right: 1px solid #e5e7eb;
  }
  .information-item:nth-child(even) {
    padding-right: 0;
  }
  .information-item:nth-last-child(-n + 2) {
    border-bottom: 0;
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
  .card-heading {
    flex-direction: column;
  }
  .badge-row {
    width: 100%;
    justify-content: flex-start;
  }
  .information-panel {
    grid-template-columns: 1fr;
  }
  .information-item,
  .information-item:nth-child(odd),
  .information-item:nth-child(even) {
    padding: 12px 0;
    border-right: 0;
    border-bottom: 1px solid #e5e7eb;
  }
  .information-item:first-child {
    padding-top: 0;
  }
  .information-item:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }
  .card-footer {
    align-items: stretch;
    flex-direction: column;
  }
  .action-buttons {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
