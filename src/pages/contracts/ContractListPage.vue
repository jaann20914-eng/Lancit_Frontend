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
        <option value="title">계약서(공고) 이름</option>
        <option value="company">회사 이메일</option>
        <option value="freelancer">프리랜서 이메일</option>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
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
        @click="goDetail(item.contractId || item.contract_id)"
      >
        <span :class="['status-badge', statusBadgeClass(item.status)]">
          {{ statusLabel(item.status) }}
        </span>

        <div class="contract-info">
          <p class="contract-title">{{ item.recruitmentTitle || item.recruitment_title || '계약서' }}</p>
          <p class="contract-meta">
            <span v-if="isCompanyView">프리랜서: {{ item.freelancerEmail || item.freelancer_email }}</span>
            <span v-else>회사: {{ item.companyEmail || item.company_email }}</span>
          </p>
        </div>

        <svg class="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <div class="pagination" v-if="totalPages > 1">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">‹</button>
      <button
        v-for="p in totalPages"
        :key="p"
        :class="['page-btn', p === currentPage ? 'active' : '']"
        @click="changePage(p)"
      >
        {{ p }}
      </button>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">›</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getContracts } from '@/features/contract/api/contractApi.js'
import { useAuthStore } from '@/features/auth/model/authStore.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isCompanyView = computed(() => authStore.role === 'company')

// 탭: status=null(전체) | NEGOTIATING(협의중 묶음) | IN_PROGRESS | COMPLETED | CANCELLED
const statusTabs = [
  { value: '', label: '전체' },
  { value: 'NEGOTIATING', label: '협의중' },
  { value: 'IN_PROGRESS', label: '진행중' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELLED', label: '파기' },
]

const activeStatus = ref('')
const keywordType = ref('')
const keyword = ref('')
const contracts = ref([])
const isLoading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 5

const STATUS_LABELS = {
  WAITING: '제안중',
  NEGOTIATING_A: '협의중',
  NEGOTIATING_B: '협의중',
  NEGOTIATING_C: '협의중',
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

function statusLabel(status) {
  return STATUS_LABELS[status] || status
}

function statusBadgeClass(status) {
  return STATUS_BADGE_CLASS[status] || 'badge-completed'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().slice(0, 10)
}

function formatMoney(amount) {
  if (!amount) return ''
  return Number(amount).toLocaleString() + '원'
}

async function fetchList() {
  isLoading.value = true
  try {
    // NEGOTIATING_A/B/C 묶음은 백엔드가 단일 status enum만 받으므로
    // 협의중 탭일 때는 status 없이 전체를 가져와 클라이언트에서 필터링
    const isNegotiatingTab = activeStatus.value === 'NEGOTIATING'

    const res = await getContracts({
      status: isNegotiatingTab ? undefined : (activeStatus.value || undefined),
      keywordType: keyword.value ? keywordType.value : undefined,
      keyword: keyword.value || undefined,
      page: currentPage.value,
      size: isNegotiatingTab ? 999 : pageSize  // 협의중 탭은 전체 받아서 필터링
    })
    const data = res.data.data
    let content = data.content || data.list || []

    if (isNegotiatingTab) {
      content = content.filter(item =>
        ['NEGOTIATING_A', 'NEGOTIATING_B', 'NEGOTIATING_C'].includes(item.status)
      )
      // 클라이언트 페이지네이션 직접 처리
      totalPages.value = Math.max(1, Math.ceil(content.length / pageSize))
      const start = (currentPage.value - 1) * pageSize
      content = content.slice(start, start + pageSize)
    } else {
      totalPages.value = data.totalPages || 1
    }

    contracts.value = content
  } catch (err) {
    contracts.value = []
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
  fetchList()
}

function goDetail(contractId) {
  const name = isCompanyView.value ? 'CompanyContractDetail' : 'ContractDetail'
  router.push({ name, params: { id: contractId } })
}

onMounted(fetchList)
</script>

<style scoped>
.page {
  padding: 32px;
  max-width:100%;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1A233D;
  margin: 0 0 4px;
}

.page-sub {
  font-size: 14px;
  color: #6C757D;
  margin: 0 0 20px;
}

/* 탭 */
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #E5E7EB;
  margin-bottom: 16px;
  /* overflow-x: auto; */
}

.tab-item {
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #9CA3AF;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  white-space: nowrap;
}

.tab-item.active {
  color: #1A233D;
  border-bottom-color: #1A233D;
  font-weight: 600;
}

/* 검색바 */
.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.keyword-type-select {
  width: 130px;
  height: 40px;
  padding: 0 10px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 13px;
  color: #1A233D;
  background: white;
  cursor: pointer;
  flex-shrink: 0;
}

.search-input-wrap { flex: 1; }

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.search-input:focus { border-color: #1A233D; }

.btn-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  height: 40px;
  background: #1A233D;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
}

/* 목록 */
.loading, .empty-state {
  text-align: center;
  padding: 60px 0;
  color: #9CA3AF;
}

.contract-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.contract-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.contract-item:hover {
  border-color: #1A233D;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.status-badge {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.badge-waiting     { background: #FEF9C3; color: #92400E; }
.badge-negotiating { background: #DBEAFE; color: #1D4ED8; }
.badge-inprogress  { background: #DCFCE7; color: #15803D; }
.badge-pending     { background: #EDE9FE; color: #6D28D9; }
.badge-completed   { background: #F3F4F6; color: #374151; }
.badge-cancelled   { background: #FEE2E2; color: #991B1B; }

.contract-info { flex: 1; min-width: 0; }

.contract-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A233D;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contract-meta {
  font-size: 12px;
  color: #9CA3AF;
  margin: 0;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #EF4444;
  flex-shrink: 0;
}

.chevron {
  color: #D1D5DB;
  flex-shrink: 0;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 24px;
}

.page-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: 6px;
  font-size: 13px;
  color: #6C757D;
  cursor: pointer;
}

.page-btn:hover:not(:disabled) { background: #F3F4F6; }
.page-btn.active { background: #1A233D; color: white; font-weight: 600; }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
</style>