<template>
  <Teleport to="body">
    <div class="manage-overlay" role="presentation" @click.self="closeModal">
      <section class="manage-modal" role="dialog" aria-modal="true" aria-labelledby="category-manage-title">
        <header class="modal-header">
          <div>
            <p class="modal-eyebrow">CATEGORY</p>
            <h2 id="category-manage-title">카테고리 관리</h2>
            <p>백엔드에 등록된 카테고리를 수정하거나 삭제합니다.</p>
          </div>
          <button type="button" class="icon-button" aria-label="카테고리 관리 닫기" :disabled="submitting" @click="closeModal">×</button>
        </header>

        <div class="category-list">
          <article v-for="category in categories" :key="category.id" class="category-item">
            <template v-if="editingId === category.id">
              <form class="edit-form" @submit.prevent="submitUpdate(category.id)">
                <input v-model="editName" type="text" maxlength="100" aria-label="수정할 카테고리명" required />
                <input v-model="editColor" type="color" aria-label="수정할 카테고리 색상" />
                <button type="submit" :disabled="submitting">저장</button>
                <button type="button" :disabled="submitting" @click="cancelEdit">취소</button>
              </form>
            </template>
            <template v-else>
              <div class="category-info">
                <span class="color-dot" :style="{ '--category-color': category.color || '#64748B' }"></span>
                <div>
                  <strong>{{ category.label }}</strong>
                  <code>{{ category.color || '색상 미지정' }}</code>
                </div>
              </div>
              <div class="item-actions">
                <button type="button" :aria-label="`${category.label} 수정`" :disabled="submitting" @click="startEdit(category)">수정</button>
                <button type="button" class="delete-button" :aria-label="`${category.label} 삭제`" :disabled="submitting" @click="startDelete(category)">삭제</button>
              </div>
            </template>
          </article>
        </div>

        <section v-if="deleteTarget" class="delete-panel" aria-label="카테고리 삭제 확인">
          <strong>'{{ deleteTarget.label }}' 카테고리를 삭제할까요?</strong>
          <template v-if="moveTargets.length">
            <p>연결된 일정은 아래 카테고리로 이동한 뒤 삭제됩니다.</p>
            <select v-model="moveToCategoryId" aria-label="연결 일정 이동 카테고리">
              <option v-for="category in moveTargets" :key="category.id" :value="String(category.id)">
                {{ category.label }}
              </option>
            </select>
          </template>
          <p v-else>연결된 일정이 있으면 백엔드 정책에 따라 삭제할 수 없습니다.</p>
          <div class="delete-actions">
            <button type="button" :disabled="submitting" @click="cancelDelete">취소</button>
            <button type="button" class="confirm-delete" :disabled="submitting" @click="submitDelete">
              {{ submitting ? '처리 중...' : '카테고리 삭제' }}
            </button>
          </div>
        </section>

        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  categories: { type: Array, required: true },
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'update', 'delete'])
const editingId = ref(null)
const editName = ref('')
const editColor = ref('#4A6FA5')
const deleteTarget = ref(null)
const moveToCategoryId = ref('')

const moveTargets = computed(() => props.categories.filter(
  (category) => category.id !== deleteTarget.value?.id,
))

function closeModal() {
  if (!props.submitting) emit('close')
}

function startEdit(category) {
  deleteTarget.value = null
  editingId.value = category.id
  editName.value = category.label
  editColor.value = category.color || '#4A6FA5'
}

function cancelEdit() {
  editingId.value = null
}

function submitUpdate(categoryId) {
  const categoryName = editName.value.trim()
  if (!categoryName) return
  emit('update', { categoryId, categoryName, color: editColor.value.toUpperCase() })
}

function startDelete(category) {
  editingId.value = null
  deleteTarget.value = category
  moveToCategoryId.value = moveTargets.value[0]?.id != null ? String(moveTargets.value[0].id) : ''
}

function cancelDelete() {
  deleteTarget.value = null
  moveToCategoryId.value = ''
}

function submitDelete() {
  emit('delete', {
    categoryId: deleteTarget.value.id,
    categoryName: deleteTarget.value.label,
    moveToCategoryId: moveToCategoryId.value ? Number(moveToCategoryId.value) : null,
  })
}

function handleKeydown(event) {
  if (event.key === 'Escape') closeModal()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.manage-overlay { position: fixed; inset: 0; z-index: 410; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(15, 23, 42, .48); }
.manage-modal { width: min(100%, 600px); max-height: 90vh; overflow-y: auto; padding: 28px; border-radius: 14px; background: #fff; box-shadow: 0 20px 60px rgba(15, 23, 42, .22); }
.modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 22px; }
.modal-eyebrow { margin: 0 0 6px; color: #4a6fa5; font-size: 10px; font-weight: 800; letter-spacing: .14em; }
.modal-header h2 { margin: 0; color: #1a233d; font-size: 22px; }
.modal-header p:not(.modal-eyebrow) { margin: 6px 0 0; color: #64748b; font-size: 13px; }
.icon-button { width: 34px; height: 34px; padding: 0; border: 0; border-radius: 8px; background: transparent; color: #64748b; font-size: 26px; cursor: pointer; }
.category-list { display: grid; gap: 9px; }
.category-item { display: flex; align-items: center; justify-content: space-between; gap: 14px; min-height: 62px; padding: 11px 13px; border: 1px solid #e2e6ec; border-radius: 9px; }
.category-info { display: flex; align-items: center; gap: 11px; min-width: 0; }
.color-dot { width: 12px; height: 34px; flex-shrink: 0; border-radius: 999px; background: var(--category-color); }
.category-info div { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.category-info strong { overflow: hidden; color: #253047; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.category-info code { color: #94a3b8; font-family: inherit; font-size: 10px; }
.item-actions { display: flex; gap: 6px; }
.item-actions button,
.delete-actions button,
.edit-form button { min-height: 32px; padding: 0 10px; border: 1px solid #d7dce4; border-radius: 7px; background: #fff; color: #475569; font-size: 12px; font-weight: 600; cursor: pointer; }
.item-actions .delete-button { border-color: #fecdd3; color: #be123c; }
.edit-form { display: grid; width: 100%; grid-template-columns: minmax(0, 1fr) 40px auto auto; gap: 7px; }
.edit-form input[type='text'],
.delete-panel select { width: 100%; height: 36px; padding: 0 10px; border: 1px solid #d7dce4; border-radius: 7px; font: inherit; font-size: 13px; }
.edit-form input[type='color'] { width: 40px; height: 36px; padding: 2px; border: 1px solid #d7dce4; border-radius: 7px; background: #fff; }
.delete-panel { margin-top: 14px; padding: 16px; border: 1px solid #fecdd3; border-radius: 9px; background: #fff7f8; }
.delete-panel strong { color: #881337; font-size: 14px; }
.delete-panel p { margin: 6px 0 11px; color: #64748b; font-size: 12px; line-height: 1.5; }
.delete-actions { display: flex; justify-content: flex-end; gap: 7px; margin-top: 12px; }
.delete-actions .confirm-delete { border-color: #be123c; background: #be123c; color: #fff; }
.form-error { margin: 14px 0 0; padding: 11px 13px; border-radius: 8px; background: #fff1f2; color: #991b1b; font-size: 12px; }
button:disabled { opacity: .55; cursor: wait; }
@media (max-width: 560px) {
  .manage-overlay { align-items: flex-end; padding: 0; }
  .manage-modal { width: 100%; padding: 22px; border-radius: 16px 16px 0 0; }
  .category-item { align-items: flex-start; flex-direction: column; }
  .item-actions { width: 100%; justify-content: flex-end; }
  .edit-form { grid-template-columns: minmax(0, 1fr) 40px; }
}
</style>
