<template>
  <div class="page">
    <header class="page-header">
      <h1>{{ isEdit ? '프로젝트 수정' : '프로젝트 등록' }}</h1>
      <p>{{ isEdit ? '등록한 프로젝트 정보를 수정할 수 있습니다.' : '진행한 프로젝트와 나의 역할을 소개해보세요.' }}</p>
    </header>

    <div v-if="isLoading" class="state-card">
      <span class="spinner" aria-hidden="true"></span>
      <p>프로젝트 정보를 불러오고 있습니다.</p>
    </div>

    <div v-else-if="loadError" class="state-card error-state">
      <p>{{ loadError }}</p>
      <button type="button" class="retry-button" @click="loadInitialValue">다시 시도</button>
    </div>

    <PortfolioForm
      v-else
      :initial-value="initialValue"
      :is-edit="isEdit"
      :is-submitting="isSubmitting"
      :error-message="submitError"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createPortfolio,
  getPortfolioDetail,
  updatePortfolio
} from '@/features/portfolio/api/portfolioApi.js'
import PortfolioForm from '@/features/portfolio/ui/PortfolioForm.vue'

const route = useRoute()
const router = useRouter()

const initialValue = ref({})
const isLoading = ref(false)
const isSubmitting = ref(false)
const loadError = ref('')
const submitError = ref('')

const isEdit = computed(() => route.params.id !== undefined)

watch(() => route.params.id, loadInitialValue, { immediate: true })

async function loadInitialValue() {
  loadError.value = ''
  submitError.value = ''

  if (!isEdit.value) {
    initialValue.value = {}
    isLoading.value = false
    return
  }

  isLoading.value = true
  try {
    const data = await getPortfolioDetail(route.params.id)
    if (!data.portfolio) throw new Error('Invalid portfolio response')
    initialValue.value = data.portfolio
  } catch (error) {
    loadError.value = getRequestError(error, '프로젝트 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit(payload) {
  isSubmitting.value = true
  submitError.value = ''

  try {
    if (isEdit.value) {
      await updatePortfolio(route.params.id, payload)
      router.push({ name: 'PortfolioDetail', params: { id: route.params.id } })
      return
    }

    await createPortfolio(payload)
    router.push({ name: 'PortfolioList' })
  } catch (error) {
    submitError.value = getRequestError(error, '프로젝트를 저장하지 못했습니다. 입력 내용을 확인하고 다시 시도해주세요.')
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  if (isEdit.value) {
    router.push({ name: 'PortfolioDetail', params: { id: route.params.id } })
  } else {
    router.push({ name: 'PortfolioList' })
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
  max-width: 800px;
  margin: 0 auto;
  padding: 32px;
}

.page-header {
  margin-bottom: 24px;
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

.state-card {
  min-height: 300px;
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

@media (max-width: 600px) {
  .page {
    padding: 24px 18px;
  }
}
</style>
