<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>포트폴리오</h1>
        <p>내가 진행한 프로젝트를 등록하고 관리할 수 있습니다.</p>
      </div>
      <button type="button" class="primary-button" @click="goToCreate">
        <span aria-hidden="true">＋</span>
        프로젝트 등록
      </button>
    </header>

    <div v-if="isLoading" class="state-card">
      <span class="spinner" aria-hidden="true"></span>
      <p>포트폴리오를 불러오고 있습니다.</p>
    </div>

    <div v-else-if="errorMessage" class="state-card error-state">
      <p>{{ errorMessage }}</p>
      <button type="button" class="retry-button" @click="loadPortfolios">다시 시도</button>
    </div>

    <PortfolioEmptyState
      v-else-if="!portfolios.length"
      title="아직 등록된 프로젝트가 없습니다."
      description="경험과 역량을 보여줄 첫 프로젝트를 등록해보세요."
      button-text="첫 프로젝트 등록하기"
      @action="goToCreate"
    />

    <div v-else class="portfolio-grid">
      <PortfolioCard
        v-for="(portfolio, index) in portfolios"
        :key="getPortfolioId(portfolio) ?? index"
        :portfolio="portfolio"
        :is-deleting="String(deletingId) === String(getPortfolioId(portfolio))"
        @view="goToDetail"
        @edit="goToEdit"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { deletePortfolio, getMyPortfolios } from '@/features/portfolio/api/portfolioApi.js'
import PortfolioCard from '@/features/portfolio/ui/PortfolioCard.vue'
import PortfolioEmptyState from '@/features/portfolio/ui/PortfolioEmptyState.vue'

const router = useRouter()

const portfolios = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const deletingId = ref(null)

onMounted(loadPortfolios)

async function loadPortfolios() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getMyPortfolios({ page: 1, size: 10 })
    portfolios.value = extractPortfolioList(data)
  } catch (error) {
    errorMessage.value = getRequestError(error, '포트폴리오를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    isLoading.value = false
  }
}

function extractPortfolioList(data) {
  return Array.isArray(data?.content) ? data.content : []
}

function getPortfolioId(portfolio) {
  return portfolio?.portfolioId
}

function goToCreate() {
  router.push({ name: 'PortfolioCreate' })
}

function goToDetail(portfolio) {
  const id = getPortfolioId(portfolio)
  if (id === undefined || id === null) {
    alert('선택한 프로젝트 정보를 확인할 수 없습니다.')
    return
  }
  router.push({ name: 'PortfolioDetail', params: { id } })
}

function goToEdit(portfolio) {
  const id = getPortfolioId(portfolio)
  if (id === undefined || id === null) {
    alert('선택한 프로젝트를 수정할 수 없습니다.')
    return
  }
  router.push({ name: 'PortfolioEditor', params: { id } })
}

async function handleDelete(portfolio) {
  const id = getPortfolioId(portfolio)
  if (id === undefined || id === null) {
    alert('선택한 프로젝트를 삭제할 수 없습니다.')
    return
  }

  const title = portfolio.title || '이 프로젝트'
  if (!confirm(`'${title}'을(를) 삭제하시겠습니까?`)) return

  deletingId.value = id
  try {
    await deletePortfolio(id)
    await loadPortfolios()
  } catch (error) {
    alert(getRequestError(error, '프로젝트를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.'))
  } finally {
    deletingId.value = null
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
}

.page-header {
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.page-header h1 {
  margin: 0 0 6px;
  color: #1a233d;
  font-size: 24px;
  font-weight: 700;
}

.page-header p {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
}

.primary-button {
  height: 42px;
  padding: 0 17px;
  border: none;
  border-radius: 6px;
  background: #1a233d;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.primary-button:hover {
  background: #253a63;
}

.portfolio-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.state-card {
  min-height: 280px;
  padding: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.state-card p {
  margin: 14px 0 0;
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

.error-state {
  color: #b91c1c;
}

.retry-button {
  margin-top: 18px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  cursor: pointer;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 820px) {
  .portfolio-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .page {
    padding: 24px 18px;
  }

  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .primary-button {
    align-self: flex-start;
  }
}
</style>
