<template>
  <div class="panel">
    <div class="panel-header">
      <p class="recruitment-title">{{ detail.recruitmentTitle || detail.recruitment_title }}</p>
      <span class="status-badge badge-waiting">제안중</span>
    </div>

    <!-- 파기 요청 배너 (상대방이 요청한 경우만 확정 가능) -->
    <div v-if="cancelRequest" class="cancel-banner">
      <p class="cancel-text">
        {{ isMyCancelRequest
          ? '파기를 요청했습니다. 상대방의 응답을 기다리는 중입니다.'
          : '상대방이 계약 파기를 요청했습니다.' }}
      </p>
      <button v-if="isOpponentCancelRequest" class="btn-danger" @click="handleCancelConfirm">
        파기 확정하기
      </button>
    </div>

    <div class="panel-body empty-body">
    <!-- 회사: 시작가능 -->
        <div
        v-if="isCompany"
        class="action-row start-btn"
        @click="handleStart"
        >
        <div class="start-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            </svg>
        </div>

        <p class="empty-text">
            아직 계약서가 존재하지 않습니다
        </p>

        <p class="start-text">
            계약서 작성 시작하기 →
        </p>
        </div>  

      
       <!-- 프리랜서: 대기만 가능 -->
      <p v-else class="wait-text">회사가 계약서 작성을 시작하면 알려드립니다.</p>
    </div>

    <!-- 파기 요청 (요청 중이 아닐 때만) -->
    <div v-if="!cancelRequest" class="panel-footer">
      <button class="btn-cancel-request" @click="handleRequestCancel">
        계약 파기 요청
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, toRef } from 'vue'
import { startContract, rejectContract } from '@/features/contract/api/contractApi.js'
import { useContractCancel } from '@/features/contract/model/useContractCancel.js'

const props = defineProps({
  detail: { type: Object, required: true },
  isCompany: { type: Boolean, default: false }
})

const emit = defineEmits(['refresh'])

const isLoading = ref(false)

const detailRef = toRef(props, 'detail')
const {
  cancelRequest,
  isMyCancelRequest,
  isOpponentCancelRequest,
  handleRequestCancel,
  handleCancelConfirm
} = useContractCancel(detailRef, emit)

async function handleStart() {
  isLoading.value = true
  try {
    const contractId = props.detail.contractId || props.detail.contract_id
    await startContract(contractId)
    emit('refresh')
  } catch (err) {
    alert(err.response?.data?.message || '계약서 작성 시작에 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

async function handleReject() {
  if (!confirm('정말 이 제안을 거절하시겠습니까?')) return

  isLoading.value = true
  try {
    const contractId = props.detail.contractId || props.detail.contract_id
    await rejectContract(contractId)
    alert('제안을 거절했습니다.')
    window.location.href = '/freelancer/contracts'
  } catch (err) {
    alert(err.response?.data?.message || '거절 처리에 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.panel { display: flex; flex-direction: column; height: 100%; }

.panel-header {
  padding: 18px 20px;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.recruitment-title {
  font-size: 15px;
  font-weight: 600;
  color: #1A233D;
  margin: 0;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.badge-waiting { background: #FEF9C3; color: #92400E; }

.cancel-banner {
  padding: 12px 20px;
  background: #FEF2F2;
  border-bottom: 1px solid #FEE2E2;
}

.cancel-text {
  font-size: 12px;
  color: #991B1B;
  margin: 0 0 8px;
}

.btn-danger {
  width: 100%;
  height: 36px;
  background: #EF4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.panel-body {
  flex: 1;
  padding: 24px 20px;
}

.empty-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
}

.empty-text {
  font-size: 13px;
  color: #9CA3AF;
  margin: 0;
}

.action-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 20px;
}

/* 시작하기 버튼 css */
.start-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* gap: 12px; */

  width: 100%;
  cursor: pointer;

  border-radius: 10px;

  transition: all 0.2s ease;
}

.start-icon {
  color: #c4cbd4;
  transition: all 0.2s ease;
}

.empty-text {
  color: #94A3B8;
  font-size: 14px;
}

.start-text {
  color: #64748B;
  font-size: 15px;
  font-weight: 600;

  transition: all 0.2s ease;
}

/* 호버 */
.start-btn:hover {
  background: #F8FAFC;
}

.start-btn:hover .start-icon {
  color: #1A233D;
  transform: scale(1.08);
}

.start-btn:hover .start-text {
  color: #1A233D;
}

/* 액티브 */
.start-btn:active {
  transform: scale(0.98);
}

.btn-primary {
  width: 100%;
  height: 40px;
  background: #1A233D;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-ghost {
  width: 100%;
  height: 40px;
  background: white;
  color: #EF4444;
  border: 1px solid #FEE2E2;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.wait-text {
  font-size: 12px;
  color: #D1D5DB;
  margin-top: 4px;
}

.panel-footer {
  margin-top: auto;
  padding: 14px 20px;
  border-top: 1px solid #E5E7EB;
}

.btn-cancel-request {
  width: 100%;
  height: 36px;
  background: white;
  color: #EF4444;
  border: 1px solid #FEE2E2;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
</style>