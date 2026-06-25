<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">공고문</h1>
        <p class="page-description">{{ activeTabDescription }}</p>
      </div>
      <BaseButton @click="goToCreate">＋ 공고 등록</BaseButton>
    </header>

    <div class="scope-tabs" role="tablist" aria-label="공고 조회 범위">
      <button
        v-for="tab in SCOPE_TABS"
        :key="tab.value"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.value"
        :class="['scope-tab', { active: activeTab === tab.value }]"
        @click="changeScope(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <p v-if="activeTab === 'ALL'" class="scope-notice">
      전체 공고 모드입니다. 다른 기업의 공고는 조회만 가능합니다.
    </p>

    <section class="filter-panel" aria-label="공고 검색 및 필터">
      <div class="status-tabs" role="tablist" aria-label="공고 상태">
        <button
          v-for="option in RECRUITMENT_STATUS_OPTIONS"
          :key="option.value || 'ALL'"
          type="button"
          :class="['status-tab', { active: filters.status === option.value }]"
          @click="changeStatusFilter(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <BaseFilterBar class="recruitment-search-row" as="form" flush @submit.prevent="applySearch">
        <BaseSearchInput
          v-model.trim="searchKeyword"
          placeholder="공고 제목이나 내용으로 검색"
          aria-label="공고 검색어"
        />
        <BaseButton type="submit">검색</BaseButton>

        <template #secondary>
          <BaseSelect
            v-model="filters.jobCategory"
            min-width="160px"
            aria-label="직종 카테고리"
            @change="resetAndLoad"
          >
            <option value="">전체 직종</option>
            <option
              v-for="option in JOB_CATEGORY_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </BaseSelect>

          <BaseSelect
            v-model="filters.recruitmentCategory"
            min-width="160px"
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
          </BaseSelect>

          <BaseSelect
            v-model="filters.sort"
            min-width="160px"
            aria-label="정렬 방식"
            @change="resetAndLoad"
          >
            <option value="LATEST">최신순</option>
            <option value="DEADLINE">마감 임박순</option>
            <option value="BUDGET">예산 높은순</option>
          </BaseSelect>
        </template>
      </BaseFilterBar>
    </section>

    <div v-if="isLoading" class="state-card">
      <span class="spinner" aria-hidden="true"></span>
      <p>공고를 불러오고 있습니다.</p>
    </div>

    <div v-else-if="errorMessage" class="state-card error-state">
      <p>{{ errorMessage }}</p>
      <BaseButton variant="outline" size="sm" @click="loadRecruitments">다시 시도</BaseButton>
    </div>

    <section v-else-if="!recruitments.length" class="empty-state">
      <div class="empty-icon" aria-hidden="true">＋</div>
      <h2>{{ activeTab === 'MY' ? '등록한 공고가 없습니다.' : '조회된 공고가 없습니다.' }}</h2>
      <p>{{ emptyStateDescription }}</p>
      <BaseButton v-if="activeTab === 'MY'" @click="goToCreate"> 공고 등록 </BaseButton>
    </section>

    <template v-else>
      <div class="result-summary">
        총 {{ pagination.totalElements.toLocaleString('ko-KR') }}개의 공고
      </div>

      <div class="recruitment-list">
        <article
          v-for="item in recruitments"
          :key="item.recruitmentId"
          class="recruitment-card"
          role="link"
          tabindex="0"
          @click="goToDetail(item.recruitmentId)"
          @keydown.enter.prevent="goToDetail(item.recruitmentId)"
          @keydown.space.prevent="goToDetail(item.recruitmentId)"
        >
          <div class="card-main">
            <div class="card-heading">
              <div class="title-area">
                <h2 class="card-title">{{ item.title || '제목 없는 공고' }}</h2>
                <div class="meta-row">
                  <span class="meta-item">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M8 7h4M8 11h4M8 15h4M3 21h18"
                      />
                    </svg>
                    {{ item.companyName || item.companyEmail || '기업 정보 없음' }}
                  </span>
                  <span class="meta-separator" aria-hidden="true">·</span>
                  <span class="meta-item">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    {{ item.workLocation || '위치 협의' }}
                  </span>
                  <span class="meta-separator" aria-hidden="true">·</span>
                  <span class="meta-item">{{ item.jobCategoryLabel }}</span>
                </div>
              </div>

              <div class="status-actions" @click.stop @keydown.stop>
                <template v-if="canManage(item) && item.canChangeStatus">
                  <button
                    v-for="statusOption in CARD_STATUS_OPTIONS"
                    :key="statusOption.value"
                    type="button"
                    :class="[
                      'status-choice',
                      statusOption.className,
                      { active: item.status === statusOption.value },
                    ]"
                    :aria-pressed="item.status === statusOption.value"
                    :disabled="changingStatusId === item.recruitmentId"
                    @click.stop="handleStatusChange(item, statusOption.value)"
                  >
                    {{ statusOption.label }}
                  </button>
                </template>
                <span v-else :class="['status-badge', item.statusMeta.className]">
                  {{ item.statusMeta.label }}
                </span>
              </div>
            </div>

            <p class="summary">{{ item.summary || '등록된 요약이 없습니다.' }}</p>

            <dl class="information-panel">
              <div class="information-item">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <ellipse cx="12" cy="5" rx="7" ry="3" />
                  <path
                    d="M5 5v5c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 10v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M5 15v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"
                  />
                </svg>
                <div>
                  <dt>예산</dt>
                  <dd>{{ formatBudget(item.budget) }}</dd>
                </div>
              </div>
              <div class="information-item">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M16 3v4M8 3v4M3 10h18" />
                </svg>
                <div>
                  <dt>예상 계약 기간</dt>
                  <dd>{{ formatDateRange(item.contractStartAt, item.contractEndAt) }}</dd>
                </div>
              </div>
              <div class="information-item">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <div>
                  <dt>마감일</dt>
                  <dd>{{ formatDate(item.recruitmentEndAt) }}</dd>
                </div>
              </div>
              <div class="information-item">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
                <div>
                  <dt>지원자</dt>
                  <dd class="applicant-count">{{ item.applicantCount }}명</dd>
                </div>
              </div>
            </dl>

            <div class="card-footer">
              <div v-if="item.techStacks.length" class="tech-stack-row">
                <span v-for="techStack in item.techStacks" :key="techStack" class="tech-tag">
                  {{ techStack }}
                </span>
              </div>
              <p v-else class="tech-stack-empty">등록된 기술 스택이 없습니다.</p>

              <div class="footer-actions" @click.stop @keydown.stop>
                <BaseButton
                  v-if="canManage(item)"
                  variant="secondary"
                  size="sm"
                  @click="goToCopy(item)"
                >
                  재등록
                </BaseButton>
                <BaseButton
                  v-if="canManage(item)"
                  variant="outline"
                  size="sm"
                  :disabled="!item.canEdit"
                  :title="item.canEdit ? '' : '지원자가 있는 공고는 수정할 수 없습니다.'"
                  @click="goToEdit(item)"
                >
                  수정
                </BaseButton>
                <BaseButton
                  v-if="canManage(item)"
                  variant="danger"
                  size="sm"
                  :disabled="!item.canDelete || deletingId === item.recruitmentId"
                  :title="item.canDelete ? '' : '지원자가 있는 공고는 삭제할 수 없습니다.'"
                  @click="handleDelete(item)"
                >
                  {{ deletingId === item.recruitmentId ? '삭제 중...' : '삭제' }}
                </BaseButton>
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
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/model/authStore.js'
import {
  deleteCompanyRecruitment,
  getAllRecruitments,
  getMyRecruitments,
  updateCompanyRecruitmentStatus,
} from '@/features/company/recruitments/api/companyRecruitmentApi.js'
import { getCompanyApiError } from '@/features/company/recruitments/api/companyRecruitmentError.js'
import {
  formatBudget,
  formatDate,
  getRecruitmentStatusMeta,
  JOB_CATEGORY_OPTIONS,
  RECRUITMENT_CATEGORY_OPTIONS,
  RECRUITMENT_STATUS_OPTIONS,
} from '@/features/company/recruitments/api/companyRecruitmentMapper.js'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseFilterBar from '@/shared/ui/BaseFilterBar.vue'
import BasePagination from '@/shared/ui/BasePagination.vue'
import BaseSearchInput from '@/shared/ui/BaseSearchInput.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'

const SCOPE_TABS = [
  { value: 'MY', label: '내 공고' },
  { value: 'ALL', label: '전체 공고' },
]
const CARD_STATUS_OPTIONS = [
  { value: 'OPEN', label: '모집중', className: 'status-choice-open' },
  { value: 'CLOSED', label: '마감', className: 'status-choice-closed' },
  { value: 'CANCELLED', label: '취소', className: 'status-choice-cancelled' },
]

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const recruitments = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const searchKeyword = ref('')
const changingStatusId = ref(null)
const deletingId = ref(null)
const activeTab = ref(route.query.scope === 'all' ? 'ALL' : 'MY')
const filters = reactive({
  status: '',
  keyword: '',
  jobCategory: '',
  recruitmentCategory: '',
  sort: 'LATEST',
})
const pagination = reactive({
  page: 1,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
})
let latestRequestId = 0

const activeTabDescription = computed(() =>
  activeTab.value === 'MY'
    ? '내 회사가 등록한 공고를 관리합니다.'
    : '다른 기업의 공고도 확인할 수 있습니다.',
)
const emptyStateDescription = computed(() =>
  activeTab.value === 'MY'
    ? '새 공고를 등록하고 프리랜서를 모집해보세요.'
    : '검색어나 필터를 변경한 뒤 다시 확인해주세요.',
)

onMounted(loadRecruitments)

async function loadRecruitments() {
  const requestId = ++latestRequestId
  const requestedTab = activeTab.value
  isLoading.value = true
  errorMessage.value = ''
  try {
    const getRecruitments = requestedTab === 'MY' ? getMyRecruitments : getAllRecruitments
    const data = await getRecruitments({
      page: pagination.page,
      size: pagination.size,
      status: filters.status || undefined,
      keyword: filters.keyword || undefined,
      jobCategory: filters.jobCategory || undefined,
      recruitmentCategory: filters.recruitmentCategory || undefined,
      sort: filters.sort,
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
    errorMessage.value = getCompanyApiError(
      error,
      '공고를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    if (requestId === latestRequestId) isLoading.value = false
  }
}

function changeScope(scope) {
  if (activeTab.value === scope) return
  activeTab.value = scope
  errorMessage.value = ''
  recruitments.value = []
  pagination.page = 1

  const query = { ...route.query }
  if (scope === 'ALL') query.scope = 'all'
  else delete query.scope
  router.replace({ query })
  loadRecruitments()
}

function changeStatusFilter(status) {
  if (filters.status === status) return
  filters.status = status
  resetAndLoad()
}

function applySearch() {
  filters.keyword = searchKeyword.value
  resetAndLoad()
}

function resetAndLoad() {
  pagination.page = 1
  loadRecruitments()
}

function changePage(page) {
  pagination.page = page
  loadRecruitments()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function formatDateRange(startAt, endAt) {
  if (!startAt && !endAt) return '미정'
  return `${formatDate(startAt)} ~ ${formatDate(endAt)}`
}

async function handleStatusChange(item, status) {
  if (!status || !canManage(item) || item.status === status) return

  const label = getRecruitmentStatusMeta(status).label
  if (!confirm(`'${item.title}' 공고를 '${label}' 상태로 변경하시겠습니까?`)) return

  changingStatusId.value = item.recruitmentId
  try {
    await updateCompanyRecruitmentStatus(item.recruitmentId, status)
    await loadRecruitments()
  } catch (error) {
    alert(getCompanyApiError(error, '공고 상태를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.'))
  } finally {
    changingStatusId.value = null
  }
}

async function handleDelete(item) {
  if (!canManage(item) || !item.canDelete) return
  if (!confirm(`'${item.title}' 공고를 삭제하시겠습니까?`)) return

  deletingId.value = item.recruitmentId
  try {
    await deleteCompanyRecruitment(item.recruitmentId)
    await loadRecruitments()
  } catch (error) {
    alert(getCompanyApiError(error, '공고를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.'))
  } finally {
    deletingId.value = null
  }
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function isOwner(item) {
  const currentCompanyEmail = normalizeEmail(authStore.email)
  const recruitmentCompanyEmail = normalizeEmail(item?.companyEmail)
  return Boolean(
    currentCompanyEmail &&
    recruitmentCompanyEmail &&
    currentCompanyEmail === recruitmentCompanyEmail,
  )
}

function canManage(item) {
  return isOwner(item)
}

function goToCreate() {
  router.push({ name: 'CompanyRecruitmentCreate' })
}

function goToDetail(recruitmentId) {
  router.push({
    name: 'CompanyRecruitmentDetail',
    params: { recruitmentId },
    query: activeTab.value === 'ALL' ? { scope: 'all' } : {},
  })
}

function goToEdit(item) {
  if (!canManage(item)) return
  router.push({ name: 'CompanyRecruitmentEdit', params: { recruitmentId: item.recruitmentId } })
}

function goToCopy(item) {
  if (!canManage(item)) return
  router.push({ name: 'CompanyRecruitmentCreate', query: { copyFrom: item.recruitmentId } })
}
</script>

<style scoped>
.page {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: var(--lancit-page-padding);
  color: #1f2937;
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
.primary-button {
  min-height: 42px;
  padding: 0 17px;
  border: 0;
  border-radius: 6px;
  background: #1a233d;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.primary-button:hover {
  background: #253a63;
}
.scope-tabs {
  margin-bottom: 12px;
  border-bottom: 1px solid #d1d5db;
  display: flex;
  gap: 4px;
}
.scope-tab {
  min-width: 100px;
  padding: 13px 18px 11px;
  border: 0;
  border-bottom: 3px solid transparent;
  background: none;
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.scope-tab.active {
  border-bottom-color: #1a233d;
  color: #1a233d;
}
.scope-notice {
  margin: 0 0 16px;
  padding: 12px 14px;
  border-radius: 7px;
  background: #f0f4f9;
  color: #4a6fa5;
  font-size: 13px;
}
.filter-panel {
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: white;
}
.status-tabs {
  padding: 0 18px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  overflow-x: auto;
}
.status-tab {
  padding: 15px 16px 13px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.status-tab.active {
  border-bottom-color: #1a233d;
  color: #1a233d;
  font-weight: 700;
}
.search-row {
  padding: 16px 18px;
  display: flex;
  gap: 8px;
}
.recruitment-search-row {
  padding: 16px 18px;
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
.sort-select {
  width: 140px;
  padding: 0 10px;
}
.search-button,
.retry-button {
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
.result-summary {
  margin-bottom: 10px;
  color: #6b7280;
  font-size: 13px;
}
.recruitment-list {
  display: grid;
  gap: var(--lancit-list-gap);
}
.recruitment-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    transform 0.15s;
}
.recruitment-card:hover,
.recruitment-card:focus-visible {
  border-color: #7f89a1;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
  outline: none;
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
.status-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
  flex: 0 0 auto;
}
.status-badge,
.tech-tag {
  min-height: 25px;
  padding: 0 9px;
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
.status-choice {
  min-height: 28px;
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
.card-title {
  margin: 0;
  color: #1a233d;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.4;
  text-align: left;
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
.summary {
  margin: 14px 0 16px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.6;
}
.information-panel {
  margin: 0;
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
.information-item .applicant-count {
  color: #4a6fa5;
}
.card-footer {
  min-height: 48px;
  padding-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.tech-stack-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tech-tag {
  background: #eef1f6;
  color: #334155;
  font-weight: 500;
}
.tech-stack-empty {
  margin: 0;
  color: #9ca3af;
  font-size: 11px;
}
.footer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 0 0 auto;
}
.footer-button {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 6px;
  background: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.edit-button {
  border: 1px solid #cbd5e1;
  color: #4b5563;
}
.delete-button {
  border: 1px solid #fecaca;
  color: #dc2626;
}
.footer-button:disabled {
  opacity: 0.45;
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
  font-size: 24px;
}
.empty-state h2 {
  margin: 0 0 8px;
  color: #1a233d;
  font-size: 18px;
}
.empty-state p {
  margin: 0 0 22px;
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
  .page {
    padding: var(--lancit-page-mobile-padding);
  }
  .page-header {
    align-items: center;
  }
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
  .search-row {
    flex-wrap: wrap;
  }
  .search-input {
    flex-basis: 100%;
  }
  .card-heading {
    flex-direction: column;
  }
  .status-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
@media (max-width: 520px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
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
  .footer-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
</style>
