<template>
  <div class="page">
    <h1 class="page-title">제안 관리</h1>
    <p class="page-sub">제안 온 프로젝트를 확인하고 수락/거절하세요</p>

    <!-- 검색 + 정렬 -->
    <div class="search-bar">
      <select v-model="keywordType" class="keyword-type-select">
        <option value="">전체</option>
        <option value="title">제목</option>
        <option value="companyName">회사명</option>
      </select>
      <select v-model="sortType" class="sort-select" @change="fetchList">
        <option value="latest">최신순</option>
        <option value="oldest">오래된순</option>
      </select>
      <div class="search-input-wrap">
        <input
          v-model="keyword"
          type="text"
          class="search-input"
          placeholder="검색어를 입력하세요"
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

    <div v-else-if="proposals.length === 0" class="empty-state">
      <p>받은 제안이 없습니다</p>
    </div>

    <div v-else class="proposal-list">
      <div
        v-for="item in proposals"
        :key="item.contractId"
        class="proposal-card"
        @click="goRecruitment(item)"
      >
        <!-- 안읽음 표시 -->
        <!-- <span v-if="!item.isRead" class="unread-dot"></span> -->

        <!-- 제목 + 태그 -->
        <div class="card-head">
          <h3 class="card-title">{{ item.recruitmentTitle }}</h3>
          <span class="tag-category">{{ jobCategoryLabel(item.jobCategory) }}</span>
        </div>

        <!-- 회사명 -->
        <p class="card-company">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
          </svg>
          {{ item.companyName || item.companyEmail }}
          <span class="proposal-badge">제안</span>
        </p>

        <!-- 서머리 -->
        <div class="tag-row" v-if="item.summary">
          <!-- <span v-for="tech in item.techStacks" :key="tech" class="tech-tag">{{ tech }}</span> -->
          <span>{{ item.summary }}</span>
        </div>

        <!-- 예산/기간/수신일 -->
        <div class="card-info-row">
          <div class="info-item">
            <span class="info-label">예산</span>
            <strong>{{ formatMoney(item.budget) }}</strong>
          </div>
          <div class="info-item">
            <span class="info-label">예상 기간</span>
            <strong>{{ item.durationMonths ? item.durationMonths + '개월' : '협의' }}</strong>
          </div>
          <div class="info-item">
            <span class="info-label">수신일</span>
            <strong>{{ formatDate(item.createdAt) }}</strong>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <div class="card-actions">
          <button
            class="btn-accept"
            :disabled="processingId === item.contractId"
            @click="handleAccept(item)"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            수락하기
          </button>
          <button
            class="btn-reject"
            :disabled="processingId === item.contractId"
            @click="handleReject(item)"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            거절하기
          </button>
        </div>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getProposals,
  acceptProposal,
  rejectContract,
} from '@/features/contract/api/contractApi.js'
import { jobCategoryLabel } from '@/shared/constants/jobCategory.js'

const router = useRouter()

const keywordType = ref('')
const keyword = ref('')
const sortType = ref('latest')
const proposals = ref([])
const isLoading = ref(false)
const processingId = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 5

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return String(dateStr).slice(0, 10)
}

function formatMoney(amount) {
  if (!amount) return '협의'
  return Number(amount).toLocaleString() + '원'
}

async function fetchList() {
  isLoading.value = true
  try {
    const res = await getProposals({
      keywordType: keyword.value ? keywordType.value : undefined,
      keyword: keyword.value || undefined,
      sort: sortType.value,
      page: currentPage.value,
      size: pageSize,
    })
    const data = res.data.data
    proposals.value = data.content || data.list || []
    totalPages.value = data.totalPages || 1
  } catch (err) {
    proposals.value = []
  } finally {
    isLoading.value = false
  }
}

function goRecruitment(item) {
  router.push({
    name: 'RecruitmentDetail',
    params: { id: item.recruitmentId },
    query: { from: 'proposal' },
  })
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

async function handleAccept(item) {
  if (!confirm(`'${item.recruitmentTitle}' 제안을 수락하시겠습니까?`)) return

  processingId.value = item.contractId
  try {
    await acceptProposal(item.contractId)
    proposals.value = proposals.value.filter((p) => p.contractId !== item.contractId)
    alert('제안을 수락했습니다. 계약 관리에서 확인하세요.')
    router.push({ name: 'ContractDetail', params: { id: item.contractId } })
  } catch (err) {
    alert(err.response?.data?.message || '수락 처리에 실패했습니다.')
  } finally {
    processingId.value = null
  }
}

// 거절하기: 파기 요청 절차 없이 즉시 완전 삭제
async function handleReject(item) {
  if (
    !confirm(
      `'${item.recruitmentTitle}' 제안을 거절하시겠습니까?\n거절 시 계약이 즉시 삭제되며 되돌릴 수 없습니다.`,
    )
  ) {
    return
  }

  processingId.value = item.contractId

  try {
    await rejectContract(item.contractId)

    alert('제안을 거절했습니다.')

    router.replace({
      name: 'ProposalList',
    })
  } catch (err) {
    alert(err.response?.data?.message || '거절 처리에 실패했습니다.')
  } finally {
    processingId.value = null
  }
}

onMounted(fetchList)
</script>

<style scoped>
.page {
  padding: 32px 32px 48px;
  max-width: 100%;
  /* min-height: calc(100vh - 15px); /* 헤더 높이만큼 빼기, 환경에 맞게 조정 */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
  margin: 0 0 25px;
}

/* 검색바 */
.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.keyword-type-select {
  width: 110px;
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

.sort-select {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  color: #1a233d;
  background: white;
  cursor: pointer;
  flex-shrink: 0;
}

/* 목록 */

.loading,
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #9ca3af;
}

.proposal-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.proposal-card {
  position: relative;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px 20px;
  transition: all 0.15s;
}
.proposal-card:hover {
  border-color: #1a233d;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

.unread-dot {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a233d;
  margin: 0;
}

.tag-category {
  font-size: 11px;
  font-weight: 600;
  color: #1d4ed8;
  background: #dbeafe;
  padding: 2px 8px;
  border-radius: 999px;
  flex-shrink: 0;
}

.card-company {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: #6c757d;
  margin: 0 0 10px;
}

.proposal-badge {
  font-size: 10px;
  font-weight: 700;
  color: #92400e;
  background: #fef3c7;
  padding: 2px 7px;
  border-radius: 4px;
  margin-left: 4px;
}

.tag-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.tech-tag {
  font-size: 11px;
  color: #1a233d;
  background: #f3f4f6;
  padding: 2px 9px;
  border-radius: 999px;
}

.card-info-row {
  display: flex;
  gap: 24px;
  padding: 12px 0;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 14px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 11px;
  color: #9ca3af;
}

.info-item strong {
  font-size: 13px;
  color: #1a233d;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn-accept {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 42px;
  background: #1a233d;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-accept:hover:not(:disabled) {
  background: #253a63;
}
.btn-accept:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-reject {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 42px;
  background: white;
  color: #ef4444;
  border: 1px solid #fee2e2;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-reject:hover:not(:disabled) {
  background: #fef2f2;
}
.btn-reject:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 페이지네이션 */

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

/* 목록 영역이 남은 공간을 채우도록 */
.proposal-list,
.loading,
.empty-state {
  flex: 1;
}

/* 페이지네이션: 항상 하단 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 24px;
  padding-bottom: 16px;
}
</style>
