<template>
  <Teleport to="body">
    <div class="confirm-overlay" role="presentation" @click.self="closeModal">
      <section class="confirm-modal" role="alertdialog" aria-modal="true" :aria-labelledby="titleId">
        <div class="warning-icon" aria-hidden="true">!</div>
        <h2 :id="titleId">{{ title }}</h2>
        <p>{{ message }}</p>
        <p v-if="error" class="confirm-error" role="alert">{{ error }}</p>
        <footer>
          <button type="button" class="cancel-button" :disabled="submitting" @click="closeModal">취소</button>
          <button type="button" class="confirm-button" :disabled="submitting" @click="$emit('confirm')">
            {{ submitting ? '삭제 중...' : confirmLabel }}
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmLabel: { type: String, default: '삭제' },
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'confirm'])
const titleId = computed(() => `confirm-${props.title.replaceAll(' ', '-')}`)

function closeModal() {
  if (!props.submitting) emit('close')
}

function handleKeydown(event) {
  if (event.key === 'Escape') closeModal()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.confirm-overlay { position: fixed; inset: 0; z-index: 420; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(15, 23, 42, .52); }
.confirm-modal { width: min(100%, 410px); padding: 28px; border-radius: 14px; background: #fff; text-align: center; box-shadow: 0 20px 60px rgba(15, 23, 42, .25); }
.warning-icon { display: grid; width: 44px; height: 44px; margin: 0 auto 14px; place-items: center; border-radius: 50%; background: #ffe4e6; color: #be123c; font-size: 22px; font-weight: 800; }
.confirm-modal h2 { margin: 0; color: #1a233d; font-size: 20px; }
.confirm-modal > p { margin: 10px 0 0; color: #64748b; font-size: 13px; line-height: 1.55; }
.confirm-modal .confirm-error { padding: 10px; border-radius: 7px; background: #fff1f2; color: #991b1b; }
.confirm-modal footer { display: flex; justify-content: center; gap: 8px; margin-top: 22px; }
.confirm-modal button { min-width: 94px; height: 40px; padding: 0 15px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.confirm-modal button:disabled { opacity: .55; cursor: wait; }
.cancel-button { border: 1px solid #d7dce4; background: #fff; color: #475569; }
.confirm-button { border: 1px solid #be123c; background: #be123c; color: #fff; }
</style>
