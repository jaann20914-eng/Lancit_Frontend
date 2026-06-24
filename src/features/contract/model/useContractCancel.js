import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { requestCancel, cancelContract } from '@/features/contract/api/contractApi.js'
import { useAuthStore } from '@/features/auth/model/authStore.js'

// 계약 파기 요청/확정 공통 로직
// WAITING / NEGOTIATING_A/B/C / IN_PROGRESS 모든 상태에서 공통으로 사용
//
// 파기 확정 후 처리:
// - WAITING / NEGOTIATING_A/B/C: 백엔드에서 deleteContract (완전삭제) -> 목록으로 이동
// - IN_PROGRESS: 백엔드에서 updateStatus(CANCELLED) (소프트 삭제) -> 그대로 refresh
export function useContractCancel(detail, emit) {
  const router = useRouter()
  const authStore = useAuthStore()
  const myEmail = computed(() => authStore.email)

  const contractId = computed(() => detail.value.contractId || detail.value.contract_id)
  const cancelRequest = computed(() => detail.value.cancelRequest)

  // 완전삭제 대상 상태인지 (백엔드 cancelContract 분기와 동일 기준)
  const isHardDeleteStatus = computed(() =>
    ['PROPOSAL', 'WAITING', 'NEGOTIATING_A', 'NEGOTIATING_B', 'NEGOTIATING_C'].includes(
      detail.value.status,
    ),
  )

  // 내가 파기를 요청한 상태인지
  const isMyCancelRequest = computed(
    () => cancelRequest.value && cancelRequest.value.requesterEmail === myEmail.value,
  )

  // 상대방이 파기를 요청한 상태인지 (내가 확정 가능)
  const isOpponentCancelRequest = computed(
    () => cancelRequest.value && cancelRequest.value.requesterEmail !== myEmail.value,
  )

  async function handleRequestCancel() {
    if (!confirm('계약 파기를 요청하시겠습니까?\n상대방이 동의해야 파기가 확정됩니다.')) return
    try {
      await requestCancel(contractId.value)
      emit('refresh')
    } catch (err) {
      alert(err.response?.data?.message || '파기 요청에 실패했습니다.')
    }
  }

  async function handleCancelConfirm() {
    if (!confirm('계약이 즉시 파기됩니다. 진행하시겠습니까?')) return

    // 완전삭제 대상이면 확정 전에 미리 판단해서, API 성공 후
    // 더 이상 존재하지 않는 contractId로 재조회하지 않도록 함
    const willBeHardDeleted = isHardDeleteStatus.value

    try {
      await cancelContract(contractId.value)

      if (willBeHardDeleted) {
        alert('계약이 파기되어 삭제되었습니다.')
        const listName = authStore.role === 'company' ? 'CompanyContractList' : 'ContractList'
        router.push({ name: listName })
      } else {
        // IN_PROGRESS -> CANCELLED 소프트 삭제, 같은 페이지에서 상태만 갱신
        emit('refresh')
      }
    } catch (err) {
      alert(err.response?.data?.message || '파기 확정에 실패했습니다.')
    }
  }

  return {
    cancelRequest,
    isMyCancelRequest,
    isOpponentCancelRequest,
    handleRequestCancel,
    handleCancelConfirm,
  }
}
