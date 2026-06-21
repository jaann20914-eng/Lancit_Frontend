<template>
  <div class="message-list-wrap" ref="scrollContainer" @scroll="handleScroll">
    <div v-if="isLoadingMore" class="loading-more">이전 메시지 불러오는 중...</div>

    <div v-if="messages.length === 0 && !isLoading" class="empty-state">
      <p>아직 주고받은 메시지가 없습니다</p>
    </div>

    <template v-for="(group, idx) in groupedMessages" :key="idx">
      <div class="date-divider">
        <span>{{ group.dateLabel }}</span>
      </div>
      <ChatMessageItem
        v-for="message in group.items"
        :key="message.messageId"
        :message="message"
        :current-user-email="currentUserEmail"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick, watch } from 'vue'
import ChatMessageItem from '@/features/chat/ui/ChatMessageItem.vue'

const props = defineProps({
  messages: { type: Array, default: () => [] },
  currentUserEmail: { type: String, required: true },
  isLoading: { type: Boolean, default: false },
  isLoadingMore: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'delete', 'load-more'])

const scrollContainer = ref(null)

// 날짜별로 메시지 그룹핑 (PDF 와이어프레임처럼 "2026-06-10" 구분선)
const groupedMessages = computed(() => {
  const groups = []
  let currentDate = null
  let currentGroup = null

  for (const msg of props.messages) {
    const dateLabel = formatDateLabel(msg.createdAt)
    if (dateLabel !== currentDate) {
      currentDate = dateLabel
      currentGroup = { dateLabel, items: [] }
      groups.push(currentGroup)
    }
    currentGroup.items.push(msg)
  }

  return groups
})

function formatDateLabel(dateStr) {
  if (!dateStr) return ''
  return String(dateStr).slice(0, 10)
}

function handleScroll() {
  const el = scrollContainer.value
  if (!el) return
  // 위로 스크롤이 거의 끝까지 도달하면 이전 메시지 더 불러오기
  if (el.scrollTop < 40) {
    emit('load-more')
  }
}

function scrollToBottom() {
  nextTick(() => {
    const el = scrollContainer.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

// 메시지가 처음 로드되거나 새 메시지가 추가되면 맨 아래로 스크롤
watch(
  () => props.messages.length,
  (newLen, oldLen) => {
    if (oldLen === 0 || newLen > oldLen) {
      scrollToBottom()
    }
  },
)

onMounted(scrollToBottom)

defineExpose({ scrollToBottom })
</script>

<style scoped>
.message-list-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
}

.loading-more {
  text-align: center;
  font-size: 11px;
  color: #9ca3af;
  padding: 8px 0;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d1d5db;
  font-size: 13px;
}

.date-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16px 0 12px;
}

.date-divider span {
  font-size: 11px;
  color: #9ca3af;
  background: #f4f5f7;
  padding: 2px 10px;
  border-radius: 999px;
}
</style>
