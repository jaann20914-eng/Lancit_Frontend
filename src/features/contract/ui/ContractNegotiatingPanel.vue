<template>
  <div class="panel">
    <div class="panel-header">
      <p class="recruitment-title">{{ detail.recruitmentTitle || detail.recruitment_title }}</p>
      <span class="status-badge badge-negotiating">{{ stageLabel }}</span>
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

    <!-- 드롭다운: 공고문 / 계약서 -->
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
      </button>
    </div>

    <!-- 공고문 뷰 -->
    <div v-if="activeView === 'recruitment'" class="panel-body">
      <p class="info-text">공고문 상세 내용은 추후 연동됩니다.</p>
    </div>

    <!-- 계약서 뷰: 실제 PDF 양식 그대로, 빈 칸에 입력받는 폼 -->
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

    <!-- 하단 액션 버튼 -->
    <div class="panel-footer">
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

      <button v-if="!cancelRequest" class="btn-cancel-request" @click="handleRequestCancel">
        계약 파기 요청
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, toRef } from 'vue'
import {
  saveDraft,
  sendByCompany,
  sendByFreelancer,
  approveContract,
} from '@/features/contract/api/contractApi.js'
import { useContractCancel } from '@/features/contract/model/useContractCancel.js'
import ContractDocumentForm from '@/features/contract/ui/ContractDocumentForm.vue'

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

const activeView = ref('document')
const documentFormRef = ref(null)
const isSubmitting = ref(false)

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

// 현재 단계에서 "내가" 수정 가능한지 (전체 흐름 제어용)
const canEdit = computed(() => {
  if (status.value === 'NEGOTIATING_A') return !props.isFreelancer
  if (status.value === 'NEGOTIATING_B') return props.isFreelancer
  return false
})

const isFinalStage = computed(() => status.value === 'NEGOTIATING_C')

// 회사 입력 필드(을 정보 제외 전부) 수정 가능 여부 - A단계 + 회사 본인일 때만
const canEditCompanyFields = computed(() => status.value === 'NEGOTIATING_A' && !props.isFreelancer)

// 프리랜서 입력 필드(을 정보) 수정 가능 여부 - B단계 + 프리랜서 본인일 때만
const canEditFreelancerFields = computed(
  () => status.value === 'NEGOTIATING_B' && props.isFreelancer,
)

// 개인정보 동의 체크 가능 여부 - B단계 + 프리랜서일 때만
const canEditConsent = computed(() => canEditFreelancerFields.value)

// 발송 가능 여부 (A단계 회사, B단계 프리랜서)
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

// C단계: 회사만 최종 승인 가능
const canApprove = computed(() => status.value === 'NEGOTIATING_C' && !props.isFreelancer)

const form = reactive({
  // 제1조
  contractStartDate: '',
  contractEndDate: '',
  // 제2조
  workLocation: '',
  workDescription: '',
  // 제3조 - 휴게시간은 시작~종료 범위로 관리, 익일근무 가능
  workDaysArr: [],
  workStartTime: '',
  workEndTime: '',
  breakTimeStart: '',
  breakTimeEnd: '',
  // 제5조
  monthlyWage: 0,
  basePay: 0,
  basePayBasis: '',
  overtimePay: 0,
  overtimePayBasis: '',
  holidayPay: 0,
  holidayPayBasis: '',
  mealAllowance: 0,
  totalWage: 0,
  // 서명 날짜
  contractWrittenAt: '',
  // 회사 서명 정보 (갑)
  partyA: '',
  representativeName: '',
  companyAddress: '',
  // 프리랜서 서명 정보 (을) - 성명(partyB)은 회사가 작성, 생년월일/주소는 프리랜서가 작성
  partyB: '',
  freelancerBirthDate: '',
  freelancerAddress: '',
  // 교부확인서 / 개인정보 동의서에 프리랜서가 직접 타이핑하는 성명
  // (서명테이블의 partyB와 일치해야 발송 가능 - nameMismatch 검증 대상)
  confirmSignerName: '',
  privacySignerName: '',
  // 서명 - 전부 배열 형태로 관리 (서명 1개당 각각 보관)
  representativeSignFileIds: [], // 회사 대표자 서명
  freelancerSignFileIds: [], // 프리랜서 서명 (서명 테이블)
  confirmSignFileIds: [], // 교부확인서 서명
  privacySignFileIds: [], // 개인정보 동의서 서명
})

// 개인정보 동의 - B단계(프리랜서)에서만 사용, 4개 전부 동의해야 발송 가능
// null = 미선택, true = 동의, false = 동의하지 않음
const consent = reactive({
  basic: null,
  unique: null,
  sensitive: null,
  thirdParty: null,
  thirdPartyUnique: null,
})

const allConsentChecked = computed(
  () =>
    consent.basic === true &&
    consent.unique === true &&
    consent.sensitive === true &&
    consent.thirdParty === true &&
    consent.thirdPartyUnique === true,
)

function loadDocumentIntoForm() {
  const doc = props.detail.document
  if (!doc) return

  const SKIP_KEYS = [
    'workDaysArr',
    'breakTimeStart',
    'breakTimeEnd',
    'representativeSignFileIds',
    'freelancerSignFileIds',
    'confirmSignFileIds',
    'privacySignFileIds',
  ]

  Object.keys(form).forEach((key) => {
    if (SKIP_KEYS.includes(key)) return
    if (doc[key] !== undefined && doc[key] !== null) {
      form[key] = doc[key]
    }
  })

  // workDays는 백엔드에서 "MON,TUE,WED" 콤마구분 문자열로 저장됨 -> 배열로 변환
  if (doc.workDays) {
    form.workDaysArr = String(doc.workDays)
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean)
  }

  // 휴게시간: 백엔드가 별도 시작/종료 필드를 주면 그대로, 단일 breakTime만 있으면 시작값으로만 채움(과거 데이터 호환)
  form.breakTimeStart = doc.breakTimeStart || doc.breakTime || ''
  form.breakTimeEnd = doc.breakTimeEnd || ''

  // 서명: 각 항목별로 넘버링 필드(xxx1, xxx2, ...) 또는 배열 형태 모두 대응
  form.representativeSignFileIds = extractSignatureList(doc, 'representativeSignFileId')
  form.freelancerSignFileIds = extractSignatureList(doc, 'freelancerSignFileId')
  form.confirmSignFileIds = extractSignatureList(doc, 'confirmSignFileId')
  form.privacySignFileIds = extractSignatureList(doc, 'privacySignFileId')
}

function extractSignatureList(doc, prefix) {
  const arrayKey = prefix + 's'
  if (Array.isArray(doc[arrayKey])) {
    return doc[arrayKey].map((item) =>
      typeof item === 'object' ? item : { fileId: item, previewUrl: null },
    )
  }

  const result = []
  let i = 1
  while (doc[`${prefix}${i}`] !== undefined && doc[`${prefix}${i}`] !== null) {
    result.push({ fileId: doc[`${prefix}${i}`], previewUrl: null })
    i++
  }
  return result
}

watch(() => props.detail, loadDocumentIntoForm, { immediate: true, deep: true })

// 백엔드 DTO 그룹 단위로 묶어서 전송
// - workDaysArr(배열) -> workDays(콤마구분 문자열)
// - 서명 배열 4종 전부 -> {필드명}1, {필드명}2, ... 형태로 풀어서 전송
function buildPayload() {
  const payload = {
    ...form,
    workDays: form.workDaysArr.join(','),
  }

  delete payload.workDaysArr
  delete payload.representativeSignFileIds
  delete payload.freelancerSignFileIds
  delete payload.confirmSignFileIds
  delete payload.privacySignFileIds

  const flattenSignatures = (list, prefix) => {
    list.forEach((sig, idx) => {
      payload[`${prefix}${idx + 1}`] = sig.fileId
    })
  }

  flattenSignatures(form.representativeSignFileIds, 'representativeSignFileId')
  flattenSignatures(form.freelancerSignFileIds, 'freelancerSignFileId')
  flattenSignatures(form.confirmSignFileIds, 'confirmSignFileId')
  flattenSignatures(form.privacySignFileIds, 'privacySignFileId')

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
  // 동일 인물을 가리키는 값(서명테이블 성명 vs 교부확인서/동의서에 직접 작성한 성명)이
  // 서로 일치하지 않으면 발송 자체를 막음
  if (documentFormRef.value?.hasAnyMismatch) {
    alert('성명 입력값이 서로 일치하지 않습니다. 빨간색으로 표시된 항목을 확인해주세요.')
    return
  }

  // 본인이 채워야 하는 항목 중 비어있는 칸이 있으면 발송 자체를 막음
  if (documentFormRef.value?.hasMissingRequired) {
    alert('아직 작성하지 않은 항목이 있습니다. 빨간색으로 표시된 항목을 모두 채워주세요.')
    return
  }

  // B단계(프리랜서)는 개인정보 동의 5개 항목 전부 "동의"를 선택해야만 진행
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
  /* 내부 doc-page가 min-width를 가지므로, 화면이 좁으면 가로 스크롤로 처리 (테이블이 찌그러지지 않도록) */
  overflow-x: auto;
}

.panel-footer {
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 8px;
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
