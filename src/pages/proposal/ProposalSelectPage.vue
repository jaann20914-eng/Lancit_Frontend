<template>
  <div class="page">
    <RouterLink :to="`/company/talents/${freelancerEmail}`" class="back-link">‹ 뒤로</RouterLink>

    <div class="page-header">
      <div>
        <h1 class="page-title">제안할 공고 선택</h1>
        <p class="page-sub">프리랜서에게 제안할 공고문을 선택하세요</p>
      </div>
      <button class="btn-propose" :disabled="!selectedId" @click="handlePropose">
        제안하기
      </button>
    </div>

    <div v-if="isLoading" class="loading">불러오는 중...</div>
    <div v-else-if="recruitments.length === 0" class="empty-state">
      <p>등록한 공고가 없습니다</p>
    </div>

    <div v-else class="recruitment-list">
      <div
        v-for="item in recruitments"
        :key="item.recruitmentId"
        :class="['recruitment-item', selectedId === item.recruitmentId ? 'selected' : '']"
        @click="selectedId = item.recruitmentId"
      >
        <div class="item-body">
          <p class="item-title">{{ item.title }}</p>
          <p class="item-meta">
            {{ jobCategoryLabel(item.jobCategory) }} ·
            {{ item.workType || '자유 시작일' }} ·
            예산 {{ formatMoney(item.budget) }} ·
            작성일: {{ formatDate(item.createdAt) }}
          </p>
        </div>
        <div class="item-radio">
          <div class="radio-circle" :class="{ checked: selectedId === item.recruitmentId }">
            <svg v-if="selectedId === item.recruitmentId" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMyActiveRecruitments } from '@/features/recruitment/api/recruitmentApi.js'
import { createContract } from '@/features/contract/api/contractApi.js'

const route = useRoute()
const router = useRouter()

const freelancerEmail = route.query.freelancerEmail

const recruitments = ref([])
const selectedId = ref(null)
const isLoading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 5

const jobCategoryMap = {
  IT: 'IT', DESIGN: '디자인', MARKETING: '마케팅', VIDEO: '영상',
  MUSIC: '음악', EDUCATION: '교육', WRITING: '작문', ETC: '기타'
}

function jobCategoryLabel(code) {
  return jobCategoryMap[code] || code || ''
}

function formatMoney(amount) {
  if (!amount) return '0원'
  return Number(amount).toLocaleString() + '원'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().slice(0, 10)
}

async function fetchRecruitments() {
  isLoading.value = true
  try {
    // 활성화된(OPEN) 내 공고만 조회
    const res = await getMyActiveRecruitments({
      page: currentPage.value,
      size: pageSize
    })
    const data = res.data.data
    recruitments.value = data.content || data.list || []
    totalPages.value = data.totalPages || 1
  } catch (err) {
    recruitments.value = []
  } finally {
    isLoading.value = false
  }
}

function changePage(p) {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
  fetchRecruitments()
}

async function handlePropose() {
  if (!selectedId.value) return

  try {
    await createContract({
      recruitmentId: selectedId.value,
      freelancerEmail: freelancerEmail
    })
    alert('제안이 발송되었습니다.')
    router.push('/company/contracts')
  } catch (err) {
    alert(err.response?.data?.message || '제안 발송에 실패했습니다.')
  }
}

onMounted(fetchRecruitments)
</script>

<style scoped>
.page {
  padding: 32px;
  max-width: 100%;
}

.back-link {
  display: inline-block;
  font-size: 13px;
  color: #6C757D;
  text-decoration: none;
  margin-bottom: 12px;
}

.back-link:hover { color: #1A233D; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #1A233D;
  margin: 0 0 4px;
}

.page-sub {
  font-size: 13px;
  color: #6C757D;
  margin: 0;
}

.btn-propose {
  padding: 10px 20px;
  background: #1A233D;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-propose:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.loading, .empty-state {
  text-align: center;
  padding: 60px 0;
  color: #9CA3AF;
}

.recruitment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recruitment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.recruitment-item:hover { border-color: #1A233D; }
.recruitment-item.selected { border-color: #1A233D; background: #F9FAFB; }

.item-title {
  font-size: 15px;
  font-weight: 600;
  color: #1A233D;
  margin: 0 0 4px;
}

.item-meta {
  font-size: 12px;
  color: #9CA3AF;
  margin: 0;
}

.radio-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #D1D5DB;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.radio-circle.checked {
  background: #1A233D;
  border-color: #1A233D;
}

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