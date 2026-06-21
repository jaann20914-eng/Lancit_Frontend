<template>
  <Teleport to="body">
    <div class="form-modal-overlay" role="presentation" @click.self="closeModal">
      <section
        class="form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-create-title"
      >
        <header class="modal-header">
          <div>
            <p class="modal-eyebrow">CATEGORY</p>
            <h2 id="category-create-title">카테고리 등록</h2>
            <p>일정을 구분할 이름과 색상을 입력해주세요.</p>
          </div>
          <button type="button" class="icon-button" aria-label="카테고리 등록 닫기" :disabled="submitting" @click="closeModal">×</button>
        </header>

        <form @submit.prevent="handleSubmit">
          <label class="form-field">
            <span>카테고리명 <em>*</em></span>
            <input
              v-model="categoryName"
              type="text"
              maxlength="100"
              placeholder="예: 고객 미팅"
              autocomplete="off"
              required
            />
            <small>{{ categoryName.length }}/100</small>
          </label>

          <label class="form-field">
            <span>카테고리 색상 <em>*</em></span>
            <div class="color-field">
              <input v-model="color" type="color" aria-label="카테고리 색상 선택" />
              <code>{{ color.toUpperCase() }}</code>
              <span class="color-preview" :style="{ '--preview-color': color }">미리보기</span>
            </div>
          </label>

          <p v-if="localError || error" class="form-error" role="alert">{{ localError || error }}</p>

          <footer class="modal-actions">
            <button type="button" class="button button-secondary" :disabled="submitting" @click="closeModal">취소</button>
            <button type="submit" class="button button-primary" :disabled="submitting">
              {{ submitting ? '등록 중...' : '카테고리 등록' }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const categoryName = ref('')
const color = ref('#4A6FA5')
const localError = ref('')

function closeModal() {
  if (!props.submitting) emit('close')
}

function handleSubmit() {
  const name = categoryName.value.trim()
  localError.value = ''

  if (!name) {
    localError.value = '카테고리명을 입력해주세요.'
    return
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(color.value)) {
    localError.value = '색상은 6자리 HEX 형식이어야 합니다.'
    return
  }

  emit('submit', { categoryName: name, color: color.value.toUpperCase() })
}

function handleKeydown(event) {
  if (event.key === 'Escape') closeModal()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.form-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 410;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.48);
}

.form-modal {
  width: min(100%, 470px);
  max-height: 90vh;
  overflow-y: auto;
  padding: 28px;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.22);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.modal-eyebrow { margin: 0 0 6px; color: #4a6fa5; font-size: 10px; font-weight: 800; letter-spacing: .14em; }
.modal-header h2 { margin: 0; color: #1a233d; font-size: 22px; }
.modal-header p:not(.modal-eyebrow) { margin: 6px 0 0; color: #64748b; font-size: 13px; }
.icon-button { width: 34px; height: 34px; padding: 0; border: 0; border-radius: 8px; background: transparent; color: #64748b; font-size: 26px; cursor: pointer; }
.icon-button:hover:not(:disabled) { background: #f1f5f9; color: #1a233d; }

.form-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.form-field > span { color: #334155; font-size: 13px; font-weight: 600; }
.form-field em { color: #dc2626; font-style: normal; }
.form-field input[type='text'] { width: 100%; height: 44px; padding: 0 13px; border: 1px solid #d7dce4; border-radius: 8px; color: #1f2937; font: inherit; font-size: 14px; outline: none; }
.form-field input[type='text']:focus { border-color: #4a6fa5; box-shadow: 0 0 0 3px rgba(74, 111, 165, .1); }
.form-field small { align-self: flex-end; color: #94a3b8; font-size: 11px; }

.color-field { display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 7px 10px; border: 1px solid #d7dce4; border-radius: 8px; }
.color-field input { width: 36px; height: 32px; padding: 0; border: 0; background: transparent; cursor: pointer; }
.color-field code { color: #475569; font-family: inherit; font-size: 13px; }
.color-preview { margin-left: auto; padding: 5px 9px; border-radius: 999px; background: var(--preview-color); color: #ffffff; font-size: 11px; font-weight: 700; }

.form-error { margin: 0 0 18px; padding: 11px 13px; border-radius: 8px; background: #fff1f2; color: #991b1b; font-size: 12px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 9px; padding-top: 4px; }
.button { min-width: 94px; height: 40px; padding: 0 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.button:disabled { opacity: .55; cursor: wait; }
.button-secondary { border: 1px solid #d7dce4; background: #ffffff; color: #475569; }
.button-primary { border: 1px solid #1a233d; background: #1a233d; color: #ffffff; }
.button-primary:hover:not(:disabled) { background: #283554; }

@media (max-width: 560px) {
  .form-modal-overlay { align-items: flex-end; padding: 0; }
  .form-modal { width: 100%; padding: 22px; border-radius: 16px 16px 0 0; }
}
</style>
