<template>
  <div class="panel">
    <div class="panel-header">
      <p class="recruitment-title">{{ detail.recruitmentTitle || detail.recruitment_title }}</p>
      <span class="status-badge badge-waiting">제안중</span>
    </div>

    <!-- 파기 요청 배너 -->
    <div v-if="cancelRequest" class="cancel-banner">
      <p class="cancel-text">
        {{
          isMyCancelRequest
            ? '파기를 요청했습니다. 상대방의 응답을 기다리는 중입니다.'
            : '상대방이 계약 파기를 요청했습니다.'
        }}
      </p>
      <button v-if="isOpponentCancelRequest" class="btn-danger" @click="handleCancelConfirm">
        파기 확정하기
      </button>
    </div>

    <!-- 탭 -->
    <div class="dropdown-tabs">
      <button
        :class="['dropdown-tab', activeView === 'recruitment' ? 'active' : '']"
        @click="activeView = 'recruitment'"
      >
        공고문
      </button>
      <button
        :class="['dropdown-tab', activeView === 'contract' ? 'active' : '']"
        @click="activeView = 'contract'"
      >
        계약 시작하기
      </button>
    </div>

    <!-- 공고문 탭 -->
    <div v-if="activeView === 'recruitment'" class="panel-body">
      <RecruitmentDetailReadonly
        v-if="recruitment"
        :recruitment="recruitment"
        :image-url="imageUrl"
      />
      <div v-else class="empty-state">공고 정보를 불러오는 중...</div>
    </div>

    <!-- 계약 시작하기 탭 -->
    <div v-else class="panel-body empty-body">
      <!-- 회사: 시작 가능 -->
      <div v-if="isCompany" class="action-row start-btn" @click="handleStart">
        <div class="start-icon">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <p class="empty-text">아직 계약서가 존재하지 않습니다</p>
        <p class="start-text">계약서 작성 시작하기 →</p>
      </div>

      <!-- 프리랜서: 대기 -->
      <p v-else class="wait-text">회사가 계약서 작성을 시작하면 알려드립니다.</p>
    </div>

    <!-- 푸터: 파기 요청 -->
    <div v-if="!cancelRequest" class="panel-footer">
      <button class="btn-cancel-request" @click="handleRequestCancel">계약 파기 요청</button>
    </div>
  </div>
</template>

<script setup>
import { ref, toRef, onMounted } from 'vue'
import { startContract, rejectContract } from '@/features/contract/api/contractApi.js'
import { useContractCancel } from '@/features/contract/model/useContractCancel.js'
import RecruitmentDetailReadonly from '@/features/recruitment/ui/RecruitmentDetailReadonly.vue'
import {
  getRecruitmentDetail,
  getRecruitmentFileUrl,
} from '@/features/recruitment/api/recruitmentApi.js'

const props = defineProps({
  detail: { type: Object, required: true },
  isCompany: { type: Boolean, default: false },
})

const emit = defineEmits(['refresh'])

const activeView = ref('recruitment') // 디폴트: 공고탭
const isLoading = ref(false)

const detailRef = toRef(props, 'detail')
const {
  cancelRequest,
  isMyCancelRequest,
  isOpponentCancelRequest,
  handleRequestCancel,
  handleCancelConfirm,
} = useContractCancel(detailRef, emit)

// ref 추가
const recruitment = ref(null)
const imageUrl = ref('')

// fetchRecruitment 수정
async function fetchRecruitment() {
  const recruitmentId = props.detail.recruitmentId || props.detail.recruitment_id
  if (!recruitmentId) return
  try {
    const res = await getRecruitmentDetail(recruitmentId)
    const data = res.data?.data ?? res.data
    recruitment.value = data

    if (data.imageFileId != null) {
      try {
        imageUrl.value = await getRecruitmentFileUrl(data.imageFileId)
      } catch {
        imageUrl.value = ''
      }
    }
  } catch (e) {
    console.error('공고 로드 실패', e)
  }
}

onMounted(fetchRecruitment)

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
</script>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 18px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.recruitment-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a233d;
  margin: 0;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.badge-waiting {
  background: #fef9c3;
  color: #92400e;
}

.cancel-banner {
  padding: 12px 20px;
  background: #fef2f2;
  border-bottom: 1px solid #fee2e2;
}

.cancel-text {
  font-size: 12px;
  color: #991b1b;
  margin: 0 0 8px;
}

.btn-danger {
  width: 100%;
  height: 36px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

/* 탭 */
.dropdown-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.dropdown-tab {
  flex: 1;
  padding: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #9ca3af;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
}

.dropdown-tab.active {
  color: #1a233d;
  border-bottom-color: #1a233d;
  font-weight: 600;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  background: #f4f5f7;
}

.empty-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
  padding: 24px 20px;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

.action-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 20px;
}

.start-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
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
  color: #94a3b8;
  font-size: 14px;
  margin: 0;
}

.start-text {
  color: #64748b;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s ease;
  margin: 0;
}

.start-btn:hover {
  background: #f8fafc;
}
.start-btn:hover .start-icon {
  color: #1a233d;
  transform: scale(1.08);
}
.start-btn:hover .start-text {
  color: #1a233d;
}
.start-btn:active {
  transform: scale(0.98);
}

.wait-text {
  font-size: 12px;
  color: #d1d5db;
  margin-top: 4px;
}

.panel-footer {
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel-request {
  width: 100%;
  height: 36px;
  background: white;
  color: #ef4444;
  border: 1px solid #fee2e2;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
</style>
