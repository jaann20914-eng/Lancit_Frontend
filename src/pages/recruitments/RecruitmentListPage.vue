<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>공고 찾기</h1>
        <p>나에게 맞는 프로젝트를 찾고 관심 있는 공고를 찜해보세요.</p>
      </div>
    </header>

    <div class="scope-tabs" role="tablist" aria-label="공고 조회 범위">
      <button
        v-for="tab in TABS"
        :key="tab.value"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.value"
        :class="['scope-tab', { active: activeTab === tab.value }]"
        @click="changeTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <section class="filter-panel" aria-label="공고 검색 및 필터">
      <form class="search-row" @submit.prevent="applySearch">
        <input
          v-model.trim="searchKeyword"
          type="search"
          class="control search-input"
          placeholder="공고 제목이나 내용으로 검색"
          aria-label="공고 검색어"
        />
        <button type="submit" class="search-button">검색</button>
      </form>

      <div class="filter-row">
        <select
          v-model="filters.jobCategory"
          class="control filter-select"
          aria-label="직종 카테고리"
          @change="resetAndLoad"
        >
          <option value="">전체 직종</option>
          <option v-for="option in JOB_CATEGORY_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>

        <select
          v-model="filters.recruitmentCategory"
          class="control filter-select"
          aria-label="공고 카테고리"
          @change="resetAndLoad"
        >
          <option value="">전체 공고 유형</option>
          <option
            v-for="option in RECRUITMENT_CATEGORY_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>

        <select
          v-model="filters.sort"
          class="control sort-select"
          aria-label="정렬 방식"
          @change="resetAndLoad"
        >
          <option value="LATEST">최신순</option>
          <option value="DEADLINE">마감 임박순</option>
          <option value="BUDGET">예산 높은순</option>
        </select>

        <button v-if="hasActiveFilters" type="button" class="reset-button" @click="resetFilters">
          필터 초기화
        </button>
      </div>
    </section>

    <div v-if="isLoading" class="state-card">
      <span class="spinner" aria-hidden="true"></span>
      <p>공고를 불러오고 있습니다.</p>
    </div>

    <div v-else-if="errorMessage" class="state-card error-state">
      <p>{{ errorMessage }}</p>
      <button type="button" class="retry-button" @click="loadRecruitments">다시 시도</button>
    </div>

    <section v-else-if="!recruitments.length" class="empty-state">
      <div class="empty-icon" aria-hidden="true">⌕</div>
      <h2>{{ emptyStateMessage }}</h2>
      <p>검색어나 카테고리 조건을 변경한 뒤 다시 확인해주세요.</p>
    </section>

    <template v-else>
      <div class="result-summary">총 {{ pagination.totalElements.toLocaleString('ko-KR') }}개의 공고</div>

      <div class="recruitment-list">
        <article v-for="item in recruitments" :key="item.recruitmentId" class="recruitment-card">
          <div class="card-main">
            <div class="card-heading">
              <div class="badge-row">
                <span :class="['status-badge', item.statusMeta.className]">
                  {{ item.statusMeta.label }}
                </span>
                <span class="category-badge">{{ item.jobCategoryLabel }}</span>
                <span class="category-badge light">{{ item.recruitmentCategoryLabel }}</span>
                <span v-if="item.isApplied" class="applied-badge">지원 완료</span>
                <!-- TODO: 목록 API에 applicationStatus가 제공되면 지원 상세 상태 배지를 추가한다. -->
                <span v-if="item.canApply" class="available-badge">지원 가능</span>
              </div>

              <button
                type="button"
                :class="['bookmark-button', { bookmarked: item.isBookmarked }]"
                :aria-label="item.isBookmarked ? '찜 해제' : '찜하기'"
                :aria-pressed="item.isBookmarked"
                :disabled="bookmarkingIds.has(item.recruitmentId)"
                @click="handleBookmark(item)"
              >
                <span aria-hidden="true">{{ item.isBookmarked ? '♥' : '♡' }}</span>
                {{ bookmarkingIds.has(item.recruitmentId) ? '처리 중' : item.isBookmarked ? '찜됨' : '찜' }}
              </button>
            </div>

            <p class="company-name">{{ item.companyName || '기업 정보 없음' }}</p>
            <button type="button" class="title-button" @click="goToDetail(item.recruitmentId)">
              {{ item.title || '제목 없는 공고' }}
            </button>
            <p class="summary">{{ item.summary || '등록된 요약이 없습니다.' }}</p>

            <div v-if="item.techStacks.length" class="tech-stack-row">
              <span v-for="techStack in item.techStacks" :key="techStack" class="tech-tag">
                {{ techStack }}
              </span>
            </div>
            <p v-else class="tech-stack-empty">등록된 기술 스택이 없습니다.</p>

            <dl class="information-row">
              <div>
                <dt>예산</dt>
                <dd>{{ formatBudget(item.budget) }}</dd>
              </div>
              <div>
                <dt>근무 위치</dt>
                <dd>{{ item.workLocation || '협의' }}</dd>
              </div>
              <div>
                <dt>모집 기간</dt>
                <dd>{{ formatDateRange(item.recruitmentStartAt, item.recruitmentEndAt) }}</dd>
              </div>
              <div>
                <dt>계약 기간</dt>
                <dd>{{ formatDateRange(item.contractStartAt, item.contractEndAt) }}</dd>
              </div>
            </dl>
          </div>

          <div class="card-actions">
            <span v-if="item.isApplied" class="application-state">이미 지원한 공고입니다.</span>
            <span v-else-if="item.canApply" class="application-state available">현재 지원할 수 있습니다.</span>
            <span v-else class="application-state">현재 지원할 수 없는 공고입니다.</span>
            <button type="button" class="detail-button" @click="goToDetail(item.recruitmentId)">
              상세 보기
            </button>
          </div>
        </article>
      </div>

      <nav v-if="pagination.totalPages > 1" class="pagination" aria-label="공고 목록 페이지">
        <button type="button" :disabled="!pagination.hasPrev" @click="changePage(pagination.page - 1)">
          이전
        </button>
        <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button type="button" :disabled="!pagination.hasNext" @click="changePage(pagination.page + 1)">
          다음
        </button>
      </nav>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getRecruitments,
  toggleRecruitmentBookmark,
} from '@/features/recruitments/api/recruitmentApi.js'
import {
  formatBudget,
  formatDate,
  JOB_CATEGORY_OPTIONS,
  RECRUITMENT_CATEGORY_OPTIONS,
} from '@/features/company/recruitments/api/companyRecruitmentMapper.js'

const TABS = [
  { value: 'ALL', label: '전체' },
  { value: 'APPLIED', label: '지원 완료' },
  { value: 'BOOKMARKED', label: '찜' },
]
const VALID_TABS = new Set(TABS.map((tab) => tab.value))
const EMPTY_STATE_MESSAGES = {
  ALL: '조건에 맞는 공고가 없습니다.',
  APPLIED: '지원 완료한 공고가 없습니다.',
  BOOKMARKED: '찜한 공고가 없습니다.',
}

const route = useRoute()
const router = useRouter()

const recruitments = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const searchKeyword = ref('')
const activeTab = ref(normalizeTab(route.query.tab))
const bookmarkingIds = reactive(new Set())
const filters = reactive({ jobCategory: '', recruitmentCategory: '', keyword: '', sort: 'LATEST' })
const pagination = reactive({
  page: 1,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
})
let latestRequestId = 0

const emptyStateMessage = computed(() => EMPTY_STATE_MESSAGES[activeTab.value])
const hasActiveFilters = computed(
  () => Boolean(filters.keyword || filters.jobCategory || filters.recruitmentCategory),
)

onMounted(() => {
  syncTabQuery()
  loadRecruitments()
})

watch(
  () => route.query.tab,
  (tab) => {
    const nextTab = normalizeTab(tab)
    if (nextTab === activeTab.value) {
      if (getQueryValue(tab) !== nextTab) syncTabQuery()
      return
    }

    activeTab.value = nextTab
    pagination.page = 1
    recruitments.value = []
    errorMessage.value = ''
    loadRecruitments()
  },
)

async function loadRecruitments() {
  const requestId = ++latestRequestId
  const requestedTab = activeTab.value
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getRecruitments({
      tab: requestedTab,
      keyword: filters.keyword,
      jobCategory: filters.jobCategory,
      recruitmentCategory: filters.recruitmentCategory,
      sort: filters.sort,
      page: pagination.page,
      size: pagination.size,
    })

    if (requestId !== latestRequestId || requestedTab !== activeTab.value) return

    recruitments.value = data.content
    Object.assign(pagination, {
      page: data.page,
      size: data.size,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      hasNext: data.hasNext,
      hasPrev: data.hasPrev,
    })
  } catch (error) {
    if (requestId !== latestRequestId || requestedTab !== activeTab.value) return
    recruitments.value = []
    errorMessage.value = getRecruitmentError(
      error,
      '공고를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    if (requestId === latestRequestId) isLoading.value = false
  }
}

function changeTab(tab) {
  if (activeTab.value === tab) return
  activeTab.value = tab
  pagination.page = 1
  recruitments.value = []
  errorMessage.value = ''
  syncTabQuery()
  loadRecruitments()
}

function applySearch() {
  filters.keyword = searchKeyword.value
  resetAndLoad()
}

function resetAndLoad() {
  pagination.page = 1
  loadRecruitments()
}

function resetFilters() {
  searchKeyword.value = ''
  filters.keyword = ''
  filters.jobCategory = ''
  filters.recruitmentCategory = ''
  pagination.page = 1
  loadRecruitments()
}

function changePage(page) {
  pagination.page = page
  loadRecruitments()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function handleBookmark(item) {
  const recruitmentId = item.recruitmentId
  if (recruitmentId === null || recruitmentId === undefined || bookmarkingIds.has(recruitmentId)) return

  bookmarkingIds.add(recruitmentId)
  try {
    const result = await toggleRecruitmentBookmark(recruitmentId)
    item.isBookmarked =
      typeof result?.isBookmarked === 'boolean' ? result.isBookmarked : !item.isBookmarked

    if (activeTab.value === 'BOOKMARKED' && !item.isBookmarked) {
      await loadRecruitments()
    }
  } catch (error) {
    alert(getRecruitmentError(error, '찜 상태를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.'))
  } finally {
    bookmarkingIds.delete(recruitmentId)
  }
}

function goToDetail(recruitmentId) {
  router.push({ name: 'RecruitmentDetail', params: { id: recruitmentId } })
}

function formatDateRange(startAt, endAt) {
  if (!startAt && !endAt) return '미정'
  return `${formatDate(startAt)} ~ ${formatDate(endAt)}`
}

function normalizeTab(value) {
  const tab = getQueryValue(value)
  return VALID_TABS.has(tab) ? tab : 'ALL'
}

function getQueryValue(value) {
  return Array.isArray(value) ? value[0] : value
}

function syncTabQuery() {
  if (getQueryValue(route.query.tab) === activeTab.value) return
  router.replace({ query: { ...route.query, tab: activeTab.value } })
}

function getRecruitmentError(error, fallback) {
  const status = error?.response?.status
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  if (status === 403) return '공고를 조회할 권한이 없습니다.'
  if (status === 404) return '요청한 공고를 찾을 수 없습니다.'

  const message = error?.response?.data?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}
</script>

<style scoped>
.page { width: 100%; max-width: 1200px; margin: 0 auto; padding: 32px; color: #1f2937; }
.page-header { margin-bottom: 24px; }
.page-header h1 { margin: 0 0 6px; color: #1a233d; font-size: 24px; }
.page-header p { margin: 0; color: #6b7280; font-size: 14px; }
.scope-tabs { margin-bottom: 16px; border-bottom: 1px solid #d1d5db; display: flex; gap: 4px; }
.scope-tab { min-width: 100px; padding: 13px 18px 11px; border: 0; border-bottom: 3px solid transparent; background: none; color: #6b7280; font-size: 14px; font-weight: 600; cursor: pointer; }
.scope-tab.active { border-bottom-color: #1a233d; color: #1a233d; }
.filter-panel { margin-bottom: 22px; padding: 18px; border: 1px solid #e5e7eb; border-radius: 10px; background: white; }
.search-row { display: flex; gap: 8px; }
.filter-row { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; }
.control { height: 40px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #374151; font: inherit; font-size: 13px; outline: none; }
.control:focus { border-color: #1a233d; box-shadow: 0 0 0 3px rgba(26, 35, 61, .08); }
.search-input { flex: 1; min-width: 160px; padding: 0 12px; }
.filter-select, .sort-select { min-width: 160px; padding: 0 10px; }
.search-button, .retry-button, .reset-button { height: 40px; padding: 0 16px; border: 1px solid #1a233d; border-radius: 6px; background: white; color: #1a233d; font-size: 13px; font-weight: 600; cursor: pointer; }
.reset-button { border-color: #d1d5db; color: #6b7280; }
.result-summary { margin-bottom: 10px; color: #6b7280; font-size: 13px; }
.recruitment-list { display: grid; gap: 14px; }
.recruitment-card { border: 1px solid #e5e7eb; border-radius: 12px; background: white; overflow: hidden; }
.card-main { padding: 24px; }
.card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.badge-row { margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 7px; }
.status-badge, .category-badge, .applied-badge, .available-badge, .tech-tag { min-height: 25px; padding: 0 9px; border-radius: 999px; display: inline-flex; align-items: center; font-size: 11px; font-weight: 600; }
.status-open { background: #dcfce7; color: #15803d; }
.status-closed, .status-expired { background: #f3f4f6; color: #4b5563; }
.status-cancelled, .status-unknown { background: #fee2e2; color: #991b1b; }
.category-badge { background: #e8edf5; color: #1a233d; }
.category-badge.light { background: #f3f4f6; color: #6b7280; }
.applied-badge { background: #ede9fe; color: #6d28d9; }
.available-badge { background: #ecfdf5; color: #047857; }
.bookmark-button { min-width: 72px; height: 36px; padding: 0 11px; border: 1px solid #d1d5db; border-radius: 7px; background: white; color: #6b7280; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.bookmark-button span { margin-right: 3px; font-size: 16px; }
.bookmark-button.bookmarked { border-color: #fda4af; background: #fff1f2; color: #e11d48; }
.bookmark-button:disabled { opacity: .55; cursor: not-allowed; }
.company-name { margin: 0 0 5px; color: #6b7280; font-size: 13px; font-weight: 600; }
.title-button { padding: 0; border: 0; background: none; color: #1a233d; font-size: 19px; font-weight: 700; text-align: left; cursor: pointer; }
.title-button:hover { text-decoration: underline; }
.summary { margin: 7px 0 14px; color: #6b7280; font-size: 14px; line-height: 1.6; }
.tech-stack-row { margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 6px; }
.tech-tag { background: #f0f4f9; color: #4a6fa5; font-weight: 500; }
.tech-stack-empty { margin: 0 0 16px; color: #9ca3af; font-size: 12px; }
.information-row { margin: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.information-row div { min-width: 0; }
.information-row dt { margin-bottom: 4px; color: #9ca3af; font-size: 11px; }
.information-row dd { margin: 0; color: #374151; font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
.card-actions { min-height: 60px; padding: 12px 18px; border-top: 1px solid #e5e7eb; background: #fafafa; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.application-state { color: #6b7280; font-size: 12px; }
.application-state.available { color: #047857; font-weight: 600; }
.detail-button { min-height: 36px; padding: 0 14px; border: 1px solid #1a233d; border-radius: 6px; background: #1a233d; color: white; font-size: 12px; font-weight: 600; cursor: pointer; }
.state-card, .empty-state { min-height: 330px; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.state-card { color: #6b7280; }
.state-card p { margin: 14px 0 0; }
.error-state { color: #b91c1c; }
.retry-button { margin-top: 18px; }
.empty-icon { width: 48px; height: 48px; margin-bottom: 16px; border-radius: 50%; background: #e8edf5; color: #1a233d; display: grid; place-items: center; font-size: 26px; }
.empty-state h2 { margin: 0 0 8px; color: #1a233d; font-size: 18px; }
.empty-state p { margin: 0; color: #6b7280; font-size: 14px; }
.spinner { width: 28px; height: 28px; border: 3px solid #dce2eb; border-top-color: #1a233d; border-radius: 50%; animation: spin .8s linear infinite; }
.pagination { margin-top: 22px; display: flex; align-items: center; justify-content: center; gap: 14px; color: #6b7280; font-size: 13px; }
.pagination button { height: 34px; padding: 0 13px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #374151; cursor: pointer; }
.pagination button:disabled { opacity: .4; cursor: not-allowed; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 800px) { .page { padding: 24px 18px; } .information-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .search-row { flex-wrap: wrap; } .search-input { flex-basis: 100%; } .search-button { width: 100%; } .filter-select, .sort-select, .reset-button { width: 100%; } .card-heading { align-items: stretch; flex-direction: column; } .bookmark-button { align-self: flex-start; } .information-row { grid-template-columns: 1fr; } .card-actions { align-items: stretch; flex-direction: column; } .detail-button { width: 100%; } }
</style>
