<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>공고 관리</h1>
        <p>{{ activeTabDescription }}</p>
      </div>
      <button type="button" class="primary-button" @click="goToCreate">＋ 공고 등록</button>
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

    <section class="filter-panel" aria-label="공고 검색 및 정렬">
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

      <form class="search-row" @submit.prevent="applySearch">
        <input
          v-model.trim="searchKeyword"
          type="search"
          class="control search-input"
          placeholder="제목, 내용으로 검색"
          aria-label="공고 검색어"
        />
        <select v-model="filters.sort" class="control sort-select" aria-label="정렬 방식" @change="resetAndLoad">
          <option value="LATEST">최신순</option>
          <option value="DEADLINE">마감 임박순</option>
          <option value="BUDGET">예산 높은순</option>
        </select>
        <button type="submit" class="search-button">검색</button>
      </form>
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
      <div class="empty-icon" aria-hidden="true">＋</div>
      <h2>{{ activeTab === 'MY' ? '등록한 공고가 없습니다.' : '조회된 공고가 없습니다.' }}</h2>
      <p>{{ emptyStateDescription }}</p>
      <button v-if="activeTab === 'MY'" type="button" class="primary-button" @click="goToCreate">
        공고 등록
      </button>
    </section>

    <template v-else>
      <div class="result-summary">총 {{ pagination.totalElements.toLocaleString('ko-KR') }}개의 공고</div>

      <div class="recruitment-list">
        <article v-for="item in recruitments" :key="item.recruitmentId" class="recruitment-card">
          <div class="card-main">
            <div class="badge-row">
              <span :class="['status-badge', item.statusMeta.className]">{{ item.statusMeta.label }}</span>
              <span class="category-badge">{{ item.jobCategoryLabel }}</span>
              <span class="category-badge light">{{ item.recruitmentCategoryLabel }}</span>
              <span v-if="activeTab === 'ALL'" class="company-badge">
                {{ item.companyName || item.companyEmail || '기업 정보 없음' }}
              </span>
            </div>
            <button type="button" class="title-button" @click="goToDetail(item.recruitmentId)">
              {{ item.title || '제목 없는 공고' }}
            </button>
            <p class="summary">{{ item.summary || '등록된 요약이 없습니다.' }}</p>

            <div v-if="item.techStacks.length" class="tech-stack-row">
              <span v-for="techStack in item.techStacks" :key="techStack" class="tech-tag">{{ techStack }}</span>
            </div>

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
                <dt>모집 마감</dt>
                <dd>{{ formatDate(item.recruitmentEndAt) }}</dd>
              </div>
              <div>
                <dt>지원자</dt>
                <dd class="applicant-count">{{ item.applicantCount }}명</dd>
              </div>
            </dl>
          </div>

          <div class="card-actions">
            <button type="button" class="action-button" @click="goToDetail(item.recruitmentId)">상세 보기</button>
            <template v-if="canManage(item)">
              <button
                type="button"
                class="action-button"
                :disabled="!item.canEdit"
                :title="item.canEdit ? '' : '지원자가 있는 공고는 수정할 수 없습니다.'"
                @click="goToEdit(item)"
              >
                수정
              </button>
              <button type="button" class="action-button primary-outline" @click="goToApplicants(item)">
                지원자 보기 ({{ item.applicantCount }})
              </button>
              <select
                v-if="item.canChangeStatus"
                class="action-select"
                aria-label="공고 상태 변경"
                :disabled="changingStatusId === item.recruitmentId"
                @change="handleStatusChange(item, $event)"
              >
                <option value="">상태 변경</option>
                <option v-if="item.status !== 'OPEN'" value="OPEN">모집중으로 변경</option>
                <option v-if="item.status !== 'CLOSED'" value="CLOSED">마감으로 변경</option>
                <option v-if="item.status !== 'CANCELLED'" value="CANCELLED">취소로 변경</option>
              </select>
              <button
                type="button"
                class="action-button danger"
                :disabled="!item.canDelete || deletingId === item.recruitmentId"
                :title="item.canDelete ? '' : '지원자가 있는 공고는 삭제할 수 없습니다.'"
                @click="handleDelete(item)"
              >
                {{ deletingId === item.recruitmentId ? '삭제 중...' : '삭제' }}
              </button>
            </template>
          </div>
        </article>
      </div>

      <nav v-if="pagination.totalPages > 1" class="pagination" aria-label="공고 목록 페이지">
        <button type="button" :disabled="!pagination.hasPrev" @click="changePage(pagination.page - 1)">이전</button>
        <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button type="button" :disabled="!pagination.hasNext" @click="changePage(pagination.page + 1)">다음</button>
      </nav>
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
  RECRUITMENT_STATUS_OPTIONS,
} from '@/features/company/recruitments/api/companyRecruitmentMapper.js'

const SCOPE_TABS = [
  { value: 'MY', label: '내 공고' },
  { value: 'ALL', label: '전체 공고' },
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
const filters = reactive({ status: '', keyword: '', sort: 'LATEST' })
const pagination = reactive({ page: 1, size: 10, totalElements: 0, totalPages: 0, hasNext: false, hasPrev: false })
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
    errorMessage.value = getCompanyApiError(error, '공고를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
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

async function handleStatusChange(item, event) {
  const status = event.target.value
  event.target.value = ''
  if (!status || !canManage(item)) return

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
  return Boolean(currentCompanyEmail && recruitmentCompanyEmail && currentCompanyEmail === recruitmentCompanyEmail)
}

function canManage(item) {
  return activeTab.value === 'MY' && isOwner(item)
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

function goToApplicants(item) {
  if (!canManage(item)) return
  router.push({ name: 'CompanyApplicantList', params: { recruitmentId: item.recruitmentId } })
}
</script>

<style scoped>
.page { width: 100%; max-width: 1200px; margin: 0 auto; padding: 32px; color: #1f2937; }
.page-header { margin-bottom: 24px; display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
.page-header h1 { margin: 0 0 6px; color: #1a233d; font-size: 24px; }
.page-header p { margin: 0; color: #6b7280; font-size: 14px; }
.primary-button { min-height: 42px; padding: 0 17px; border: 0; border-radius: 6px; background: #1a233d; color: white; font-size: 14px; font-weight: 600; cursor: pointer; }
.primary-button:hover { background: #253a63; }
.scope-tabs { margin-bottom: 12px; border-bottom: 1px solid #d1d5db; display: flex; gap: 4px; }
.scope-tab { min-width: 100px; padding: 13px 18px 11px; border: 0; border-bottom: 3px solid transparent; background: none; color: #6b7280; font-size: 14px; font-weight: 600; cursor: pointer; }
.scope-tab.active { border-bottom-color: #1a233d; color: #1a233d; }
.scope-notice { margin: 0 0 16px; padding: 12px 14px; border-radius: 7px; background: #f0f4f9; color: #4a6fa5; font-size: 13px; }
.filter-panel { margin-bottom: 22px; border: 1px solid #e5e7eb; border-radius: 10px; background: white; }
.status-tabs { padding: 0 18px; border-bottom: 1px solid #e5e7eb; display: flex; overflow-x: auto; }
.status-tab { padding: 15px 16px 13px; border: 0; border-bottom: 2px solid transparent; background: none; color: #6b7280; font-size: 13px; cursor: pointer; white-space: nowrap; }
.status-tab.active { border-bottom-color: #1a233d; color: #1a233d; font-weight: 700; }
.search-row { padding: 16px 18px; display: flex; gap: 8px; }
.control { height: 40px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #374151; font: inherit; font-size: 13px; outline: none; }
.control:focus { border-color: #1a233d; box-shadow: 0 0 0 3px rgba(26,35,61,.08); }
.search-input { flex: 1; min-width: 160px; padding: 0 12px; }
.sort-select { width: 140px; padding: 0 10px; }
.search-button, .retry-button { height: 40px; padding: 0 16px; border: 1px solid #1a233d; border-radius: 6px; background: white; color: #1a233d; font-size: 13px; font-weight: 600; cursor: pointer; }
.result-summary { margin-bottom: 10px; color: #6b7280; font-size: 13px; }
.recruitment-list { display: grid; gap: 14px; }
.recruitment-card { border: 1px solid #e5e7eb; border-radius: 12px; background: white; overflow: hidden; }
.card-main { padding: 24px; }
.badge-row { margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 7px; }
.status-badge, .category-badge, .company-badge, .tech-tag { min-height: 25px; padding: 0 9px; border-radius: 999px; display: inline-flex; align-items: center; font-size: 11px; font-weight: 600; }
.status-open { background: #dcfce7; color: #15803d; }
.status-closed, .status-expired { background: #f3f4f6; color: #4b5563; }
.status-cancelled, .status-unknown { background: #fee2e2; color: #991b1b; }
.category-badge { background: #e8edf5; color: #1a233d; }
.category-badge.light { background: #f3f4f6; color: #6b7280; }
.company-badge { background: #fff7ed; color: #9a3412; }
.title-button { padding: 0; border: 0; background: none; color: #1a233d; font-size: 19px; font-weight: 700; text-align: left; cursor: pointer; }
.title-button:hover { text-decoration: underline; }
.summary { margin: 7px 0 14px; color: #6b7280; font-size: 14px; line-height: 1.6; }
.tech-stack-row { margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 6px; }
.tech-tag { background: #f0f4f9; color: #4a6fa5; font-weight: 500; }
.information-row { margin: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.information-row div { min-width: 0; }
.information-row dt { margin-bottom: 4px; color: #9ca3af; font-size: 11px; }
.information-row dd { margin: 0; color: #374151; font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
.information-row .applicant-count { color: #4a6fa5; }
.card-actions { padding: 13px 18px; border-top: 1px solid #e5e7eb; background: #fafafa; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.action-button, .action-select { min-height: 34px; padding: 0 11px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #4b5563; font-size: 12px; cursor: pointer; }
.action-button.primary-outline { border-color: #1a233d; color: #1a233d; font-weight: 600; }
.action-button.danger { border-color: #fecaca; color: #dc2626; }
.action-button:disabled, .action-select:disabled { opacity: .45; cursor: not-allowed; }
.state-card, .empty-state { min-height: 330px; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.state-card { color: #6b7280; }
.state-card p { margin: 14px 0 0; }
.error-state { color: #b91c1c; }
.retry-button { margin-top: 18px; }
.empty-icon { width: 48px; height: 48px; margin-bottom: 16px; border-radius: 50%; background: #e8edf5; color: #1a233d; display: grid; place-items: center; font-size: 24px; }
.empty-state h2 { margin: 0 0 8px; color: #1a233d; font-size: 18px; }
.empty-state p { margin: 0 0 22px; color: #6b7280; font-size: 14px; }
.spinner { width: 28px; height: 28px; border: 3px solid #dce2eb; border-top-color: #1a233d; border-radius: 50%; animation: spin .8s linear infinite; }
.pagination { margin-top: 22px; display: flex; align-items: center; justify-content: center; gap: 14px; color: #6b7280; font-size: 13px; }
.pagination button { height: 34px; padding: 0 13px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #374151; cursor: pointer; }
.pagination button:disabled { opacity: .4; cursor: not-allowed; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 800px) { .page { padding: 24px 18px; } .page-header { align-items: center; } .information-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } .search-row { flex-wrap: wrap; } .search-input { flex-basis: 100%; } }
@media (max-width: 520px) { .page-header { align-items: flex-start; flex-direction: column; } .information-row { grid-template-columns: 1fr; } .card-actions { justify-content: stretch; } .action-button, .action-select { flex: 1; } }
</style>
