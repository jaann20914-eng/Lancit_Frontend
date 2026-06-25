<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">제안 관리</h1>
        <p class="page-description page-sub">제안 온 프로젝트를 확인하고 수락/거절하세요</p>
      </div>
    </header>

    <!-- 검색 + 정렬 -->
    <BaseFilterBar aria-label="제안 검색 및 정렬">
      <BaseSelect v-model="keywordType" width="110px" aria-label="검색 유형">
        <option value="">전체</option>
        <option value="title">제목</option>
        <option value="companyName">회사명</option>
      </BaseSelect>
      <BaseSelect v-model="sortType" aria-label="정렬 방식" @change="fetchList">
        <option value="latest">최신순</option>
        <option value="oldest">오래된순</option>
      </BaseSelect>
      <BaseSearchInput
        v-model="keyword"
        type="text"
        placeholder="검색어를 입력하세요"
        :with-icon="false"
        aria-label="제안 검색어"
        @search="handleSearch"
      />
      <BaseButton @click="handleSearch">
        <template #icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </template>
        검색
      </BaseButton>
    </BaseFilterBar>

    <!-- 목록 -->
    <div v-if="isLoading" class="loading">불러오는 중...</div>

    <div v-else-if="proposals.length === 0" class="empty-state">
      <div class="empty-icon-wrap">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#c0c6d4"
          stroke-width="1.5"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>
      <p class="empty-title">아직 받은 제안이 없습니다.</p>
      <p class="empty-sub">포트폴리오를 작성하면 더 많은 제안을 받을 수 있어요.</p>
      <button class="btn-go-empty" @click="router.push({ name: 'PortfolioList' })">
        포트폴리오 작성하러 가기
      </button>
    </div>

    <div v-else class="proposal-list">
      <div
        v-for="item in proposals"
        :key="item.contractId"
        class="proposal-card"
        role="link"
        tabindex="0"
        @click="goRecruitment(item)"
        @keydown.enter.prevent="goRecruitment(item)"
        @keydown.space.prevent="goRecruitment(item)"
      >
        <!-- 상단: 회사 정보 + 배지 -->
        <div class="card-top">
          <div class="company-row">
            <div class="company-avatar">
              {{ (item.companyName || item.companyEmail)?.charAt(0)?.toUpperCase() }}
            </div>
            <div class="company-text">
              <p class="company-name">{{ item.companyName || item.companyEmail }}</p>
              <p class="company-email">{{ item.companyEmail }}</p>
            </div>
          </div>
          <div class="badge-row">
            <span v-if="!item.businessNumberVerified" class="badge-unverified">미인증</span>
            <span class="badge-proposal">제안</span>
            <span class="badge-category">{{ jobCategoryLabel(item.jobCategory) }}</span>
          </div>
        </div>

        <!-- 공고 제목 + 요약 -->
        <div class="card-title-block">
          <h3 class="card-title">{{ item.recruitmentTitle }}</h3>
          <p v-if="item.summary" class="card-summary">{{ item.summary }}</p>
        </div>

        <!-- 정보 그리드 -->
        <div class="card-info-grid">
          <div class="info-cell">
            <span class="info-label">예산</span>
            <strong class="info-value">{{ formatMoney(item.budget) }}</strong>
          </div>
          <div class="info-cell">
            <span class="info-label">예상 기간</span>
            <strong class="info-value">{{
              item.durationMonths ? item.durationMonths + '개월' : '협의'
            }}</strong>
          </div>
          <div class="info-cell">
            <span class="info-label">시작일</span>
            <strong class="info-value">{{
              item.contractStartAt ? formatDate(item.contractStartAt) : '협의'
            }}</strong>
          </div>
          <div class="info-cell">
            <span class="info-label">수신일</span>
            <strong class="info-value">{{ formatDate(item.createdAt) }}</strong>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <div class="card-actions" @click.stop @keydown.stop>
          <BaseButton
            size="lg"
            block
            :disabled="processingId === item.contractId"
            @click.stop="handleAccept(item)"
          >
            <template #icon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </template>
            수락하기
          </BaseButton>
          <BaseButton
            variant="danger"
            size="lg"
            block
            :disabled="processingId === item.contractId"
            @click.stop="handleReject(item)"
          >
            <template #icon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </template>
            거절하기
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <BasePagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-elements="totalElements"
      :page-size="pageSize"
      :disabled="isLoading"
      @change="changePage"
    />
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
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseFilterBar from '@/shared/ui/BaseFilterBar.vue'
import BasePagination from '@/shared/ui/BasePagination.vue'
import BaseSearchInput from '@/shared/ui/BaseSearchInput.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'

const router = useRouter()

const keywordType = ref('')
const keyword = ref('')
const sortType = ref('latest')
const proposals = ref([])
const isLoading = ref(false)
const processingId = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)
const totalElements = ref(0)
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
    totalPages.value = Math.max(1, Number(data.totalPages) || 1)
    totalElements.value = Number(data.totalElements ?? data.totalCount ?? proposals.value.length)
  } catch (err) {
    proposals.value = []
    totalPages.value = 1
    totalElements.value = 0
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
  // 미인증 사업자면 경고 포함 confirm, 인증됐으면 일반 confirm
  const message = !item.businessNumberVerified
    ? `'${item.companyName || item.companyEmail}' 회사는 인증되지 않은 사업자입니다.\n그래도 '${item.recruitmentTitle}' 제안을 수락하시겠습니까?`
    : `'${item.recruitmentTitle}' 제안을 수락하시겠습니까?`

  if (!confirm(message)) return

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
  padding: var(--lancit-page-padding);
  max-width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: var(--lancit-page-header-margin);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a233d;
  margin: 0 0 4px;
  line-height: 1.3;
}

.page-sub {
  font-size: 14px;
  color: var(--lancit-page-description-color);
  margin: 0;
  line-height: 1.5;
}

/* 로딩 */
.loading {
  text-align: center;
  padding: 60px 0;
  color: #9ca3af;
  flex: 1;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  flex: 1;
  text-align: center;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
}

.empty-icon-wrap {
  width: 80px;
  height: 80px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a233d;
  margin: 0 0 8px;
}

.empty-sub {
  font-size: 13.5px;
  color: #9ca3af;
  margin: 0 0 24px;
}

.btn-go-empty {
  padding: 12px 28px;
  background: #1a233d;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-go-empty:hover {
  opacity: 0.85;
}

/* 목록 */
.proposal-list {
  display: flex;
  flex-direction: column;
  gap: var(--lancit-list-gap);
  flex: 1;
}

/* 카드 */
.proposal-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    transform 0.15s;
}

.proposal-card:hover,
.proposal-card:focus-visible {
  border-color: #7f89a1;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
  outline: none;
}

/* 상단: 회사 + 배지 */
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.company-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.company-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #e8edf5;
  color: #1a233d;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.company-text {
  min-width: 0;
}

.company-name {
  font-size: 13.5px;
  font-weight: 700;
  color: #1a233d;
  margin: 0 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.company-email {
  font-size: 11px;
  color: #9ca3af;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.badge-proposal {
  font-size: 10.5px;
  font-weight: 700;
  color: #92400e;
  background: #fef3c7;
  padding: 3px 9px;
  border-radius: 5px;
}

.badge-category {
  font-size: 11px;
  font-weight: 600;
  color: #1d4ed8;
  background: #dbeafe;
  padding: 3px 9px;
  border-radius: 999px;
}

/* 제목 블록 */
.card-title-block {
  padding-left: 14px;
  border-left: 3px solid #1a233d;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a233d;
  margin: 0 0 5px;
  line-height: 1.4;
}

.card-summary {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 정보 그리드 */
.card-info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  background: #f9fafb;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.info-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border-right: 1px solid #f0f0f0;
}

.info-cell:last-child {
  border-right: none;
}

.info-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
}

.info-value {
  font-size: 13.5px;
  color: #1a233d;
  font-weight: 700;
}

/* 액션 */
.card-actions {
  display: flex;
  gap: 8px;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 24px;
  padding-bottom: 16px;
}

@media (max-width: 800px) {
  .page {
    padding: var(--lancit-page-mobile-padding);
  }

  .card-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-cell:nth-child(2) {
    border-right: none;
  }

  .info-cell:nth-child(1),
  .info-cell:nth-child(2) {
    border-bottom: 1px solid #f0f0f0;
  }
}

.badge-unverified {
  font-size: 10.5px;
  font-weight: 700;
  color: #991b1b;
  background: #fee2e2;
  padding: 3px 9px;
  border-radius: 5px;
}
</style>
