<template>
  <DashboardOverview
    :summary-items="dashboard.summaryItems"
    :panels="dashboard.panels"
    :is-loading="isLoading"
    :error-message="errorMessage"
    @retry="loadDashboard"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import {
  getDashboardErrorMessage,
  getFreelancerDashboard,
} from '@/features/dashboard/api/dashboardApi.js'
import { mapFreelancerDashboardToView } from '@/features/dashboard/api/dashboardMapper.js'
import DashboardOverview from '@/features/dashboard/ui/DashboardOverview.vue'

const dashboard = ref(mapFreelancerDashboardToView())
const isLoading = ref(true)
const errorMessage = ref('')

async function loadDashboard() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getFreelancerDashboard()
    dashboard.value = mapFreelancerDashboardToView(data)
  } catch (error) {
    errorMessage.value = getDashboardErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadDashboard)
</script>
