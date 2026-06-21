<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">사업자번호 인증</h3>
        <button class="btn-close" @click="handleClose">×</button>
      </div>

      <p class="modal-desc">국세청 사업자등록 정보와 대조하여 유효성을 확인합니다</p>

      <div class="form-group">
        <label class="form-label">사업자등록번호</label>
        <div class="business-input-row">
          <input
            ref="part1Ref"
            v-model="part1"
            type="text"
            inputmode="numeric"
            maxlength="3"
            class="biz-input biz-input-3"
            placeholder="000"
            :disabled="isVerifying"
            @input="handleInput('part1', $event)"
          />
          <span class="biz-dash">-</span>
          <input
            ref="part2Ref"
            v-model="part2"
            type="text"
            inputmode="numeric"
            maxlength="2"
            class="biz-input biz-input-2"
            placeholder="00"
            :disabled="isVerifying"
            @input="handleInput('part2', $event)"
            @keydown.backspace="handleBackspace('part1', part2, $event)"
          />
          <span class="biz-dash">-</span>
          <input
            ref="part3Ref"
            v-model="part3"
            type="text"
            inputmode="numeric"
            maxlength="5"
            class="biz-input biz-input-5"
            placeholder="00000"
            :disabled="isVerifying"
            @input="handleInput('part3', $event)"
            @keydown.backspace="handleBackspace('part2', part3, $event)"
            @keyup.enter="handleVerify"
          />
        </div>
      </div>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      <p v-if="successMsg" class="success-msg">✓ {{ successMsg }}</p>

      <div class="modal-actions">
        <button class="btn-cancel" @click="handleClose">취소</button>
        <button class="btn-confirm" :disabled="!isComplete || isVerifying" @click="handleVerify">
          {{ isVerifying ? '확인 중...' : '인증하기' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { verifyBusinessNumber } from '@/features/auth/api/authApi.js'

const props = defineProps({
  // 숫자만 들어있는 기존 값 (예: "1234567890") 또는 빈 문자열
  initialValue: { type: String, default: '' },
})

const emit = defineEmits(['close', 'verified'])

const part1 = ref('')
const part2 = ref('')
const part3 = ref('')

const part1Ref = ref(null)
const part2Ref = ref(null)
const part3Ref = ref(null)

const isVerifying = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// 기존 값(숫자만)을 3칸으로 분리해서 채워줌
onMounted(() => {
  const digits = (props.initialValue || '').replace(/\D/g, '')
  part1.value = digits.slice(0, 3)
  part2.value = digits.slice(3, 5)
  part3.value = digits.slice(5, 10)
})

// 숫자만 남기고, maxlength 넘는 부분은 잘라냄
function onlyDigits(value, max) {
  return value.replace(/\D/g, '').slice(0, max)
}

function handleInput(field, e) {
  const maxLen = field === 'part1' ? 3 : field === 'part2' ? 2 : 5
  const cleaned = onlyDigits(e.target.value, maxLen)

  if (field === 'part1') part1.value = cleaned
  if (field === 'part2') part2.value = cleaned
  if (field === 'part3') part3.value = cleaned

  errorMsg.value = ''
  successMsg.value = ''

  // 자동으로 다음 칸 포커스 이동 (해당 칸이 꽉 찼을 때)
  if (field === 'part1' && cleaned.length === 3) {
    nextTick(() => part2Ref.value?.focus())
  } else if (field === 'part2' && cleaned.length === 2) {
    nextTick(() => part3Ref.value?.focus())
  }
}

// 비어있는 칸에서 백스페이스 누르면 이전 칸으로 포커스 이동
function handleBackspace(prevField, currentValue, e) {
  if (currentValue === '' && e.key === 'Backspace') {
    if (prevField === 'part1') part1Ref.value?.focus()
    if (prevField === 'part2') part2Ref.value?.focus()
  }
}

// 숫자만 이어붙인 전체 사업자번호 (백엔드 전송용)
const fullNumber = computed(() => `${part1.value}${part2.value}${part3.value}`)

// 화면 표시용 XXX-XX-XXXXX 형식
const displayNumber = computed(() => {
  const parts = [part1.value, part2.value, part3.value].filter(Boolean)
  return parts.join('-')
})

const isComplete = computed(
  () => part1.value.length === 3 && part2.value.length === 2 && part3.value.length === 5,
)

async function handleVerify() {
  if (!isComplete.value) return

  errorMsg.value = ''
  successMsg.value = ''
  isVerifying.value = true

  try {
    // 백엔드로는 숫자만 전송
    const res = await verifyBusinessNumber(fullNumber.value)
    if (res.data.data === true) {
      successMsg.value = '사업자번호가 확인되었습니다.'
      setTimeout(() => {
        emit('verified', { businessNumber: fullNumber.value, verified: true })
      }, 700)
    } else {
      errorMsg.value = '유효하지 않은 사업자번호입니다.'
      emit('verified', { businessNumber: fullNumber.value, verified: false })
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '사업자번호 인증에 실패했습니다.'
    emit('verified', { businessNumber: fullNumber.value, verified: false })
  } finally {
    isVerifying.value = false
  }
}

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 14px;
  padding: 24px;
  width: 380px;
  max-width: 90vw;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a233d;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #9ca3af;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.modal-desc {
  font-size: 12.5px;
  color: #6c757d;
  margin: 0 0 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #1a233d;
}

.business-input-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.biz-input {
  height: 44px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 16px;
  text-align: center;
  color: #1a233d;
  outline: none;
  font-family: inherit;
  letter-spacing: 1px;
}

.biz-input:focus {
  border-color: #1a233d;
}
.biz-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.biz-input-3 {
  width: 64px;
}
.biz-input-2 {
  width: 48px;
}
.biz-input-5 {
  width: 96px;
}

.biz-dash {
  font-size: 16px;
  color: #9ca3af;
  flex-shrink: 0;
}

.error-msg {
  font-size: 12.5px;
  color: #ef4444;
  margin: 0 0 8px;
}

.success-msg {
  font-size: 12.5px;
  color: #22c55e;
  margin: 0 0 8px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btn-cancel {
  flex: 1;
  height: 40px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13.5px;
  color: #6c757d;
  cursor: pointer;
}

.btn-confirm {
  flex: 1.5;
  height: 40px;
  background: #1a233d;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
