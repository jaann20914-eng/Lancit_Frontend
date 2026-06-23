<template>
  <Teleport to="body">
    <div
      class="calendar-modal-overlay"
      role="presentation"
      @click.self="$emit('close')"
    >
      <section
        class="calendar-event-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-modal-title"
      >
        <header class="modal-heading">
          <div>
            <span
              :class="['category-badge', event.categoryClassName]"
              :style="categoryStyle"
            >
              {{ event.categoryLabel }}
            </span>
            <h2 id="calendar-event-modal-title">{{ event.title }}</h2>
          </div>
          <button class="icon-button" type="button" aria-label="상세 모달 닫기" @click="$emit('close')">
            ×
          </button>
        </header>

        <dl class="event-details">
          <div class="detail-row">
            <dt>일정</dt>
            <dd>
              <time :datetime="toDateTimeAttribute(event.start)">{{ formatDateTime(event.start) }}</time>
              <span class="date-separator">–</span>
              <time :datetime="toDateTimeAttribute(event.end)">{{ formatDateTime(event.end) }}</time>
            </dd>
          </div>
          <div class="detail-row">
            <dt>상태</dt>
            <dd><span :class="['status-badge', event.statusClassName]">{{ event.statusLabel }}</span></dd>
          </div>
          <div class="detail-row">
            <dt>설명</dt>
            <dd class="preserve-lines">{{ event.description || '등록된 설명이 없습니다.' }}</dd>
          </div>
          <div v-if="event.memo" class="detail-row">
            <dt>메모</dt>
            <dd class="preserve-lines">{{ event.memo }}</dd>
          </div>
          <div v-if="event.clientCompany" class="detail-row">
            <dt>고객사</dt>
            <dd>{{ event.clientCompany }}</dd>
          </div>
          <div v-if="connectionTargetLabel" class="detail-row">
            <dt>연결 대상</dt>
            <dd>{{ connectionTargetLabel }}</dd>
          </div>
          <div v-if="event.autoRegisteredSource" class="detail-row">
            <dt>등록 출처</dt>
            <dd>{{ event.autoRegisteredSource }}</dd>
          </div>
        </dl>

        <footer class="modal-actions">
          <button class="delete-button" type="button" @click="$emit('delete', event)">삭제</button>
          <button class="edit-button" type="button" @click="$emit('edit', event)">수정</button>
          <button class="close-button" type="button" @click="$emit('close')">닫기</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close', 'edit', 'delete'])

const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const categoryStyle = computed(() => (
  props.event.categoryColor
    ? { '--calendar-category-color': props.event.categoryColor }
    : undefined
))
const connectionTargetLabel = computed(() => {
  const label = normalizeLabel(
    props.event.connectionTargetLabel
      || props.event.relatedTargetLabel
      || props.event.linkedTargetLabel
      || props.event.referenceLabel,
  )
  return isInternalTaskLabel(label) ? '' : label
})

function formatDateTime(value) {
  if (!value) return '일시 미정'
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '일시 미정' : dateTimeFormatter.format(date)
}

function normalizeLabel(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isInternalTaskLabel(label) {
  return /^(?:캘린더\s*)?일정\s*#\d+$|^TASK\s*#\d+$/i.test(label)
}

function toDateTimeAttribute(value) {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function handleKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.calendar-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.48);
}

.calendar-event-modal {
  width: min(100%, 520px);
  max-height: 90vh;
  overflow-y: auto;
  padding: 28px;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.22);
}

.modal-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-heading h2 {
  margin: 10px 0 0;
  color: #1a233d;
  font-size: 22px;
  line-height: 1.35;
}

.category-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 25px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.category-badge {
  border: 1px solid var(--calendar-category-color, #94a3b8);
  color: var(--calendar-category-color, #64748b);
  background: #ffffff;
}

.status-badge.calendar-status-in-progress { background: #dcfce7; color: #15803d; }
.status-badge.calendar-status-completed { background: #f3f4f6; color: #4b5563; }
.status-badge.calendar-status-cancelled { background: #fee2e2; color: #991b1b; }
.status-badge.calendar-status-unknown { background: #fef3c7; color: #92400e; }

.icon-button {
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
}

.icon-button:hover { background: #f1f5f9; color: #1a233d; }

.event-details {
  display: grid;
  gap: 0;
  margin: 0;
}

.detail-row {
  display: grid;
  grid-template-columns: 94px minmax(0, 1fr);
  gap: 16px;
  padding: 17px 0;
  border-bottom: 1px solid #eef1f5;
}

.detail-row dt {
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

.detail-row dd {
  margin: 0;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.55;
}

.date-separator { margin: 0 5px; color: #94a3b8; }
.preserve-lines { white-space: pre-wrap; overflow-wrap: anywhere; }

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 22px;
}

.close-button,
.edit-button,
.delete-button {
  min-width: 88px;
  height: 40px;
  padding: 0 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.close-button { border: 1px solid #d7dce4; background: #ffffff; color: #475569; }
.edit-button { border: 1px solid #1a233d; background: #1a233d; color: #ffffff; }
.delete-button { margin-right: auto; border: 1px solid #fecdd3; background: #ffffff; color: #be123c; }
.close-button:hover { border-color: #cbd5e1; background: #f8fafc; color: #1a233d; }
.edit-button:hover { background: #283554; }
.delete-button:hover { background: #fff1f2; }

@media (max-width: 560px) {
  .calendar-modal-overlay { align-items: flex-end; padding: 0; }
  .calendar-event-modal { width: 100%; max-height: 92vh; padding: 22px; border-radius: 16px 16px 0 0; }
  .detail-row { grid-template-columns: 1fr; gap: 6px; }
  .modal-actions { flex-wrap: wrap; }
  .delete-button { margin-right: 0; }
}
</style>
