<template>
  <div class="detail-page">
    <button
      class="btn-back"
      @click="router.push(isFreelancer ? '/freelancer/contracts' : '/company/contracts')"
    >
      목록으로
    </button>
    <div v-if="isLoading" class="loading-state">불러오는 중...</div>

    <div v-else-if="loadError" class="error-state">
      <p>{{ loadError }}</p>
      <button class="btn-retry" @click="fetchDetail">다시 시도</button>
    </div>

    <div v-else-if="detail" class="detail-layout">
      <!-- 좌측 패널: 상태별 분기 -->
      <div class="left-panel">
        <ContractWaitingPanel
          v-if="detail.status === 'WAITING'"
          :detail="detail"
          :is-company="isCompany"
          @refresh="fetchDetail"
        />

        <ContractNegotiatingPanel
          v-else-if="['NEGOTIATING_A', 'NEGOTIATING_B', 'NEGOTIATING_C'].includes(detail.status)"
          :detail="detail"
          :is-freelancer="isFreelancer"
          @refresh="fetchDetail"
        />

        <ContractInProgressPanel
          v-else-if="['IN_PROGRESS', 'COMPLETED_PENDING'].includes(detail.status)"
          :detail="detail"
          :is-freelancer="isFreelancer"
          @refresh="fetchDetail"
        />

        <ContractCompletedPanel v-else-if="detail.status === 'COMPLETED'" :detail="detail" />

        <ContractCancelledPanel v-else-if="detail.status === 'CANCELLED'" :detail="detail" />
      </div>

      <!-- 우측 패널: 채팅 -->
      <div class="right-panel">
        <ContractChatPanel
          :contract-id="contractId"
          :chat-room-id="detail.chatRoomId || detail.chat_room_id"
          :can-chat="detail.status !== 'CANCELLED'"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getContractDetail } from '@/features/contract/api/contractApi.js'
import { useAuthStore } from '@/features/auth/model/authStore.js'

import ContractWaitingPanel from '@/features/contract/ui/ContractWaitingPanel.vue'
import ContractNegotiatingPanel from '@/features/contract/ui/ContractNegotiatingPanel.vue'
import ContractInProgressPanel from '@/features/contract/ui/ContractInProgressPanel.vue'
import ContractCompletedPanel from '@/features/contract/ui/ContractCompletedPanel.vue'
import ContractCancelledPanel from '@/features/contract/ui/ContractCancelledPanel.vue'
import ContractChatPanel from '@/features/chat/ui/ContractChatPanel.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const contractId = route.params.id
const isFreelancer = computed(() => authStore.role === 'USER')
const isCompany = computed(() => authStore.role === 'COMPANY')

const detail = ref(null)
const isLoading = ref(false)
const loadError = ref('')

async function fetchDetail() {
  isLoading.value = true
  loadError.value = ''
  try {
    const res = await getContractDetail(contractId)
    detail.value = res.data.data
  } catch (err) {
    loadError.value = err.response?.data?.message || '계약 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchDetail)
</script>

<style scoped>
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  margin-bottom: 7px;
  background: white;
  color: #1a233d;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.btn-back:hover {
  background: #f9fafb;
}

.detail-page {
  padding: 24px;
  height: 100vh;
  box-sizing: border-box;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  gap: 12px;
}

.btn-retry {
  padding: 8px 16px;
  background: #1a233d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.detail-layout {
  display: grid;
  grid-template-columns: 500px 1fr;
  gap: 20px;
  height: 95%;
}

.left-panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow-y: auto;
  overflow-x: auto;
  min-width: 0;
}

.right-panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* 좌측 패널이 500px로 넓어졌으므로, 우측 채팅 공간이 너무 좁아지기 전에
   더 넓은 화면 폭에서부터 1열로 전환되도록 브레이크포인트 상향 */
@media (max-width: 1100px) {
  .detail-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  /* 위아래로 겹쳤을 때 한쪽이 너무 작아지지 않도록 최소 높이 보장 */
  .left-panel {
    max-height: 60vh;
    min-height: 320px;
  }

  .right-panel {
    min-height: 420px;
  }
}
</style>
