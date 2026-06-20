<template>
  <div class="page">
    <div class="top-actions">
      <button type="button" class="back-button" @click="goToList">
        <span aria-hidden="true">←</span> 목록으로 돌아가기
      </button>
      <!--
      <div v-if="portfolio" class="management-actions">
        <button type="button" class="edit-button" @click="goToEdit">수정</button>
        <button type="button" class="delete-button" :disabled="isDeleting" @click="handleDelete">
          {{ isDeleting ? '삭제 중...' : '삭제' }}
        </button>
      </div>
      -->

      <!-- 회사도 이 페이지 보는 경우가 있어서 수정&삭제 버튼 보이는 분기 점 추가 -->
      <div v-if="portfolio && !isCompanyView" class="management-actions">
        <button type="button" class="edit-button" @click="goToEdit">수정</button>
        <button type="button" class="delete-button" :disabled="isDeleting" @click="handleDelete">
          {{ isDeleting ? '삭제 중...' : '삭제' }}
        </button>
      </div>

    </div>

    <div v-if="isLoading" class="state-card">
      <span class="spinner" aria-hidden="true"></span>
      <p>프로젝트를 불러오고 있습니다.</p>
    </div>

    <div v-else-if="errorMessage" class="state-card error-state">
      <p>{{ errorMessage }}</p>
      <button type="button" class="retry-button" @click="loadPortfolio">다시 시도</button>
    </div>

    <article v-else-if="portfolio" class="detail-card">
      <div class="detail-heading">
        <div class="badge-row">
          <span class="category-badge">{{ categoryLabel }}</span>
          <span :class="['visibility-badge', visibility.className]">{{ visibility.label }}</span>
        </div>
        <h1>{{ title }}</h1>
        <p class="summary">{{ summary }}</p>
      </div>

      <div class="information-grid">
        <div class="information-item">
          <span>진행 기간</span>
          <strong>{{ period }}</strong>
        </div>
        <div class="information-item">
          <span>카테고리</span>
          <strong>{{ categoryLabel }}</strong>
        </div>
      </div>

      <section class="detail-section">
        <h2>프로젝트 설명</h2>
        <p class="content">{{ content }}</p>
      </section>

      <section v-if="files.length" class="detail-section">
        <h2>첨부파일</h2>
        <p class="files-note">{{ files.length }}개의 첨부파일이 등록되어 있습니다.</p>
      </section>
    </article>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { deletePortfolio, getPortfolioDetail } from '@/features/portfolio/api/portfolioApi.js'

const route = useRoute()
const router = useRouter()

const portfolio = ref(null)
const files = ref([])
const isLoading = ref(true)
const isDeleting = ref(false)
const errorMessage = ref('')

const CATEGORY_LABELS = {
  WEB_APP: '웹/앱',
  DESIGN: '디자인',
  BRANDING: '브랜딩',
  MARKETING: '마케팅',
  PLANNING: '기획'
}

const title = computed(() => portfolio.value?.title || '제목 없는 프로젝트')
const summary = computed(() => portfolio.value?.summary || '프로젝트 요약이 없습니다.')
const content = computed(() => portfolio.value?.content || '등록된 프로젝트 설명이 없습니다.')
const categoryLabel = computed(() => {
  const category = portfolio.value?.category
  return CATEGORY_LABELS[category] || category || '미분류'
})

const visibility = computed(() => {
  const value = portfolio.value?.isPublic
  return value
    ? { label: '공개', className: 'visibility-public' }
    : { label: '비공개', className: 'visibility-private' }
})

const period = computed(() => {
  const startDate = portfolio.value?.workStartAt
  const endDate = portfolio.value?.workEndAt
  if (!startDate && !endDate) return '기간 미정'
  return `${formatDate(startDate) || '시작일 미정'} - ${formatDate(endDate) || '진행 중'}`
})

onMounted(loadPortfolio)

async function loadPortfolio() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getPortfolioDetail(route.params.id)
    if (!data.portfolio) throw new Error('Invalid portfolio response')
    portfolio.value = data.portfolio
    files.value = data.files
  } catch (error) {
    files.value = []
    errorMessage.value = getRequestError(error, '프로젝트를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    isLoading.value = false
  }
}

function formatDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10).replaceAll('-', '.')
}

// function goToList() {
//   router.push({ name: 'PortfolioList' })
// }

// 이 포트폴리오 디테일 페이지를 사용하는 경우 3
// 1. 프리랜서 본인이 포트폴리오 페이지에서 보는경우
// 1.5. 프리랜서페이지에서 더 필요하다면 분기점 더 쪼개서 추가해주세요!! 
// 2. 회사 → 지원자 포트폴리오
// 3. 회사 → 인재찾기 공개 포폴
// 회사 권한으로 들어온 페이지인지 (route name 기준)
const isCompanyView = computed(() => route.name === 'TalentPortfolioDetail')
function goToList() {
  const from = route.query.from

  if (from === 'applicant') {
    // 2번 경우 : 지원자 목록의 특정 지원 상세로 복귀
    router.push({
      name: 'CompanyApplicantDetail',
      params: {
        recruitmentId: route.query.recruitmentId,
        applicationId: route.query.applicationId
      }
    })
  } else if (from === 'talent') {
    // 3번 경우 : 인재찾기 상세로 복귀
    router.push({
      name: 'TalentDetail',
      params: { id: route.query.freelancerEmail }
    })
  } else {
    // 1번경우 : 프리랜서 본인 - 기본 목록
    router.push({ name: 'PortfolioList' })
  }
}



function goToEdit() {
  router.push({ name: 'PortfolioEditor', params: { id: route.params.id } })
}

async function handleDelete() {
  if (!confirm(`'${title.value}'을(를) 삭제하시겠습니까?`)) return

  isDeleting.value = true
  try {
    await deletePortfolio(route.params.id)
    router.push({ name: 'PortfolioList' })
  } catch (error) {
    alert(getRequestError(error, '프로젝트를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.'))
  } finally {
    isDeleting.value = false
  }
}

function getRequestError(error, fallback) {
  const message = error?.response?.data?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}
</script>

<style scoped>
.page {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 32px;
}

.top-actions {
  margin-bottom: 18px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.back-button,
.management-actions button,
.retry-button {
  height: 38px;
  padding: 0 14px;
  border-radius: 6px;
  background: #ffffff;
  font-size: 13px;
  cursor: pointer;
}

.back-button,
.edit-button,
.retry-button {
  border: 1px solid #d1d5db;
  color: #374151;
}

.management-actions {
  display: flex;
  gap: 8px;
}

.delete-button {
  border: 1px solid #fecaca;
  color: #dc2626;
}

.management-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.detail-card,
.state-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
}

.detail-card {
  overflow: hidden;
}

.detail-heading,
.information-grid,
.detail-section {
  margin-right: 32px;
  margin-left: 32px;
}

.detail-heading {
  padding: 32px 0 28px;
  border-bottom: 1px solid #e5e7eb;
}

.badge-row {
  display: flex;
  gap: 8px;
}

.category-badge,
.visibility-badge {
  min-height: 27px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
}

.category-badge {
  background: #e8edf5;
  color: #1a233d;
}

.visibility-public {
  background: #dcfce7;
  color: #15803d;
}

.visibility-private {
  background: #f3f4f6;
  color: #6b7280;
}

.detail-heading h1 {
  margin: 18px 0 8px;
  color: #1a233d;
  font-size: 28px;
}

.summary {
  margin: 0;
  color: #6b7280;
  font-size: 15px;
  line-height: 1.6;
}

.information-grid {
  padding: 26px 0;
  border-bottom: 1px solid #e5e7eb;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.information-item {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.information-item span {
  color: #9ca3af;
  font-size: 12px;
}

.information-item strong {
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  white-space: pre-wrap;
}

.detail-section {
  padding: 26px 0;
  border-bottom: 1px solid #e5e7eb;
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section h2 {
  margin: 0 0 14px;
  color: #1a233d;
  font-size: 16px;
}

.content,
.files-note {
  margin: 0;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.8;
}

.content {
  white-space: pre-wrap;
}

.state-card {
  min-height: 320px;
  padding: 32px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.state-card p {
  margin: 14px 0 0;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #dce2eb;
  border-top-color: #1a233d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.error-state {
  color: #b91c1c;
}

.retry-button {
  margin-top: 18px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .page {
    padding: 24px 18px;
  }

  .top-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .management-actions {
    justify-content: flex-end;
  }

  .detail-heading,
  .information-grid,
  .detail-section {
    margin-right: 20px;
    margin-left: 20px;
  }

  .information-grid {
    grid-template-columns: 1fr;
  }
}
</style>
