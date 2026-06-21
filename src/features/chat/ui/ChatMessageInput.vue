<template>
  <div class="input-wrap">
    <input ref="fileInputRef" type="file" style="display: none" @change="handleFileSelect" />

    <button class="btn-attach" :disabled="disabled" @click="triggerFileInput">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
        />
      </svg>
    </button>

    <textarea
      v-model="content"
      class="text-input"
      :placeholder="disabled ? '채팅을 사용할 수 없습니다' : '채팅을 입력하세요'"
      :disabled="disabled"
      rows="1"
      ref="textareaRef"
      @input="autoResize"
      @keydown.enter.exact.prevent="handleSend"
      @keydown.enter.shift.exact="() => {}"
    ></textarea>

    <button class="btn-send" :disabled="disabled || !content.trim()" @click="handleSend">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['send', 'send-file'])

const content = ref('')
const textareaRef = ref(null)
const fileInputRef = ref(null)

function autoResize() {
  nextTick(() => {
    const el = textareaRef.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  })
}

function handleSend() {
  const trimmed = content.value.trim()
  if (!trimmed || props.disabled) return
  emit('send', trimmed)
  content.value = ''
  nextTick(() => {
    if (textareaRef.value) textareaRef.value.style.height = 'auto'
  })
}

function triggerFileInput() {
  if (props.disabled) return
  fileInputRef.value?.click()
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (!file) return
  emit('send-file', file)
  e.target.value = ''
}
</script>

<style scoped>
.input-wrap {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 18px 16px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.btn-attach {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 6px;
}

.btn-attach:hover:not(:disabled) {
  background: #f3f4f6;
  color: #1a233d;
}
.btn-attach:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.text-input {
  flex: 1;
  resize: none;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13.5px;
  font-family: inherit;
  line-height: 1.5;
  min-height: 80px;
  max-height: 160px;
  outline: none;
}

.text-input:focus {
  border-color: #1a233d;
}
.text-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.btn-send {
  width: 38px;
  /* height: 38px; */
  height: 100%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #6d5bd0;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-send:hover:not(:disabled) {
  background: #5a4ab8;
}
</style>
