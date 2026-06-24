<template>
  <div class="page">
    <h1 class="page-title">계약서</h1>
    <p class="page-sub">계약 내용을 확인하고 관리하세요</p>

    <!-- 탭 -->
    <div class="tab-bar">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        :class="['tab-item', activeStatus === tab.value ? 'active' : '']"
        @click="changeTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 검색 -->
    <div class="search-bar">
      <select v-model="keywordType" class="keyword-type-select">
        <option value="">전체</option>
        <option value="title">공고명</option>
        <option value="freelancer">프리랜서 이름</option>
      </select>
      <div class="search-input-wrap">
        <input
          v-model="keyword"
          type="text"
          class="search-input"
          placeholder="검색 내용을 입력하세요"
          @keyup.enter="handleSearch"
        />
      </div>
      <button class="btn-search" @click="handleSearch">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        검색
      </button>
    </div>

    <!-- 목록 -->
    <div v-if="isLoading" class="loading">불러오는 중...</div>

    <div v-else-if="contracts.length === 0" class="empty-state">
      <p>해당 조건의 계약이 없습니다</p>
    </div>

    <div v-else class="contract-list">
      <div
        v-for="item in contracts"
        :key="item.contractId || item.contract_id"
        class="contract-item"
        :class="{ disabled: item.status === 'PROPOSAL' }"
        @click="item.status !== 'PROPOSAL' && goDetail(item)"
      >
        <span :class="['status-badge', statusBadgeClass(item.status)]">
          {{ statusLabel(item.status) }}
        </span>

        <div class="contract-info">
          <p class="contract-title">
            {{ item.recruitmentTitle || item.recruitment_title || '계약서' }}
          </p>
          <p class="contract-meta-line">
            <span v-if="isCompanyView">프리랜서</span>
            <span v-else>회사</span>
            <strong>{{ counterpartName(item) }}</strong>
          </p>
          <p class="contract-meta-line">
            <span>기간</span>
            <strong>{{ contractPeriod(item) }}</strong>
          </p>
          <p class="contract-meta-line">
            <span>금액</span>
            <strong>{{ formatMoney(totalWage(item)) }}</strong>
          </p>
        </div>

        <!-- ✅ 알림 배지 -->
        <span
          v-if="notificationStore.hasUnreadByContract(item.contractId || item.contract_id)"
          class="contract-badge"
        ></span>

        <svg
          class="chevron"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <div class="pagination">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        ‹
      </button>
      <button
        v-for="p in totalPages"
        :key="p"
        :class="['page-btn', p === currentPage ? 'active' : '']"
        @click="changePage(p)"
      >
        {{ p }}
      </button>
      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        ›
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getContracts } from '@/features/contract/api/contractApi.js'
import { useAuthStore } from '@/features/auth/model/authStore.js'
import { useNotificationStore } from '@/features/notification/model/useNotificationStore.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isCompanyView = computed(() => authStore.role === 'COMPANY')

// 탭: status=''(전체) | NEGOTIATING(협의중 묶음, A/B/C 클라이언트 필터링) | IN_PROGRESS | COMPLETED_PENDING | COMPLETED | CANCELLED
const statusTabs = [
  { value: '', label: '전체' },

  { value: 'WAITING', label: '논의중' },
  { value: 'NEGOTIATING', label: '계약 협의중' },
  { value: 'IN_PROGRESS', label: '진행중' },
  { value: 'COMPLETED_PENDING', label: '완료대기' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELLED', label: '파기' },
  { value: 'PROPOSAL', label: '제안발송' },
]

const activeStatus = ref('')
const keywordType = ref('')
const keyword = ref('')
const contracts = ref([])
const isLoading = ref(false)
const currentPage = ref(route.query.page ? Number(route.query.page) : 1)
const totalPages = ref(1)
const pageSize = 5
const notificationStore = useNotificationStore()

const STATUS_LABELS = {
  PROPOSAL: '제안발송',
  WAITING: '논의중',
  NEGOTIATING_A: '계약 협의중',
  NEGOTIATING_B: '계약 협의중',
  NEGOTIATING_C: '계약 협의중',
  IN_PROGRESS: '진행중',
  COMPLETED_PENDING: '완료대기',
  COMPLETED: '완료',
  CANCELLED: '파기됨',
}

const STATUS_BADGE_CLASS = {
  WAITING: 'badge-waiting',
  NEGOTIATING_A: 'badge-negotiating',
  NEGOTIATING_B: 'badge-negotiating',
  NEGOTIATING_C: 'badge-negotiating',
  IN_PROGRESS: 'badge-inprogress',
  COMPLETED_PENDING: 'badge-pending',
  COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled',
}

watch(
  () => route.query.page,
  (newPage) => {
    if (newPage) {
      currentPage.value = Number(newPage)
      fetchList()
    }
  },
)

function statusLabel(status) {
  return STATUS_LABELS[status] || status
}

function statusBadgeClass(status) {
  return STATUS_BADGE_CLASS[status] || 'badge-completed'
}

function formatDate(dateStr) {
  if (!dateStr) return null
  return String(dateStr).slice(0, 10)
}

function formatMoney(amount) {
  if (amount === null || amount === undefined || amount === 0) return '미정'
  return Number(amount).toLocaleString() + '원'
}

function counterpartName(item) {
  const name = isCompanyView.value
    ? item.freelancerName || item.freelancer_name
    : item.companyName || item.company_name
  return name || '미정'
}

// contract_document가 LEFT JOIN이라 WAITING 등에서는 null일 수 있음
function contractPeriod(item) {
  const start = formatDate(item.contractStartDate || item.contract_start_date)
  const end = formatDate(item.contractEndDate || item.contract_end_date)
  if (!start && !end) return '미정'
  return `${start || '미정'} ~ ${end || '미정'}`
}

function totalWage(item) {
  return item.totalWage ?? item.total_wage ?? null
}

async function fetchList() {
  isLoading.value = true
  try {
    // NEGOTIATING_A/B/C 묶음은 백엔드가 단일 status enum만 받으므로
    // 협의중 탭일 때는 status 없이 전체를 가져와 클라이언트에서 필터링
    const isNegotiatingTab = activeStatus.value === 'NEGOTIATING'

    const res = await getContracts({
      status: isNegotiatingTab ? undefined : activeStatus.value || undefined,
      keywordType: keyword.value ? keywordType.value : undefined,
      keyword: keyword.value || undefined,
      page: currentPage.value,
      size: isNegotiatingTab ? 999 : pageSize, // 협의중 탭은 전체 받아서 필터링
    })
    const data = res.data.data
    let content = data.content || data.list || []

    if (isNegotiatingTab) {
      content = content.filter((item) =>
        ['NEGOTIATING_A', 'NEGOTIATING_B', 'NEGOTIATING_C'].includes(item.status),
      )
      // 클라이언트 페이지네이션 직접 처리
      totalPages.value = Math.max(1, Math.ceil(content.length / pageSize))
      const start = (currentPage.value - 1) * pageSize
      content = content.slice(start, start + pageSize)
    } else {
      totalPages.value = Math.max(1, data.totalPages || 1)
    }

    contracts.value = content
  } catch (err) {
    contracts.value = []
    totalPages.value = 1
  } finally {
    isLoading.value = false
  }
}

function changeTab(status) {
  activeStatus.value = status
  currentPage.value = 1
  fetchList()
}

function handleSearch() {
  currentPage.value = 1
  fetchList()
}

function changePage(p) {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
  router.replace({ query: { ...route.query, page: p } }) // ✅ URL 동기화
  fetchList()
}

function goDetail(item) {
  const contractId = item.contractId || item.contract_id
  if (!contractId) return

  router.push({
    name: isCompanyView.value ? 'CompanyContractDetail' : 'ContractDetail', // ✅ 수정
    params: { id: contractId },
    query: { page: currentPage.value },
  })
}

onMounted(fetchList)
</script>

<style scoped>
.page {
  padding: 32px 32px 48px;
  max-width: 100%;
  box-sizing: border-box;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a233d;
  margin: 0 0 4px;
}

.page-sub {
  font-size: 14px;
  color: #6c757d;
  margin: 0 0 15px;
}

/* 탭 - overflow-x 제거, flex-wrap으로 줄바꿈 허용 */
.tab-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.tab-item {
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #9ca3af;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  white-space: nowrap;
}

.tab-item.active {
  color: #1a233d;
  border-bottom-color: #1a233d;
  font-weight: 600;
}

/* 검색바 */
.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.keyword-type-select {
  width: 150px;
  height: 40px;
  padding: 0 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  color: #1a233d;
  background: white;
  cursor: pointer;
  flex-shrink: 0;
}

.search-input-wrap {
  flex: 1;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #1a233d;
}

.btn-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  height: 40px;
  background: #1a233d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
}

/* 목록 */
.loading,
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #9ca3af;
  flex: 1;
}

.contract-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.contract-item {
  display: flex;
  align-items: center; /* flex-start → center */
  gap: 12px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  height: 140px;
}

.contract-item:hover {
  border-color: #7f89a1;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}
.status-badge {
  flex-shrink: 0;
  padding: 4px 11px; /* 3px 9px → 4px 11px */
  border-radius: 999px;
  font-size: 11.5px; /* 10.5px → 11.5px */
  font-weight: 600;
  white-space: nowrap;
  margin-top: 10px;
  align-self: flex-start;
}

.badge-waiting {
  background: #fef9c3;
  color: #92400e;
}
.badge-negotiating {
  background: #dbeafe;
  color: #1d4ed8;
}
.badge-inprogress {
  background: #dcfce7;
  color: #15803d;
}
.badge-pending {
  background: #ede9fe;
  color: #6d28d9;
}
.badge-completed {
  background: #f3f4f6;
  color: #374151;
}
.badge-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.contract-badge {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  flex-shrink: 0;
  margin-top: 0; /* 4px → 0 */
  align-self: flex-start; /* 알림 배지는 상단 */
  margin-top: 10px;
}

.contract-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px; /* 1px → 4px */
}

.contract-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a233d;
  margin: 0 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.contract-meta-line {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12.5px;
  color: #9ca3af;
  margin: 0;
  line-height: 1.4;
}

.contract-meta-line strong {
  color: #4b5563;
  font-weight: 600;
}

.chevron {
  color: #d1d5db;
  flex-shrink: 0;
  margin-top: 0; /* 4px → 0 */
}

.contract-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: auto;
  padding-top: 16px;
  flex-shrink: 0;
}

.page-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: 6px;
  font-size: 13px;
  color: #6c757d;
  cursor: pointer;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
}
.page-btn.active {
  background: #1a233d;
  color: white;
  font-weight: 600;
}
.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
