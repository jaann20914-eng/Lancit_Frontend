<template>
  <div :class="['message-row', isMine ? 'mine' : 'theirs']">
    <!-- 상대방 메시지일 때만 아바타 표시 -->
    <div v-if="!isMine" class="avatar">{{ senderInitial }}</div>

    <div class="message-col">
      <!-- 말풍선 -->
      <div
        :class="[
          'bubble',
          isMine ? 'bubble-mine' : 'bubble-theirs',
          message.isDeleted ? 'bubble-deleted' : '',
        ]"
      >
        <template v-if="message.isDeleted">
          <span class="deleted-text">삭제된 메시지입니다</span>
        </template>

        <template v-else-if="message.messageType === 'FILE' || message.messageType === 'IMAGE'">
          <div class="file-bubble" @click="handleDownloadFile" style="cursor: pointer">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span class="file-bubble-name">{{ message.fileName || '파일' }}</span>
          </div>
        </template>

        <template v-else>
          <p class="message-text">{{ message.message }}</p>
        </template>

        <span v-if="message.isUpdated && !message.isDeleted" class="updated-badge">(수정됨)</span>
      </div>

      <!-- 메타 줄: 시간 + 수정/삭제를 한 줄에 묶어서 바로 아래에 -->
      <div class="message-meta-row">
        <template v-if="isMine && !message.isDeleted">
          <button
            v-if="message.messageType === 'TEXT'"
            class="action-btn"
            @click="$emit('edit', message)"
          >
            수정
          </button>
          <button class="action-btn action-btn-danger" @click="$emit('delete', message)">
            삭제
          </button>
        </template>
        <span class="meta-time">{{ formatTime(message.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getFileDownloadUrl } from '@/features/contract/api/contractApi.js'

const props = defineProps({
  message: { type: Object, required: true },
  currentUserEmail: { type: String, required: true },
})

defineEmits(['edit', 'delete'])

const isMine = computed(() => props.message.senderEmail === props.currentUserEmail)

const senderInitial = computed(() => {
  const email = props.message.senderEmail || ''
  return email.charAt(0).toUpperCase()
})

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const hh = d.getHours()
  const mm = String(d.getMinutes()).padStart(2, '0')
  const period = hh < 12 ? '오전' : '오후'
  const hour12 = hh % 12 === 0 ? 12 : hh % 12
  return `${period} ${hour12}:${mm}`
}

async function handleDownloadFile() {
  if (!props.message.fileId) return
  try {
    const response = await getFileDownloadUrl(props.message.fileId)
    const blobUrl = URL.createObjectURL(response.data)
    const a = window.document.createElement('a')
    a.href = blobUrl
    a.download = props.message.fileName || `파일_${props.message.fileId}`
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    alert('파일 다운로드에 실패했습니다.')
  }
}
</script>

<style scoped>
.message-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  padding: 0 16px;
}

.message-row.mine {
  justify-content: flex-end;
}

.message-row.theirs {
  justify-content: flex-start;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #d1d5db;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 2px;
}

.message-col {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.mine .message-col {
  align-items: flex-end;
}

.theirs .message-col {
  align-items: flex-start;
}

.bubble {
  padding: 9px 13px;
  border-radius: 14px;
  font-size: 13.5px;
  line-height: 1.5;
  word-break: break-word;
  max-width: 100%;
}

.bubble-mine {
  background: #1a233d;
  color: white;
  border-bottom-right-radius: 4px;
}

.bubble-theirs {
  background: #f3f4f6;
  color: #1a233d;
  border-bottom-left-radius: 4px;
}

.bubble-deleted {
  background: #f9fafb;
  border: 1px dashed #d1d5db;
}

.deleted-text {
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
}

.message-text {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.updated-badge {
  font-size: 10px;
  opacity: 0.6;
  margin-left: 4px;
}

.file-bubble {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 140px;
}

.file-bubble-name {
  flex: 1;
  font-size: 12.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-bubble-size {
  font-size: 10px;
  opacity: 0.7;
  flex-shrink: 0;
}

/* 시간 + 수정/삭제를 한 줄에, 말풍선 바로 아래 딱 붙여서 가시성 확보 */
.message-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
}

.meta-time {
  font-size: 10px;
  color: #b0b5bd;
  white-space: nowrap;
}

.action-btn {
  background: none;
  border: none;
  font-size: 10.5px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
}

.action-btn:hover {
  color: #1a233d;
  text-decoration: underline;
}
.action-btn-danger:hover {
  color: #ef4444;
  text-decoration: underline;
}
</style>
