<template>
  <div class="panel">
    <div class="panel-header">
      <p class="recruitment-title">{{ detail.recruitmentTitle || detail.recruitment_title }}</p>
      <span class="status-badge badge-negotiating">{{ stageLabel }}</span>
    </div>

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

    <div class="dropdown-tabs">
      <button
        :class="['dropdown-tab', activeView === 'recruitment' ? 'active' : '']"
        @click="activeView = 'recruitment'"
      >
        공고문
      </button>
      <button
        :class="['dropdown-tab', activeView === 'document' ? 'active' : '']"
        @click="activeView = 'document'"
      >
        계약서
        <span v-if="hasDocumentNotif" class="tab-badge"></span>
      </button>
    </div>

    <div v-if="activeView === 'recruitment'" class="panel-body">
      <RecruitmentDetailReadonly v-if="recruitment" :recruitment="recruitment" />
    </div>

    <div v-else class="panel-body document-wrap">
      <p class="form-note">
        {{ canEdit ? '전송하기 전에는 내용 수정 가능' : '상대방이 작성 중입니다' }}
      </p>

      <ContractDocumentForm
        ref="documentFormRef"
        :form="form"
        :consent="consent"
        :can-edit-company-fields="canEditCompanyFields"
        :can-edit-freelancer-fields="canEditFreelancerFields"
        :can-edit-consent="canEditConsent"
      />
    </div>

    <div class="panel-footer">
      <!-- 액션 버튼 영역 -->
      <div v-if="(canEdit && !isFinalStage) || canSend" class="btn-row">
        <button
          v-if="canEdit && !isFinalStage"
          class="btn-primary"
          :disabled="isSubmitting"
          @click="handleSaveDraft"
        >
          임시저장
        </button>
        <button v-if="canSend" class="btn-send" :disabled="isSubmitting" @click="handleSend">
          {{ sendButtonLabel }}
        </button>
      </div>

      <button v-if="canApprove" class="btn-approve" :disabled="isSubmitting" @click="handleApprove">
        최종 승인 (계약서 확정)
      </button>

      <p v-if="!canEdit && !canSend && !canApprove" class="wait-text">
        상대방의 응답을 기다리는 중입니다
      </p>

      <!-- 파기 요청: cancelRequest 없을 때만, 항상 맨 아래 -->
      <template v-if="!cancelRequest">
        <hr class="footer-hr" />
        <button class="btn-cancel-request" @click="handleRequestCancel">계약 파기 요청</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, toRef, onMounted } from 'vue'
import {
  saveDraft,
  sendByCompany,
  sendByFreelancer,
  approveContract,
} from '@/features/contract/api/contractApi.js'
import { useContractCancel } from '@/features/contract/model/useContractCancel.js'
import ContractDocumentForm from '@/features/contract/ui/ContractDocumentForm.vue'
import { useNotificationStore } from '@/features/notification/model/useNotificationStore.js'
import RecruitmentDetailReadonly from '@/features/recruitment/ui/RecruitmentDetailReadonly.vue'
import { getRecruitmentDetail } from '@/features/recruitment/api/recruitmentApi.js'
import httpClient from '@/shared/api/httpClient.js'

const props = defineProps({
  detail: { type: Object, required: true },
  isFreelancer: { type: Boolean, default: false },
})

const emit = defineEmits(['refresh'])

const detailRef = toRef(props, 'detail')
const {
  cancelRequest,
  isMyCancelRequest,
  isOpponentCancelRequest,
  handleRequestCancel,
  handleCancelConfirm,
} = useContractCancel(detailRef, emit)

const activeView = ref('recruitment')
const documentFormRef = ref(null)
const isSubmitting = ref(false)
const notificationStore = useNotificationStore()

const contractId = computed(() => props.detail.contractId || props.detail.contract_id)
const status = computed(() => props.detail.status)

const stageLabel = computed(() => {
  const map = {
    NEGOTIATING_A: '협의중 (1차)',
    NEGOTIATING_B: '협의중 (2차)',
    NEGOTIATING_C: '최종 검토',
  }
  return map[status.value] || '협의중'
})

const canEdit = computed(() => {
  if (status.value === 'NEGOTIATING_A') return !props.isFreelancer
  if (status.value === 'NEGOTIATING_B') return props.isFreelancer
  return false
})

const isFinalStage = computed(() => status.value === 'NEGOTIATING_C')

const canEditCompanyFields = computed(() => status.value === 'NEGOTIATING_A' && !props.isFreelancer)

const canEditFreelancerFields = computed(
  () => status.value === 'NEGOTIATING_B' && props.isFreelancer,
)

const canEditConsent = computed(() => canEditFreelancerFields.value)

const canSend = computed(() => {
  if (status.value === 'NEGOTIATING_A') return !props.isFreelancer
  if (status.value === 'NEGOTIATING_B') return props.isFreelancer
  return false
})

const sendButtonLabel = computed(() => {
  if (status.value === 'NEGOTIATING_A') return '계약서 발송 (프리랜서에게)'
  if (status.value === 'NEGOTIATING_B') return '계약서 발송 (회사에게)'
  return '발송'
})

const canApprove = computed(() => status.value === 'NEGOTIATING_C' && !props.isFreelancer)

const form = reactive({
  contractStartDate: '',
  contractEndDate: '',
  workLocation: '',
  workDescription: '',
  workDaysArr: [],
  workStartTime: '',
  workEndTime: '',
  breakTimeStart: '',
  breakTimeEnd: '',
  monthlyWage: 0,
  basePay: 0,

  overtimePay: 0,

  holidayPay: 0,
  basePayBasisHour: null,

  overtimePayBasisHour: null,

  holidayPayBasisHour: null,
  mealAllowance: 0,
  totalWage: 0,
  contractWrittenAt: '',
  partyA: '',
  representativeName: '',
  companyAddress: '',
  partyB: '',
  freelancerBirthDate: '',
  freelancerAddress: '',
  confirmSignerName: '',
  privacySignerName: '',
  representativeSignFileId: null,
  contractSignFileId: null,
  confirmSignFileId: null,
  privacySignFileId: null,
})

const consent = reactive({
  basic: null,
  unique: null,
  sensitive: null,
  thirdParty: null,
  thirdPartyUnique: null,
})
watch(
  status,
  (newStatus) => {
    if (newStatus === 'NEGOTIATING_C') {
      consent.basic = true
      consent.unique = true
      consent.sensitive = true
      consent.thirdParty = true
      consent.thirdPartyUnique = true
    }
  },
  { immediate: true },
)

const hasDocumentNotif = computed(() =>
  notificationStore.hasUnreadByContractAndType(contractId.value, 'PROPOSAL'),
)

const allConsentChecked = computed(
  () =>
    consent.basic === true &&
    consent.unique === true &&
    consent.sensitive === true &&
    consent.thirdParty === true &&
    consent.thirdPartyUnique === true,
)

// onMounted(async () => {
//   if (activeView.value === 'document') {
//     try {
//       await httpClient.patch(`/api/notifications/contracts/${contractId.value}/read`)
//       notificationStore.markReadByContractAndType(contractId.value, 'PROPOSAL')
//       await notificationStore.fetchUnread()
//     } catch (e) {}
//   }
// })

const recruitment = ref(null)

// ContractNegotiatingPanel.vue 내부
async function fetchRecruitment() {
  const recruitmentId = props.detail.recruitmentId || props.detail.recruitment_id
  if (!recruitmentId) return
  try {
    const res = await getRecruitmentDetail(recruitmentId)
    // 응답 구조에 맞게 선택
    recruitment.value = res.data?.data ?? res.data
  } catch (e) {
    console.error('공고 로드 실패', e)
  }
}

onMounted(() => {
  fetchRecruitment()
})

// watch(
//   activeView,
//   async (view) => {
//     if (view === 'document') {
//       try {
//         await httpClient.patch(`/notifications/contracts/${contractId.value}/types/read`, [
//           'PROPOSAL',
//           'CONTRACT_CANCEL_REQUEST',
//           'CONTRACT_COMPLETED_PENDING',
//           'CONTRACT_COMPLETED',
//         ])
//         notificationStore.markReadByContractAndType(
//           contractId.value,
//           'PROPOSAL',
//           'CONTRACT_CANCEL_REQUEST',
//           'CONTRACT_COMPLETED_PENDING',
//           'CONTRACT_COMPLETED',
//         )
//         await notificationStore.fetchUnread()
//       } catch (e) {}
//     }
//   },
//   { immediate: true }, // ← 추가 (onMounted 역할 대체)
// )
watch(activeView, async (view) => {
  if (view !== 'document') return
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
})

function loadDocumentIntoForm() {
  const doc = props.detail.document
  if (!doc) return

  const SKIP_KEYS = [
    'workDaysArr',
    'breakTimeStart',
    'breakTimeEnd',

    'basePayBasisHour',
    'overtimePayBasisHour',
    'holidayPayBasisHour',
  ]

  Object.keys(form).forEach((key) => {
    if (SKIP_KEYS.includes(key)) return
    if (doc[key] !== undefined && doc[key] !== null) {
      form[key] = doc[key]
    }
  })

  if (doc.workDays) {
    form.workDaysArr = String(doc.workDays)
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean)
  }

  form.breakTimeStart = doc.breakTimeStart || doc.breakTime || ''
  form.breakTimeEnd = doc.breakTimeEnd || ''

  form.basePayBasisHour =
    doc.basePayBasisMinutes == null ? null : Math.floor(doc.basePayBasisMinutes / 60)

  form.overtimePayBasisHour =
    doc.overtimePayBasisMinutes == null ? null : Math.floor(doc.overtimePayBasisMinutes / 60)

  form.holidayPayBasisHour =
    doc.holidayPayBasisMinutes == null ? null : Math.floor(doc.holidayPayBasisMinutes / 60)

  form.representativeSignFileId = doc.representativeSignFileId

  form.contractSignFileId = doc.contractSignFileId

  form.confirmSignFileId = doc.confirmSignFileId

  form.privacySignFileId = doc.privacySignFileId
}

watch(() => props.detail, loadDocumentIntoForm, { immediate: true, deep: true })

function buildPayload() {
  const payload = {
    ...form,
    workDays: form.workDaysArr.join(','),

    basePayBasisMinutes: form.basePayBasisHour == null ? null : form.basePayBasisHour * 60,

    overtimePayBasisMinutes:
      form.overtimePayBasisHour == null ? null : form.overtimePayBasisHour * 60,

    holidayPayBasisMinutes: form.holidayPayBasisHour == null ? null : form.holidayPayBasisHour * 60,
  }

  delete payload.workDaysArr
  delete payload.representativeSignFileIds
  delete payload.freelancerSignFileIds
  delete payload.confirmSignFileIds
  delete payload.privacySignFileIds

  delete payload.basePayBasisHour
  delete payload.overtimePayBasisHour
  delete payload.holidayPayBasisHour

  payload.representativeSignFileId = form.representativeSignFileId

  payload.contractSignFileId = form.contractSignFileId

  payload.confirmSignFileId = form.confirmSignFileId

  payload.privacySignFileId = form.privacySignFileId

  console.log('[buildPayload] 서명 fileIds:', {
    representativeSignFileId: payload.representativeSignFileId,
    contractSignFileId: payload.contractSignFileId,
    confirmSignFileId: payload.confirmSignFileId,
    privacySignFileId: payload.privacySignFileId,
  })

  return payload
}

async function handleSaveDraft() {
  isSubmitting.value = true
  try {
    await saveDraft(contractId.value, buildPayload())
    alert('임시저장되었습니다.')
  } catch (err) {
    alert(err.response?.data?.message || '저장에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

async function handleSend() {
  if (documentFormRef.value?.hasAnyMismatch) {
    alert('성명 입력값이 서로 일치하지 않습니다. 빨간색으로 표시된 항목을 확인해주세요.')
    return
  }

  if (documentFormRef.value?.hasMissingRequired) {
    alert('아직 작성하지 않은 항목이 있습니다. 빨간색으로 표시된 항목을 모두 채워주세요.')
    return
  }

  if (status.value === 'NEGOTIATING_B' && props.isFreelancer) {
    if (!allConsentChecked.value) {
      alert('개인정보 수집·이용·제공에 모두 동의해야만 다음 단계로 진행할 수 있습니다.')
      return
    }
  }

  if (!confirm('계약서를 전송하면 더 이상 수정이 불가합니다. 발송하시겠습니까?')) return

  isSubmitting.value = true
  try {
    if (status.value === 'NEGOTIATING_A') {
      await sendByCompany(contractId.value, buildPayload())
    } else {
      await sendByFreelancer(contractId.value, buildPayload())
    }
    emit('refresh')
  } catch (err) {
    alert(err.response?.data?.message || '발송에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

async function handleApprove() {
  if (!confirm('계약을 최종 승인하면 계약이 즉시 확정됩니다. 진행하시겠습니까?')) return

  isSubmitting.value = true
  try {
    await approveContract(contractId.value)
    emit('refresh')
  } catch (err) {
    alert(err.response?.data?.message || '승인에 실패했습니다.')
  } finally {
    isSubmitting.value = false
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

.badge-negotiating {
  background: #dbeafe;
  color: #1d4ed8;
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
  overflow-x: auto;
  background: #f4f5f7;
}

.info-text {
  font-size: 13px;
  color: #9ca3af;
  padding: 16px 20px;
}

.form-note {
  font-size: 11px;
  color: #ef4444;
  margin: 0;
  padding: 10px 20px 0;
}

.document-wrap {
  padding: 0 0 16px;
  overflow-x: auto;
}

.panel-footer {
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.footer-hr {
  border: none;
  border-top: 1px solid #f3f4f6;
  margin: 0;
}

.btn-row {
  display: flex;
  gap: 8px;
}

.btn-primary {
  flex: 1;
  height: 36px;
  background: white;
  color: #1a233d;
  border: 1px solid #1a233d;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.btn-send {
  flex: 1;
  height: 36px;
  background: #1a233d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-approve {
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

.btn-primary:disabled,
.btn-send:disabled,
.btn-approve:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.wait-text {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
  margin: 0;
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
