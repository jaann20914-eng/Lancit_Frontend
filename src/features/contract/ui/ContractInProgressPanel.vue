<template>
  <div class="panel">
    <div class="panel-header">
      <p class="recruitment-title">{{ detail.recruitmentTitle || detail.recruitment_title }}</p>
      <span :class="['status-badge', isPending ? 'badge-pending' : 'badge-inprogress']">
        {{ isPending ? '완료 대기' : '진행중' }}
      </span>
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

    <!-- 드롭다운: 컨펌 파일 목록 / 계약서 -->
    <div class="dropdown-tabs">
      <button
        :class="['dropdown-tab', activeView === 'confirm' ? 'active' : '']"
        @click="activeView = 'confirm'"
      >
        컨펌 파일 목록
        <span v-if="hasConfirmNotif" class="tab-badge"></span>
      </button>
      <button
        :class="['dropdown-tab', activeView === 'document' ? 'active' : '']"
        @click="activeView = 'document'"
      >
        계약서
        <span v-if="hasDocumentNotif" class="tab-badge"></span>
      </button>
    </div>

    <!-- 컨펌 파일 목록 뷰 -->
    <div v-if="activeView === 'confirm'" class="panel-body">
      <div class="section">
        <div class="section-head">
          <!-- <span class="section-title">컨펌 파일 목록</span> -->
          <button v-if="isFreelancer && !isPending" class="btn-add" @click="triggerFileInput">
            +
          </button>
        </div>

        <input ref="fileInputRef" type="file" style="display: none" @change="handleFileSelect" />

        <div v-if="confirmFiles.length === 0" class="empty-mini">업로드된 파일이 없습니다</div>

        <div v-else class="file-groups">
          <div v-for="[date, files] in groupedConfirmFiles" :key="date" class="file-group">
            <!-- 날짜 구분선 -->
            <div class="file-date-divider">
              <span>{{ date }}</span>
            </div>
            <!-- 파일 목록 -->
            <div class="file-list">
              <div v-for="file in files" :key="file.contractFileId" class="file-item">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span class="file-name" @click="handleDownloadFile(file.fileId, file.oriName)">
                  {{ file.oriName || `파일_${file.fileId}` }}
                </span>
                <span class="file-date">{{ String(file.createdAt).slice(11, 16) }}</span>
                <button
                  v-if="isFreelancer && !isPending"
                  class="btn-delete-file"
                  @click="handleDeleteFile(file.contractFileId)"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 계약서 뷰: PDF 다운로드 + 실제 계약서 내용 (전체 읽기전용) -->
    <div v-else class="panel-body document-wrap">
      <button v-if="pdfFile" class="btn-download-top" @click="handleDownloadPdf">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        계약서 PDF 다운로드
      </button>

      <ContractDocumentForm
        :form="documentForm"
        :consent="readonlyConsent"
        :can-edit-company-fields="false"
        :can-edit-freelancer-fields="false"
        :can-edit-consent="false"
      />
    </div>

    <!-- 하단 액션 -->
    <div class="panel-footer">
      <button v-if="isPending && !isFreelancer" class="btn-complete" @click="handleComplete">
        계약 완료 확정
      </button>
      <button v-else-if="!cancelRequest" class="btn-cancel-request" @click="handleRequestCancel">
        계약 파기 요청
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, toRef, watch, onMounted } from 'vue'
import httpClient from '@/shared/api/httpClient.js'
import {
  getConfirmFiles,
  uploadConfirmFile,
  deleteConfirmFile,
  completeContract,
  downloadContractPdf,
  uploadFile,
  getFileDownloadUrl,
} from '@/features/contract/api/contractApi.js'
import { useAuthStore } from '@/features/auth/model/authStore.js'
import { useContractCancel } from '@/features/contract/model/useContractCancel.js'
import { useContractDocumentForm } from '@/features/contract/model/useContractDocumentForm.js'
import ContractDocumentForm from '@/features/contract/ui/ContractDocumentForm.vue'
import { useNotificationStore } from '@/features/notification/model/useNotificationStore.js'

const props = defineProps({
  detail: { type: Object, required: true },
  isFreelancer: { type: Boolean, default: false },
})

const emit = defineEmits(['refresh'])

const authStore = useAuthStore()
const myEmail = computed(() => authStore.email)

const activeView = ref('confirm')

const contractId = computed(() => props.detail.contractId || props.detail.contract_id)
const isPending = computed(() => props.detail.status === 'COMPLETED_PENDING')
const document = computed(() => props.detail.document)
const pdfFile = computed(() => props.detail.pdfFile)
const confirmFiles = ref(props.detail.confirmFiles || [])
const notificationStore = useNotificationStore()

// 계약서 내용을 ContractDocumentForm이 기대하는 form 형태로 변환 (전체 읽기전용으로 표시)
const { form: documentForm } = useContractDocumentForm(document)

// 동의서는 이미 발송 단계에서 전부 동의 완료된 상태이므로 전부 true로 고정 표시
const readonlyConsent = {
  basic: true,
  unique: true,
  sensitive: true,
  thirdParty: true,
  thirdPartyUnique: true,
}

const detailRef = toRef(props, 'detail')
const {
  cancelRequest,
  isMyCancelRequest,
  isOpponentCancelRequest,
  handleRequestCancel,
  handleCancelConfirm,
} = useContractCancel(detailRef, emit)

const fileInputRef = ref(null)
const groupedConfirmFiles = computed(() => {
  const sorted = [...confirmFiles.value].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )
  const groups = {}
  for (const file of sorted) {
    const date = String(file.createdAt).slice(0, 10)
    if (!groups[date]) groups[date] = []
    groups[date].push(file)
  }
  return Object.entries(groups) // [['2026-06-25', [...]], ...]
})

// 컨펌파일 탭 알림 표시
const hasConfirmNotif = computed(() =>
  notificationStore.hasUnreadByContractAndType(contractId.value, 'CONFIRM_FILE'),
)

// 계약서 탭 알림 표시 (PROPOSAL, CONTRACT_CANCEL_REQUEST, CONTRACT_COMPLETED_PENDING)
const hasDocumentNotif = computed(() =>
  notificationStore.hasUnreadByContractAndType(
    contractId.value,
    'PROPOSAL',
    'CONTRACT_CANCEL_REQUEST',
    'CONTRACT_COMPLETED_PENDING',
    'CONTRACT_COMPLETED',
  ),
)

// onMounted(async () => {
//   // 초기 탭 상태에 따라 즉시 읽음 처리
//   if (activeView.value === 'confirm') {
//     try {
//       await httpClient.patch(`/api/notifications/contracts/${contractId.value}/confirm-files/read`)
//       notificationStore.markReadByContractAndType(contractId.value, 'CONFIRM_FILE')
//       await notificationStore.fetchUnread()
//     } catch (e) {}
//   } else if (activeView.value === 'document') {
//     try {
//       await httpClient.patch(`/api/notifications/contracts/${contractId.value}/read`)
//       notificationStore.markReadByContractAndType(
//         contractId.value,
//         'PROPOSAL',
//         'CONTRACT_CANCEL_REQUEST',
//         'CONTRACT_COMPLETED_PENDING',
//         'CONTRACT_COMPLETED',
//       )
//       await notificationStore.fetchUnread()
//     } catch (e) {}
//   }
// })

// 탭 변경 시 읽음 처리
watch(
  activeView,
  async (view) => {
    if (view === 'confirm') {
      try {
        await httpClient.patch(`/notifications/contracts/${contractId.value}/confirm-files/read`)
        notificationStore.markReadByContractAndType(contractId.value, 'CONFIRM_FILE')
        await notificationStore.fetchUnread()
      } catch (e) {}
    }
    if (view === 'document') {
      try {
        await httpClient.patch(`/notifications/contracts/${contractId.value}/types/read`, [
          'PROPOSAL',
          'CONTRACT_CANCEL_REQUEST',
          'CONTRACT_COMPLETED_PENDING',
          'CONTRACT_COMPLETED',
        ])
        notificationStore.markReadByContractAndType(
          contractId.value,
          'PROPOSAL',
          'CONTRACT_CANCEL_REQUEST',
          'CONTRACT_COMPLETED_PENDING',
          'CONTRACT_COMPLETED',
        )
        await notificationStore.fetchUnread()
      } catch (e) {}
    }
  },
  { immediate: true },
) // ← 탭 초기값이 'confirm'이면 진입 즉시 읽음 처리

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return String(dateStr).slice(0, 10)
}

function formatMoney(amount) {
  if (!amount) return '-'
  return Number(amount).toLocaleString() + '원'
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleFileSelect(e) {
  const file = e.target.files[0]
  if (!file) return

  try {
    const uploadRes = await uploadFile(file)
    const fileId = uploadRes.data.data[0].fileId

    await uploadConfirmFile(contractId.value, fileId)

    const res = await getConfirmFiles(contractId.value)
    confirmFiles.value = res.data.data
  } catch (err) {
    alert(err.response?.data?.message || '파일 업로드에 실패했습니다.')
  } finally {
    fileInputRef.value.value = ''
  }
}

async function handleDownloadFile(fileId, oriName) {
  try {
    const response = await getFileDownloadUrl(fileId)
    const blobUrl = URL.createObjectURL(response.data)
    const a = window.document.createElement('a')
    a.href = blobUrl
    a.download = oriName || `파일_${fileId}`
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    alert('파일 다운로드에 실패했습니다.')
  }
}

async function handleDeleteFile(contractFileId) {
  if (!confirm('이 파일을 삭제하시겠습니까?')) return
  try {
    await deleteConfirmFile(contractId.value, contractFileId)
    confirmFiles.value = confirmFiles.value.filter((f) => f.contractFileId !== contractFileId)
  } catch (err) {
    alert(err.response?.data?.message || '삭제에 실패했습니다.')
  }
}

async function handleDownloadPdf() {
  try {
    const response = await downloadContractPdf(contractId.value)
    const blobUrl = URL.createObjectURL(response.data)
    const el = window.document.createElement('a')
    el.href = blobUrl
    el.download = '근로계약서.pdf'
    window.document.body.appendChild(el)
    el.click()
    window.document.body.removeChild(el)
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    alert('PDF 다운로드에 실패했습니다.')
  }
}

async function handleComplete() {
  if (!confirm('계약을 완료 처리하시겠습니까?')) return
  try {
    await completeContract(contractId.value)
    emit('refresh')
  } catch (err) {
    alert(err.response?.data?.message || '완료 처리에 실패했습니다.')
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
  white-space: nowrap;
}
.badge-inprogress {
  background: #dcfce7;
  color: #15803d;
}
.badge-pending {
  background: #ede9fe;
  color: #6d28d9;
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

/* 드롭다운 탭 */
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

.dropdown-tab {
  position: relative;
}

.tab-badge {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ef4444;
  margin-left: 5px;
  vertical-align: middle;
}

.dropdown-tab.active {
  color: #1a233d;
  border-bottom-color: #1a233d;
  font-weight: 600;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
}

.section {
  padding: 14px 20px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a233d;
}

.btn-add {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #1a233d;
  color: white;
  border: none;
  font-size: 14px;
  cursor: pointer;
  line-height: 1;
}

.empty-mini {
  font-size: 12px;
  color: #d1d5db;
  text-align: center;
  padding: 12px 0;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 12px;
  color: #1a233d;
}

.file-name {
  flex: 1;
  cursor: pointer;
  text-decoration: underline;
}
.file-date {
  color: #9ca3af;
  font-size: 11px;
}

.btn-delete-file {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.info-card {
  background: #f9fafb;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6c757d;
  margin: 0 0 6px;
}

.info-row:last-child {
  margin-bottom: 0;
}
.info-row strong {
  color: #1a233d;
  font-weight: 500;
}

.btn-download {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  background: white;
  color: #1a233d;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.document-wrap {
  background: #f4f5f7;
  padding: 16px 16px 0;
}

.btn-download-top {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 42px;
  background: #1a233d;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 16px;
}

.btn-download-top:hover {
  background: #253a63;
}

.panel-footer {
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-complete {
  width: 100%;
  height: 40px;
  background: #15803d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
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

.file-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-date-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.file-date-divider::before,
.file-date-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.file-date-divider span {
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
  padding: 0 4px;
}
</style>
