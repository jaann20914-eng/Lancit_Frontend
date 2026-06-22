<template>
  <DashboardOverview
    :summary-items="summaryItems"
    :panels="panels"
    :is-loading="isLoading"
    :error-message="errorMessage"
    @retry="loadDashboard"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getFreelancerDashboard } from '@/features/dashboard/api/dashboardApi.js'
import DashboardOverview from '@/features/dashboard/ui/DashboardOverview.vue'

const summaryItems = ref([])
const panels = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

async function loadDashboard() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const dashboard = await getFreelancerDashboard()
    summaryItems.value = dashboard.summaryItems
    panels.value = dashboard.panels
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || '대시보드를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadDashboard)
</script>
