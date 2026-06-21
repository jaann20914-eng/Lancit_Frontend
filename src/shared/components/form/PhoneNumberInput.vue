<template>
  <div class="phone-input-row">
    <input
      ref="part1Ref"
      v-model="part1"
      type="text"
      inputmode="numeric"
      maxlength="3"
      class="phone-input phone-input-3"
      placeholder="000"
      :disabled="disabled"
      @input="handleInput('part1', $event)"
    />
    <span class="phone-dash">-</span>
    <input
      ref="part2Ref"
      v-model="part2"
      type="text"
      inputmode="numeric"
      maxlength="4"
      class="phone-input phone-input-4"
      placeholder="0000"
      :disabled="disabled"
      @input="handleInput('part2', $event)"
      @keydown.backspace="handleBackspace('part1', part2, $event)"
    />
    <span class="phone-dash">-</span>
    <input
      ref="part3Ref"
      v-model="part3"
      type="text"
      inputmode="numeric"
      maxlength="4"
      class="phone-input phone-input-4"
      placeholder="0000"
      :disabled="disabled"
      @input="handleInput('part3', $event)"
      @keydown.backspace="handleBackspace('part2', part3, $event)"
    />
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'

// v-model 로 사용 - 항상 숫자만 들어있는 문자열을 주고받음 (예: "01012345678")
const props = defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const part1 = ref('')
const part2 = ref('')
const part3 = ref('')

const part1Ref = ref(null)
const part2Ref = ref(null)
const part3Ref = ref(null)

let isInternalUpdate = false

function splitDigits(digits) {
  const clean = (digits || '').replace(/\D/g, '')
  // 010-1234-5678(11자리) 형태가 기본이지만, 02-123-4567 같은 지역번호 등 변형은 고려하지 않고
  // 항상 3-4-4 형태로 고정 분리 (요청사항 기준)
  return {
    p1: clean.slice(0, 3),
    p2: clean.slice(3, 7),
    p3: clean.slice(7, 11),
  }
}

onMounted(() => {
  const { p1, p2, p3 } = splitDigits(props.modelValue)
  part1.value = p1
  part2.value = p2
  part3.value = p3
})

// 외부에서 modelValue가 바뀌는 경우(예: 폼 초기화) 동기화
watch(
  () => props.modelValue,
  (newVal) => {
    if (isInternalUpdate) {
      isInternalUpdate = false
      return
    }
    const { p1, p2, p3 } = splitDigits(newVal)
    part1.value = p1
    part2.value = p2
    part3.value = p3
  },
)

function onlyDigits(value, max) {
  return value.replace(/\D/g, '').slice(0, max)
}

function emitValue() {
  isInternalUpdate = true
  emit('update:modelValue', `${part1.value}${part2.value}${part3.value}`)
}

function handleInput(field, e) {
  const maxLen = field === 'part1' ? 3 : 4
  const cleaned = onlyDigits(e.target.value, maxLen)

  if (field === 'part1') part1.value = cleaned
  if (field === 'part2') part2.value = cleaned
  if (field === 'part3') part3.value = cleaned

  emitValue()

  if (field === 'part1' && cleaned.length === 3) {
    nextTick(() => part2Ref.value?.focus())
  } else if (field === 'part2' && cleaned.length === 4) {
    nextTick(() => part3Ref.value?.focus())
  }
}

function handleBackspace(prevField, currentValue, e) {
  if (currentValue === '' && e.key === 'Backspace') {
    if (prevField === 'part1') part1Ref.value?.focus()
    if (prevField === 'part2') part2Ref.value?.focus()
  }
}
</script>

<style scoped>
.phone-input-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.phone-input {
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
  color: #1a233d;
  outline: none;
  font-family: inherit;
}

.phone-input:focus {
  border-color: #1a233d;
}
.phone-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.phone-input-3 {
  width: 64px;
}
.phone-input-4 {
  width: 76px;
}

.phone-dash {
  font-size: 14px;
  color: #9ca3af;
  flex-shrink: 0;
}
</style>
